// service for card

import { Card } from '../models/card.js'
import crypto from 'crypto'

const getCards = async () => await Card.find().sort({type:1})

const getRandomTypeCard = async (type) => {
    const cards = await Card.find({ type: type })
    
    if (cards.length === 0) 
        throw new Error('No cards found for this type');
    
    const randomIndex = crypto.randomInt(0, cards.length)
    return cards[randomIndex]
}

const getMythicCard = async () => await getRandomTypeCard(4)

const getLegendaryCard = async () => await getRandomTypeCard(3)

const getEpicCard = async () => await getRandomTypeCard(2)

const getRareCard = async () => await getRandomTypeCard(1)

const getCommonCard = async () => await getRandomTypeCard(0)

const getCard = async (id) => await Card.findById(id)

const createCard = async (cardData) => {
    const newCard = new Card(cardData)
    return await newCard.save()
}

const deleteCard = async (id) => {
    const card = await Card.findById(id)
    if (!card) throw new Error('Card not found')
    await Card.findByIdAndDelete(id)
    return card
}

export { getCards, getMythicCard, getLegendaryCard, getEpicCard,
    getRareCard, getCommonCard, getCard, createCard, deleteCard }