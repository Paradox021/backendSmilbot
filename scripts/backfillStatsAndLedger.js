// Script para migrar y calcular estadísticas históricas de los usuarios con Snapshot de Apertura,
// normalización de inventario a [{ cardId, count }] y migración de ofertas a la colección independiente market_offers
// Uso: node scripts/backfillStatsAndLedger.js [--dry-run]

import mongoose from 'mongoose'
import * as dotenv from 'dotenv'
import { User } from '../models/user.js'
import { Card } from '../models/card.js'
import { Market, MarketOffer } from '../models/market.js'
import { Transaction } from '../models/transaction.js'

dotenv.config()

const isDryRun = process.argv.includes('--dry-run')

const RARITY_NAMES = {
    0: 'common',
    1: 'rare',
    2: 'epic',
    3: 'legendary',
    4: 'mythic'
}

async function runBackfill() {
    try {
        console.log('='.repeat(70))
        console.log(`📊 Iniciando Migración, Telemetría Histórica y Mercado Independiente`)
        console.log(`   Modo: ${isDryRun ? '🔍 [DRY-RUN (Simulación sin cambios)]' : '💾 [APLICAR (Guardar en MongoDB)]'}`)
        console.log('='.repeat(70))

        if (!process.env.URL_DB) {
            throw new Error('URL_DB no está definido en el archivo .env')
        }

        mongoose.set('strictQuery', true)
        await mongoose.connect(process.env.URL_DB)
        console.log('✅ Conectado a MongoDB con éxito.\n')

        // 1. Cargar catálogo de cartas para mapear rarezas rápidamente
        const allCards = await Card.find().lean()
        const cardTypeMap = new Map() // cardId (string) -> type (number 0..4)
        allCards.forEach(c => cardTypeMap.set(c._id.toString(), c.type))
        console.log(`🎴 Catálogo de cartas cargado: ${allCards.length} cartas registradas.`)

        // 2. Cargar usuarios básicos para mapear _id -> discordId
        const rawUsers = await User.find().lean()
        const userDiscordMap = new Map() // userId (string) -> discordId (string)
        rawUsers.forEach(u => userDiscordMap.set(u._id.toString(), u.discordId))

        // 3. Procesar y migrar ofertas del Mercado a la colección independiente market_offers
        const legacyMarkets = await Market.find().lean()
        let totalOffersMigrated = 0

        for (const market of legacyMarkets) {
            for (const offer of (market.offers || [])) {
                let status = offer.status
                if (!status) {
                    if (offer.active === false && offer.buyer) {
                        status = 'SOLD'
                    } else if (offer.active === false) {
                        status = 'CANCELLED'
                    } else {
                        status = 'ACTIVE'
                    }
                }

                const sellerIdStr = offer.seller ? offer.seller.toString() : null
                const buyerIdStr = offer.buyer ? offer.buyer.toString() : null
                const sellerDiscordId = sellerIdStr ? (userDiscordMap.get(sellerIdStr) || null) : null
                const buyerDiscordId = buyerIdStr ? (userDiscordMap.get(buyerIdStr) || offer.buyerDiscordId || null) : null

                const offerDoc = {
                    serverId: market.discordId,
                    seller: offer.seller,
                    sellerDiscordId,
                    cardId: offer.cardId,
                    price: offer.price,
                    status,
                    active: status === 'ACTIVE',
                    buyer: offer.buyer || null,
                    buyerDiscordId,
                    soldPrice: offer.soldPrice || (status === 'SOLD' ? offer.price : null),
                    soldAt: offer.soldAt || (status === 'SOLD' ? (offer.updatedAt || new Date()) : null),
                    cancelledAt: offer.cancelledAt || (status === 'CANCELLED' ? (offer.updatedAt || new Date()) : null),
                    createdAt: offer.createdAt || new Date(),
                    updatedAt: offer.updatedAt || new Date()
                }

                if (!isDryRun) {
                    await MarketOffer.updateOne(
                        { _id: offer._id },
                        { $set: offerDoc },
                        { upsert: true }
                    )
                }
                totalOffersMigrated++
            }
        }

        // Limpiar el campo offers obsoleto de la colección antigua markets
        if (!isDryRun && legacyMarkets.length > 0) {
            await Market.updateMany({}, { $unset: { offers: "" } })
            console.log(`🧹 Campo legacy 'offers' limpiado con éxito de la colección 'markets'.`)
        }

        console.log(`🛒 Ofertas de mercado procesadas y sincronizadas en market_offers: ${totalOffersMigrated}`)

        // 4. Analizar todas las ofertas en market_offers para calcular métricas por usuario
        const allOffers = await MarketOffer.find().lean()
        const salesBySeller = new Map() // sellerId -> { totalEarned, count }
        const purchasesByBuyer = new Map() // buyerId -> { totalSpent, count }
        const activeOffersBySeller = new Map() // sellerId -> count

        for (const offer of allOffers) {
            const sellerId = offer.seller ? offer.seller.toString() : null
            const buyerId = offer.buyer ? offer.buyer.toString() : null
            const price = offer.soldPrice || offer.price || 0

            if (offer.status === 'SOLD' || (offer.active === false && offer.buyer)) {
                if (sellerId) {
                    const prev = salesBySeller.get(sellerId) || { totalEarned: 0, count: 0 }
                    salesBySeller.set(sellerId, {
                        totalEarned: prev.totalEarned + price,
                        count: prev.count + 1
                    })
                }

                if (buyerId) {
                    const prev = purchasesByBuyer.get(buyerId) || { totalSpent: 0, count: 0 }
                    purchasesByBuyer.set(buyerId, {
                        totalSpent: prev.totalSpent + price,
                        count: prev.count + 1
                    })
                }
            } else if (offer.status === 'ACTIVE' || offer.active === true) {
                if (sellerId) {
                    const prevCount = activeOffersBySeller.get(sellerId) || 0
                    activeOffersBySeller.set(sellerId, prevCount + 1)
                }
            }
        }

        // 5. Procesar Usuarios
        console.log(`👥 Analizando ${rawUsers.length} usuarios y normalizando inventarios...\n`)

        const summary = []
        const migrationTimestamp = new Date()

        for (const user of rawUsers) {
            const userId = user._id.toString()
            const sellerData = salesBySeller.get(userId) || { totalEarned: 0, count: 0 }
            const buyerData = purchasesByBuyer.get(userId) || { totalSpent: 0, count: 0 }
            const activeOffersCount = activeOffersBySeller.get(userId) || 0

            // Normalizar cartas de formato plano [ObjectId] a subdocumentos [{ cardId, count }]
            const rawCards = user.cards || []
            const cardCountsMap = new Map() // cardId (string) -> count (number)

            for (const item of rawCards) {
                if (!item) continue
                let idStr
                let count = 1
                if (item.cardId) {
                    idStr = item.cardId.toString()
                    count = Number(item.count) || 1
                } else {
                    idStr = item.toString()
                }
                cardCountsMap.set(idStr, (cardCountsMap.get(idStr) || 0) + count)
            }

            const normalizedCards = Array.from(cardCountsMap.entries()).map(([cardId, count]) => ({
                cardId,
                count
            }))

            const currentCardsCount = Array.from(cardCountsMap.values()).reduce((sum, c) => sum + c, 0)
            const marketSalesCount = sellerData.count
            const marketEarnings = sellerData.totalEarned
            const marketSpending = buyerData.totalSpent
            const marketPurchasesCount = buyerData.count

            // Estimación de cartas obtenidas por gacha (.getcard / rollRandomCard a 100 monedas)
            const estimatedGachaCards = Math.max(0, currentCardsCount - marketPurchasesCount + marketSalesCount)
            const gachaSpending = estimatedGachaCards * 100

            // Gasto total = gasto en mercado + gasto en gacha
            const totalCoinsSpent = marketSpending + gachaSpending

            // Ganancia total = balance actual + gasto total (o al menos las ganancias de mercado)
            const totalCoinsEarned = Math.max((user.balance || 0) + totalCoinsSpent, marketEarnings)

            // Dinero obtenido por dailies
            const moneyFromDailies = Math.max(0, totalCoinsEarned - marketEarnings)
            let totalDailiesClaimed = Math.floor(moneyFromDailies / 100)

            const lastDailyDate = user.lastDaily || user.lastTimeCommand
            if (lastDailyDate && totalDailiesClaimed === 0) {
                totalDailiesClaimed = 1
            }

            // Rachas
            let dailyStreak = 0
            if (lastDailyDate) {
                const diffHours = (Date.now() - new Date(lastDailyDate).getTime()) / (1000 * 60 * 60)
                if (diffHours <= 48) {
                    dailyStreak = 1
                }
            }
            const maxDailyStreak = Math.max(dailyStreak, totalDailiesClaimed > 0 ? 1 : 0)
            const previousMaxStreak = (dailyStreak === 0) ? maxDailyStreak : 0

            // Desglose por rareza
            const byRarity = {
                common: 0,
                rare: 0,
                epic: 0,
                legendary: 0,
                mythic: 0
            }

            for (const [idStr, count] of cardCountsMap.entries()) {
                const cType = cardTypeMap.get(idStr)
                const rarityKey = RARITY_NAMES[cType] || 'common'
                byRarity[rarityKey] += count
            }

            // Construir el Snapshot de Apertura (Genesis)
            const legacySnapshot = {
                economy: {
                    initialBalance: user.balance || 0,
                    estimatedTotalEarned: totalCoinsEarned,
                    estimatedTotalSpent: totalCoinsSpent
                },
                inventory: {
                    totalCards: currentCardsCount,
                    distinctCardsCount: normalizedCards.length,
                    byRarity,
                    cardsBreakdown: normalizedCards
                },
                gacha: {
                    estimatedCardsOpened: estimatedGachaCards,
                    estimatedSpending: gachaSpending
                },
                market: {
                    salesCount: marketSalesCount,
                    totalEarnedFromSales: marketEarnings,
                    purchasesCount: marketPurchasesCount,
                    totalSpentOnPurchases: marketSpending,
                    activeOffersAtMigration: activeOffersCount
                },
                dailies: {
                    totalDailiesClaimed,
                    lastDailyRecorded: lastDailyDate,
                    initialDailyStreak: dailyStreak
                }
            }

            if (!isDryRun) {
                await User.updateOne(
                    { _id: user._id },
                    {
                        $set: {
                            cards: normalizedCards,
                            dailyStreak,
                            maxDailyStreak,
                            previousMaxStreak,
                            totalDailiesClaimed,
                            totalCoinsEarned,
                            totalCoinsSpent,
                            cardsOpenedCount: estimatedGachaCards,
                            lastDaily: user.lastDaily || user.lastTimeCommand || new Date()
                        }
                    }
                )

                // Crear transacción inicial de apertura en el Ledger SOLO SI no existe ninguna previa (idempotente)
                const existingTx = await Transaction.findOne({ discordId: user.discordId })
                if (!existingTx) {
                    await Transaction.create({
                        discordId: user.discordId,
                        type: 'ADMIN_ADJUST',
                        amount: user.balance || 0,
                        balanceBefore: 0,
                        balanceAfter: user.balance || 0,
                        metadata: {
                            note: 'Snapshot inicial de migración al Ledger (Genesis)',
                            migratedAt: migrationTimestamp,
                            legacySnapshot
                        }
                    })
                }
            }

            summary.push({
                Usuario: user.username,
                DiscordId: user.discordId,
                Balance: user.balance,
                Ganado: totalCoinsEarned,
                Gastado: totalCoinsSpent,
                Dailies: totalDailiesClaimed,
                Racha: dailyStreak,
                MaxRacha: maxDailyStreak,
                TotalCartas: currentCardsCount,
                Distintas: normalizedCards.length,
                Míticas: byRarity.mythic,
                Legendarias: byRarity.legendary,
                Épicas: byRarity.epic
            })
        }

        console.table(summary)

        console.log('\n' + '='.repeat(70))
        if (isDryRun) {
            console.log('🔍 [DRY-RUN COMPLETADO] Se normalizaron inventarios, mercado y snapshots en memoria.')
            console.log('💡 Ejecuta `npm run backfill` para guardar los cambios y las transacciones en MongoDB.')
        } else {
            console.log('🎉 [MIGRACIÓN EXITOSA] Usuarios, inventarios [{ cardId, count }] y colección market_offers sincronizados en MongoDB.')
        }
        console.log('='.repeat(70))

    } catch (error) {
        console.error('❌ Error durante la migración:', error)
    } finally {
        await mongoose.disconnect()
        console.log('🔌 Conexión a MongoDB cerrada.')
        process.exit(0)
    }
}

runBackfill()
