// controller for user

import * as userService from '../services/userService.js'

const getUsers = async (req, res) => {
    try {
        const users = await userService.getUsers()
        res.status(200).json(users)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

const getUser = async (req, res) => {
    try {
        const auxUser = req.body
        const user = await userService.getUser(auxUser.discordId)
        if (!user) {
            const newUser = await userService.createUser(auxUser)
            return res.status(200).json(newUser)
        }
        res.status(200).json(user)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

const createUser = async (req, res) => {
    try {
        const user = await userService.createUser(req.body)
        res.status(200).json(user)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

const deleteUser = async (req, res) => {
    try {
        const user = await userService.deleteUser(req.params.id)
        res.status(200).json(user)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

const addCard = async (req, res) => {
    try {
        const user = await userService.addCard(req.params.id, req.params.cardId)
        res.status(200).json(user)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

const removeCard = async (req, res) => {
    try {
        const user = await userService.removeCard(req.params.id, req.params.cardId)
        res.status(200).json(user)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

const addBalance = async (req, res) => {
    try {
        const user = await userService.addBalance(req.params.id, req.params.amount)
        res.status(200).json(user)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

const removeBalance = async (req, res) => {
    try {
        console.log(req.params.id, req.params.balance)
        const user = await userService.removeBalance(req.params.id, req.params.amount)
        res.status(200).json(user)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

const dailyBalance = async (req, res) => {
    try {
        const user = await userService.getUser(req.params.id)
        if (!user.canUseCommand()) return res.status(500).json({ error: 'You can\'t use this command yet' })
        const userUpdated = await userService.dailyBalance(req.params.id, 100)
        return res.status(200).json(userUpdated)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

const getUserWithCards = async (req, res) => {
    try {
        const user = await userService.getUser(req.params.id)
        const userWithCards = await userService.getUserCards(user.id)
        res.status(200).json(userWithCards)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

const getUserWithNumberOfCards = async (req, res) => {
    try {
        const user = await userService.getUser(req.params.id)
        const userWithCards = await userService.getUserCards(user.id)
        res.status(200).json(userWithCards)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}


export { getUsers, getUser, createUser, deleteUser, addCard, removeCard, addBalance, removeBalance, dailyBalance, getUserWithCards, getUserWithNumberOfCards}