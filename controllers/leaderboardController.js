// controller for leaderboards

import * as userService from '../services/userService.js'

const getStreaksLeaderboard = async (req, res) => {
    try {
        const { type = 'current', limit = 10 } = req.query
        const leaderboard = await userService.getLeaderboardStreaks(type, limit)
        res.status(200).json(leaderboard)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

const getWealthLeaderboard = async (req, res) => {
    try {
        const { type = 'earned', limit = 10 } = req.query
        const leaderboard = await userService.getLeaderboardWealth(type, limit)
        res.status(200).json(leaderboard)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

const getCardsLeaderboard = async (req, res) => {
    try {
        const { limit = 10 } = req.query
        const leaderboard = await userService.getLeaderboardCards(limit)
        res.status(200).json(leaderboard)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

export {
    getStreaksLeaderboard,
    getWealthLeaderboard,
    getCardsLeaderboard
}
