// Script para migrar y calcular estadísticas históricas de los usuarios con Snapshot de Apertura
// Uso: node scripts/backfillStatsAndLedger.js [--dry-run]

import mongoose from 'mongoose'
import * as dotenv from 'dotenv'
import { User } from '../models/user.js'
import { Card } from '../models/card.js'
import { Market } from '../models/market.js'
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
        console.log(`📊 Iniciando Migración, Telemetría Histórica y Snapshot de Apertura`)
        console.log(`   Modo: ${isDryRun ? '🔍 [DRY-RUN (Simulación sin cambios)]' : '💾 [APLICAR (Guardar en MongoDB)]'}`)
        console.log('='.repeat(70))

        if (!process.env.URL_DB) {
            throw new Error('URL_DB no está definido en el archivo .env')
        }

        mongoose.set('strictQuery', true)
        await mongoose.connect(process.env.URL_DB)
        console.log('✅ Conectado a MongoDB con éxito.\n')

        // 1. Cargar catálogo de cartas para mapear rarezas rápidamente
        const allCards = await Card.find()
        const cardTypeMap = new Map() // cardId (string) -> type (number 0..4)
        allCards.forEach(c => cardTypeMap.set(c._id.toString(), c.type))
        console.log(`🎴 Catálogo de cartas cargado: ${allCards.length} cartas registradas.`)

        // 2. Procesar ofertas del Mercado
        const markets = await Market.find()
        const salesBySeller = new Map() // sellerId -> { totalEarned, count }
        const purchasesByBuyer = new Map() // buyerId -> { totalSpent, count }
        const activeOffersBySeller = new Map() // sellerId -> count

        let totalOffersUpdated = 0

        for (const market of markets) {
            let marketModified = false
            for (const offer of market.offers) {
                // Sincronizar status si no existía
                if (!offer.status) {
                    if (offer.active === false && offer.buyer) {
                        offer.status = 'SOLD'
                        offer.soldPrice = offer.soldPrice || offer.price
                        offer.soldAt = offer.soldAt || offer.updatedAt || new Date()
                    } else if (offer.active === false) {
                        offer.status = 'CANCELLED'
                        offer.cancelledAt = offer.cancelledAt || offer.updatedAt || new Date()
                    } else {
                        offer.status = 'ACTIVE'
                    }
                    marketModified = true
                    totalOffersUpdated++
                }

                // Agrupar ventas completadas
                if (offer.status === 'SOLD' || (offer.active === false && offer.buyer)) {
                    const sellerId = offer.seller ? offer.seller.toString() : null
                    const buyerId = offer.buyer ? offer.buyer.toString() : null
                    const price = offer.soldPrice || offer.price || 0

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
                    const sellerId = offer.seller ? offer.seller.toString() : null
                    if (sellerId) {
                        const prevCount = activeOffersBySeller.get(sellerId) || 0
                        activeOffersBySeller.set(sellerId, prevCount + 1)
                    }
                }
            }

            if (marketModified && !isDryRun) {
                await market.save()
            }
        }

        console.log(`🛒 Mercados procesados. Ofertas normalizadas: ${totalOffersUpdated}`)

        // 3. Procesar Usuarios
        const users = await User.find()
        console.log(`👥 Analizando ${users.length} usuarios y generando snapshots...\n`)

        const summary = []
        const migrationTimestamp = new Date()

        for (const user of users) {
            const userId = user._id.toString()
            const sellerData = salesBySeller.get(userId) || { totalEarned: 0, count: 0 }
            const buyerData = purchasesByBuyer.get(userId) || { totalSpent: 0, count: 0 }
            const activeOffersCount = activeOffersBySeller.get(userId) || 0

            const userCardsArray = user.cards || []
            const currentCardsCount = userCardsArray.length
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
            const totalCoinsEarned = Math.max(user.balance + totalCoinsSpent, marketEarnings)

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

            // Desglose detallado del inventario de cartas (por ID y por rareza)
            const cardCountsMap = new Map()
            const byRarity = {
                common: 0,
                rare: 0,
                epic: 0,
                legendary: 0,
                mythic: 0
            }

            for (const cId of userCardsArray) {
                const idStr = cId.toString()
                cardCountsMap.set(idStr, (cardCountsMap.get(idStr) || 0) + 1)
                const cType = cardTypeMap.get(idStr)
                const rarityKey = RARITY_NAMES[cType] || 'common'
                byRarity[rarityKey]++
            }

            const cardsBreakdown = Array.from(cardCountsMap.entries()).map(([cardId, count]) => ({
                cardId,
                count
            }))

            // Construir el Snapshot de Apertura (Genesis)
            const legacySnapshot = {
                economy: {
                    initialBalance: user.balance,
                    estimatedTotalEarned: totalCoinsEarned,
                    estimatedTotalSpent: totalCoinsSpent
                },
                inventory: {
                    totalCards: currentCardsCount,
                    distinctCardsCount: cardsBreakdown.length,
                    byRarity,
                    cardsBreakdown
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

            // Actualizar campos en el modelo de usuario
            user.dailyStreak = dailyStreak
            user.maxDailyStreak = maxDailyStreak
            user.totalDailiesClaimed = totalDailiesClaimed
            user.totalCoinsEarned = totalCoinsEarned
            user.totalCoinsSpent = totalCoinsSpent
            user.cardsOpenedCount = estimatedGachaCards

            if (!user.lastDaily && user.lastTimeCommand) {
                user.lastDaily = user.lastTimeCommand
            }

            if (!isDryRun) {
                await user.save()

                // Crear transacción inicial de apertura en el Ledger si no existe ninguna previa
                const existingTx = await Transaction.findOne({ discordId: user.discordId })
                if (!existingTx) {
                    await Transaction.create({
                        discordId: user.discordId,
                        type: 'ADMIN_ADJUST',
                        amount: user.balance,
                        balanceBefore: 0,
                        balanceAfter: user.balance,
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
                Cartas: currentCardsCount,
                Míticas: byRarity.mythic,
                Legendarias: byRarity.legendary,
                Épicas: byRarity.epic
            })
        }

        console.table(summary)

        console.log('\n' + '='.repeat(70))
        if (isDryRun) {
            console.log('🔍 [DRY-RUN COMPLETADO] Se calculó el snapshot completo para todos los usuarios.')
            console.log('💡 Ejecuta `npm run backfill` para guardar los cambios y las transacciones en MongoDB.')
        } else {
            console.log('🎉 [MIGRACIÓN EXITOSA] Usuarios, transacciones iniciales y ofertas actualizados en MongoDB.')
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
