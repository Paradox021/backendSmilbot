// Script para calcular y poblar el contador de pity histórico de cada usuario
// combinando el volcado cronológico antiguo (test.users.json) y las transacciones posteriores del Ledger (Transaction CARD_BUY).
// Uso: node scripts/backfillPity.js [--dry-run]

import mongoose from 'mongoose'
import * as dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { User } from '../models/user.js'
import { Card } from '../models/card.js'
import { Transaction } from '../models/transaction.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const isDryRun = process.argv.includes('--dry-run')

async function runBackfillPity() {
    try {
        console.log('='.repeat(75))
        console.log('🎯 INICIANDO BACKFILL DE TELEMETRÍA DEL SISTEMA DE PITY')
        console.log(`   Modo: ${isDryRun ? '🔍 [DRY-RUN (Simulación sin escribir en MongoDB)]' : '💾 [APLICAR (Guardando en MongoDB)]'}`)
        console.log('='.repeat(75))

        if (!process.env.URL_DB) {
            throw new Error('URL_DB no está definido en el archivo .env')
        }

        mongoose.set('strictQuery', true)
        await mongoose.connect(process.env.URL_DB)
        console.log('✅ Conexión establecida con MongoDB.\n')

        // 1. Obtener todas las cartas míticas del catálogo
        const mythicCards = await Card.find({ type: 4 }, '_id name').lean()
        const mythicIdSet = new Set(mythicCards.map(c => c._id.toString()))
        console.log(`🎴 Catálogo de cartas míticas (${mythicCards.length}):`, mythicCards.map(c => `${c.name} (${c._id})`).join(', '))

        // 2. Cargar test.users.json si existe
        const dumpPath = path.resolve(__dirname, '..', 'test.users.json')
        let dumpUsers = []
        const dumpUserMap = new Map() // discordId -> dumpUser

        if (fs.existsSync(dumpPath)) {
            const rawDump = fs.readFileSync(dumpPath, 'utf8')
            dumpUsers = JSON.parse(rawDump)
            dumpUsers.forEach(u => {
                if (u.discordId) dumpUserMap.set(u.discordId.toString(), u)
            })
            console.log(`📂 Volcado histórico 'test.users.json' cargado: ${dumpUsers.length} usuarios registrados.\n`)
        } else {
            console.warn(`⚠️ Archivo 'test.users.json' no encontrado en ${dumpPath}. Solo se evaluarán transacciones.`)
        }

        // 3. Obtener todos los usuarios de la base de datos
        const dbUsers = await User.find().lean()
        console.log(`👥 Procesando ${dbUsers.length} usuarios en la base de datos...\n`)

        const summary = []

        for (const user of dbUsers) {
            const discordId = user.discordId
            const dumpUser = dumpUserMap.get(discordId)

            let dumpCardsCount = 0
            let lastMythicIndexInDump = -1
            let pullsSinceMythicInDump = 0

            if (dumpUser && Array.isArray(dumpUser.cards)) {
                const cards = dumpUser.cards
                dumpCardsCount = cards.length

                for (let i = cards.length - 1; i >= 0; i--) {
                    const item = cards[i]
                    const cardIdStr = (item && item['$oid']) ? item['$oid'] : (item ? item.toString() : null)
                    if (cardIdStr && mythicIdSet.has(cardIdStr)) {
                        lastMythicIndexInDump = i
                        break
                    }
                }

                if (lastMythicIndexInDump > -1) {
                    pullsSinceMythicInDump = cards.length - 1 - lastMythicIndexInDump
                } else {
                    pullsSinceMythicInDump = cards.length
                }
            }

            // 4. Evaluar transacciones CARD_BUY posteriores registradas en MongoDB
            const txs = await Transaction.find({ discordId, type: 'CARD_BUY' }).sort({ createdAt: 1 }).lean()
            let currentPity = pullsSinceMythicInDump
            let mythicsInTxs = 0

            for (const tx of txs) {
                const isMythic = tx.metadata && (
                    tx.metadata.cardType === 4 ||
                    (tx.metadata.cardId && mythicIdSet.has(tx.metadata.cardId.toString()))
                )

                if (isMythic) {
                    currentPity = 0
                    mythicsInTxs++
                } else {
                    currentPity++
                }
            }

            if (!isDryRun) {
                await User.updateOne(
                    { _id: user._id },
                    {
                        $set: {
                            pityCount: currentPity,
                            pityMythicsCount: 0
                        }
                    }
                )
            }

            summary.push({
                Usuario: user.username,
                DiscordId: discordId,
                CartasEnDump: dumpCardsCount,
                ÚltimaMíticaDump: lastMythicIndexInDump > -1 ? `Idx ${lastMythicIndexInDump}` : 'Ninguna',
                TiradasTrasDump: pullsSinceMythicInDump,
                TxsCardBuy: txs.length,
                MíticasEnTxs: mythicsInTxs,
                PityCalculado: currentPity,
                PityActivado: currentPity >= 250 ? '¡SÍ (Garantizada)!' : 'No'
            })
        }

        // Ordenar resumen por pity descendente
        summary.sort((a, b) => b.PityCalculado - a.PityCalculado)
        console.table(summary)

        console.log('\n' + '='.repeat(75))
        if (isDryRun) {
            console.log('🔍 [DRY-RUN COMPLETADO] Se calculó el pity sin modificar la base de datos.')
            console.log('💡 Ejecuta `node scripts/backfillPity.js` para persistir los contadores en MongoDB.')
        } else {
            console.log('🎉 [BACKFILL COMPLETADO] Contadores de pity y pityMythicsCount sincronizados en MongoDB.')
        }
        console.log('='.repeat(75))

    } catch (error) {
        console.error('❌ Error durante el backfill de pity:', error)
        process.exitCode = 1
    } finally {
        await mongoose.disconnect()
        console.log('🔌 Conexión con MongoDB cerrada.')
    }
}

runBackfillPity()
