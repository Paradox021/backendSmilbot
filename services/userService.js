// service for user

import { User } from '../models/user.js'
import { Market, MarketOffer } from '../models/market.js'
import { createTransaction } from './transactionService.js'

const getUsers = async () => await User.find()

const getUser = async (discordId) => await User.findOne({ discordId: discordId })

const createUser = async (user) => { 
    const existingUser = await User.findOne({ discordId: user.discordId })
    if (existingUser) {
        const error = new Error('Ya existe un usuario con ese discordId')
        error.code = 'USER_ALREADY_EXISTS'
        throw error
    }
    const newUser = new User(user)
    return await newUser.save()
}

// Devuelve el usuario con las cartas que tiene manteniendo retrocompatibilidad exacta con el cliente
const getUserCards = async (discordId) => {
    const user = await User.findOne({ discordId: discordId }).populate('cards.cardId')
    if (!user) return null

    const activeCards = (user.cards || [])
        .filter(item => item.cardId && item.count > 0)
        .map(item => {
            const cardObj = typeof item.cardId.toObject === 'function' ? item.cardId.toObject() : item.cardId
            return {
                ...cardObj,
                count: item.count
            }
        })
        .sort((a, b) => (a.type || 0) - (b.type || 0))

    const copiaUsuario = user.toObject()
    copiaUsuario.cards = activeCards
    return copiaUsuario
}

const deleteUser = async (id) => await User.findByIdAndDelete(id)

const addCard = async (discordId, cardId) => {
    const user = await getUser(discordId)
    if (!user) throw new Error('Usuario no encontrado')

    const cardIdStr = cardId.toString()
    const existing = user.cards.find(item => item.cardId && item.cardId.toString() === cardIdStr)

    if (existing) {
        existing.count += 1
    } else {
        user.cards.push({ cardId, count: 1 })
    }
    return await user.save()
}

const removeCard = async (discordId, cardId) => {
    const user = await getUser(discordId)
    if (!user) throw new Error('Usuario no encontrado')

    const cardIdStr = cardId.toString()
    const existingIndex = user.cards.findIndex(item => item.cardId && item.cardId.toString() === cardIdStr)

    if (existingIndex === -1 || user.cards[existingIndex].count <= 0) {
        throw new Error('No se encontró ninguna carta con ese ID en tu colección.')
    }

    user.cards[existingIndex].count -= 1
    if (user.cards[existingIndex].count === 0) {
        user.cards.splice(existingIndex, 1)
    }

    await user.save()
    return cardId
}

const addBalance = async (discordId, amount) => {
    const user = await getUser(discordId)
    if (!user) throw new Error('Usuario no encontrado')
    const parsedAmount = Number(amount)
    const balanceBefore = user.balance
    user.balance += parsedAmount
    const balanceAfter = user.balance
    user.totalCoinsEarned = (user.totalCoinsEarned || 0) + (parsedAmount > 0 ? parsedAmount : 0)
    await user.save()

    await createTransaction({
        discordId: user.discordId,
        type: 'ADMIN_ADJUST',
        amount: parsedAmount,
        balanceBefore,
        balanceAfter
    })

    return user
}

const addBalanceWithId = async (userId, amount) => {
    const user = await User.findById(userId)
    if (!user) throw new Error('Usuario no encontrado')
    const parsedAmount = Number(amount)
    user.balance += parsedAmount
    return await user.save()
}

const removeBalance = async (discordId, amount) => {
    const user = await getUser(discordId)
    if (!user) throw new Error('Usuario no encontrado')
    const parsedAmount = Number(amount)
    const balanceBefore = user.balance
    user.balance -= parsedAmount
    const balanceAfter = user.balance
    user.totalCoinsSpent = (user.totalCoinsSpent || 0) + (parsedAmount > 0 ? parsedAmount : 0)
    await user.save()

    await createTransaction({
        discordId: user.discordId,
        type: 'ADMIN_ADJUST',
        amount: -parsedAmount,
        balanceBefore,
        balanceAfter
    })

    return user
}

/**
 * Reclamo de Daily Balance con lógica de rachas (23h a 48h suma, >48h resetea a 1) y registro en Ledger
 */
const dailyBalance = async (discordId, amount = 100) => {
    let user = await getUser(discordId)
    if (!user) throw new Error('Usuario no encontrado')

    const diffHours = user.getDiffHoursSinceLastDaily()
    if (diffHours < 23) {
        const { diffHours: h, diffMinutes: m } = user.getTimeToUseCommand()
        const error = new Error(`You can't use this command yet\nYou have to wait ${h} hours and ${m} minutes to use it again!`)
        error.code = 'COOLDOWN_ACTIVE'
        error.diffHours = h
        error.diffMinutes = m
        throw error
    }

    const previousStreak = user.dailyStreak || 0
    const previousMaxStreak = user.maxDailyStreak || 0
    const isStreakBroken = diffHours > 48 && previousStreak > 0

    // Comprobar racha: entre 23h y 48h mantiene/suma racha; más de 48h o primera vez -> racha = 1
    if (diffHours <= 48) {
        user.dailyStreak = previousStreak + 1
    } else {
        user.dailyStreak = 1
    }

    // Actualizar récord de racha
    user.maxDailyStreak = Math.max(user.dailyStreak, previousMaxStreak)

    const balanceBefore = user.balance
    user.balance += amount
    const balanceAfter = user.balance

    user.totalCoinsEarned = (user.totalCoinsEarned || 0) + amount
    user.totalDailiesClaimed = (user.totalDailiesClaimed || 0) + 1
    user.updateLastTimeCommand()

    await user.save()

    // Registrar transacción en el Ledger
    await createTransaction({
        discordId: user.discordId,
        type: 'DAILY_CLAIM',
        amount,
        balanceBefore,
        balanceAfter,
        metadata: {
            streakAtClaim: user.dailyStreak,
            previousStreak,
            previousMaxStreak,
            streakBroken: isStreakBroken
        }
    })

    return {
        ok: true,
        balance: user.balance,
        dailyStreak: user.dailyStreak,
        previousStreak,
        maxDailyStreak: user.maxDailyStreak,
        previousMaxStreak,
        totalDailiesClaimed: user.totalDailiesClaimed
    }
}

/**
 * Compra de carta gacha: descuenta saldo, suma métricas y genera transacción
 */
const rollRandomCardPurchase = async (discordId, card, cost = 100, roll = null) => {
    const user = await getUser(discordId)
    if (!user) throw new Error('Usuario no encontrado')

    if (user.balance < cost) {
        const error = new Error(`No tienes suficientes monedas. Necesitas ${cost} y tienes ${user.balance}`)
        error.code = 'INSUFFICIENT_BALANCE'
        throw error
    }

    const balanceBefore = user.balance
    user.balance -= cost
    const balanceAfter = user.balance

    user.totalCoinsSpent = (user.totalCoinsSpent || 0) + cost
    user.cardsOpenedCount = (user.cardsOpenedCount || 0) + 1

    const cardIdStr = card._id.toString()
    const existing = user.cards.find(item => item.cardId && item.cardId.toString() === cardIdStr)
    if (existing) {
        existing.count += 1
    } else {
        user.cards.push({ cardId: card._id, count: 1 })
    }

    await user.save()

    await createTransaction({
        discordId: user.discordId,
        type: 'CARD_BUY',
        amount: -cost,
        balanceBefore,
        balanceAfter,
        metadata: {
            cardId: card._id.toString(),
            cardType: card.type,
            roll: roll !== null && roll !== undefined ? roll : null
        }
    })

    return user
}

/**
 * Obtener estadísticas consolidadas del usuario (perfil / telemetría)
 */
const getUserStats = async (discordId) => {
    const user = await getUser(discordId)
    if (!user) return null

    // Calcular ventas exitosas en el mercado
    const marketSalesCount = await MarketOffer.countDocuments({
        seller: user._id,
        $or: [
            { status: 'SOLD' },
            { active: false, buyer: { $ne: null } }
        ]
    })
    const totalCardsCount = (user.cards || []).reduce((sum, item) => sum + (item.count || 0), 0)

    return {
        discordId: user.discordId,
        username: user.username,
        balance: user.balance,
        dailyStreak: user.dailyStreak || 0,
        maxDailyStreak: user.maxDailyStreak || 0,
        totalDailiesClaimed: user.totalDailiesClaimed || 0,
        totalCoinsEarned: user.totalCoinsEarned || 0,
        totalCoinsSpent: user.totalCoinsSpent || 0,
        cardsCount: totalCardsCount,
        cardsOpenedCount: user.cardsOpenedCount || 0,
        marketSalesCount
    }
}

/**
 * Leaderboards
 */
const getLeaderboardStreaks = async (type = 'current', limit = 10) => {
    const parsedLimit = Math.max(1, Math.min(100, parseInt(limit) || 10))
    const isMax = type === 'max'

    const sortField = isMax ? 'maxDailyStreak' : 'dailyStreak'
    const users = await User.find({ [sortField]: { $gt: 0 } })
        .sort({ [sortField]: -1, username: 1 })
        .limit(parsedLimit)
        .select('discordId username dailyStreak maxDailyStreak')

    return users.map(u => ({
        discordId: u.discordId,
        username: u.username,
        streak: isMax ? u.maxDailyStreak : u.dailyStreak
    }))
}

const getLeaderboardWealth = async (type = 'earned', limit = 10) => {
    const parsedLimit = Math.max(1, Math.min(100, parseInt(limit) || 10))
    const isCurrent = type === 'current'

    const sortField = isCurrent ? 'balance' : 'totalCoinsEarned'
    const users = await User.find()
        .sort({ [sortField]: -1, username: 1 })
        .limit(parsedLimit)
        .select('discordId username balance totalCoinsEarned')

    return users.map(u => ({
        discordId: u.discordId,
        username: u.username,
        amount: isCurrent ? u.balance : u.totalCoinsEarned
    }))
}

const getLeaderboardCards = async (limit = 10) => {
    const parsedLimit = Math.max(1, Math.min(100, parseInt(limit) || 10))

    const users = await User.aggregate([
        {
            $project: {
                discordId: 1,
                username: 1,
                cardsCount: {
                    $reduce: {
                        input: '$cards',
                        initialValue: 0,
                        in: { $add: ['$$value', { $ifNull: ['$$this.count', 0] }] }
                    }
                }
            }
        },
        { $sort: { cardsCount: -1, username: 1 } },
        { $limit: parsedLimit },
        {
            $project: {
                _id: 0,
                discordId: 1,
                username: 1,
                cardsCount: 1
            }
        }
    ])

    return users
}

const getUserWithNumberOfCards = async (discordId) => {
    const user = await User.aggregate([
        { $match: { discordId: discordId } },
        { $unwind: '$cards' },
        { $match: { 'cards.count': { $gt: 0 } } },
        { $lookup: { from: 'cards', localField: 'cards.cardId', foreignField: '_id', as: 'cardInfo' } },
        { $unwind: '$cardInfo' },
        { $group: { _id: '$cardInfo.type', count: { $sum: '$cards.count' } } }
    ])
    return user
}

const getUserCardByName = async (discordId, cardName) => {
    const user = await User.findOne({ discordId: discordId }).populate('cards.cardId')
    if (!user) throw new Error('Usuario no encontrado')

    const cardItem = (user.cards || []).find(item => item.cardId && item.cardId.name === cardName && item.count > 0)
    if (!cardItem) throw new Error('Card not found in your collection')

    return { card: cardItem.cardId, userId: user._id }
}

export {
    getUsers,
    getUser,
    createUser,
    deleteUser,
    addCard,
    removeCard,
    addBalance,
    removeBalance,
    dailyBalance,
    getUserCards,
    getUserWithNumberOfCards,
    getUserCardByName,
    addBalanceWithId,
    rollRandomCardPurchase,
    getUserStats,
    getLeaderboardStreaks,
    getLeaderboardWealth,
    getLeaderboardCards
}