// service for user

import { User } from '../models/user.js'

const getUsers = async () => await User.find()

const getUser = async (discordId) => await User.findOne({ discordId: discordId })

const createUser = async (user) => { 
    const newUser = new User(user)
    return await newUser.save()
    
}
// devuelve el usuario con las cartas que tiene añadiendo el campo count a cada carta con el numero de esa carta que tiene
const getUserCards = async (discordId) => {
    const user = await User.findOne({ discordId: discordId }).populate('cards')
    const copiaUsuario = JSON.parse(JSON.stringify(user));
    copiaUsuario.cards = user.cards.reduce((acc, card) => {
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
    user.cards.push(cardId)
    return await user.save()
}

const removeCard = async (discordId, cardId) => {
    const user = await getUser(discordId)
    const cardIndex = user.cards.findIndex(card => card.toString() == cardId.toString())

    if (cardIndex === -1) throw new Error('No se encontró ninguna carta con ese ID.')
    
    const deletedCard = user.cards.splice(cardIndex, 1)
    await user.save()
    return deletedCard
    
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
    console.log(discordId, cardName)
    const user = await User.findOne({ discordId: discordId }).populate('cards')
    const card = user.cards.find(card => card.name === cardName)
    if(!card) throw new Error('Card not found in your collection')
    return { card, userId: user._id }
}


export { getUsers, getUser, createUser, deleteUser, addCard, removeCard,
     addBalance, removeBalance, dailyBalance, getUserCards, getUserWithNumberOfCards,
     getUserCardByName}