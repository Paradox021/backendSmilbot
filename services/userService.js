// service for user

import { User } from '../models/user.js'

const getUsers = async () => await User.find()

const getUser = async (discordId) => await User.findOne({ discordId: discordId })

const createUser = async (user) => { 
    const newUser = new User(user)
    return await newUser.save()
    
}

const getUserCards = async (discordId) => {
    const user = await User.findOne({ discordId: discordId }).populate('cards')
    return user
}

const deleteUser = async (id) => await User.findByIdAndDelete(id)

const addCard = async (discordId, cardId) => {
    const user = await getUser(discordId)
    user.cards.push(cardId)
    return await user.save()
}

const removeCard = async (discordId, cardId) => {
    const user = await getUser(discordId)
    user.cards.pull(cardId)
    return await user.save()
}

const addBalance = async (discordId, amount) => {
    const user = await getUser(discordId)
    user.balance += amount
    return await user.save()
}

const removeBalance = async (discordId, amount) => {
    const user = await getUser(discordId)
    user.balance -= amount
    return await user.save()
}

const dailyBalance = async (discordId, amount) => {
    const user = await getUser(discordId)
    user.balance += amount
    user.updateLastTimeCommand()
    return await user.save()
}



export { getUsers, getUser, createUser, deleteUser, addCard, removeCard,
     addBalance, removeBalance, dailyBalance, getUserCards }