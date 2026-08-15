// service for user

import { User } from '../models/user.js'
import { Market } from '../models/market.js'
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

// devuelve el usuario con las cartas que tiene añadiendo el campo count a cada carta con el numero de esa carta que tiene
const getUserCards = async (discordId) => {
    const user = await User.findOne({ discordId: discordId }).populate('cards')
    if (!user) return null
    const copiaUsuario = JSON.parse(JSON.stringify(user));
    copiaUsuario.cards = copiaUsuario.cards.sort((a, b) => a.type - b.type)
    copiaUsuario.cards = copiaUsuario.cards.reduce((acc, card) => {
        const found = acc.find(c => c._id.toString() === card._id.toString())
        if (found) {
            found.count++
        } else { 
            const copia = JSON.parse(JSON.stringify(card));
            acc.push({...copia, count: 1})
        }
        return acc
    }, [])
    return copiaUsuario
}

const deleteUser = async (id) => await User.findByIdAndDelete(id)

const addCard = async (discordId, cardId) => {
    const user = await getUser(discordId)
    if (!user) throw new Error('Usuario no encontrado')
    user.cards.push(cardId)
    return await user.save()
}

const removeCard = async (discordId, cardId) => {
    const user = await getUser(discordId)
    if (!user) throw new Error('Usuario no encontrado')
    const cardIndex = user.cards.findIndex(card => card.toString() == cardId.toString())

    if (cardIndex === -1) throw new Error('No se encontró ninguna carta con ese ID.')
    
    const deletedCard = user.cards.splice(cardIndex, 1)
    await user.save()
    return deletedCard
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
    user.cards.push(card._id)

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
    const marketSales = await Market.aggregate([
        { $unwind: '$offers' },
        {
            $match: {
                'offers.seller': user._id,
                $or: [
                    { 'offers.status': 'SOLD' },
                    { 'offers.active': false, 'offers.buyer': { $ne: null } }
                ]
            }
        },
        { $count: 'count' }
    ])

    const marketSalesCount = marketSales.length > 0 ? marketSales[0].count : 0

    return {
        discordId: user.discordId,
        username: user.username,
        balance: user.balance,
        dailyStreak: user.dailyStreak || 0,
        maxDailyStreak: user.maxDailyStreak || 0,
        totalDailiesClaimed: user.totalDailiesClaimed || 0,
        totalCoinsEarned: user.totalCoinsEarned || 0,
        totalCoinsSpent: user.totalCoinsSpent || 0,
        cardsCount: user.cards ? user.cards.length : 0,
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
                cardsCount: { $size: { $ifNull: ['$cards', []] } }
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
    const user = User.aggregate([
        { $match: { discordId: discordId } },
        { $lookup: { from: 'cards', localField: 'cards', foreignField: '_id', as: 'cards' } },
        { $unwind: '$cards' },
        { $group: { _id: '$cards.type', count: { $sum: 1 } } }
    ])
    return user
}

const getUserCardByName = async (discordId, cardName) => {
    const user = await User.findOne({ discordId: discordId }).populate('cards')
    if (!user) throw new Error('Usuario no encontrado')
    const card = user.cards.find(card => card.name === cardName)
    if(!card) throw new Error('Card not found in your collection')
    return { card, userId: user._id }
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