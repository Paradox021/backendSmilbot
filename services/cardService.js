// service for card

import { Card } from '../models/card.js'

const getCards = async () => await Card.find()

const getMythicCard = async () => await Card.aggregate([{ $match: { type: 4 } }, { $sample: { size: 1 } }])

const getLegendaryCard = async () => await Card.aggregate([{ $match: { type: 3 } }, { $sample: { size: 1 } }])

const getEpicCard = async () => await Card.aggregate([{ $match: { type: 2 } }, { $sample: { size: 1 } }])

const getRareCard = async () => await Card.aggregate([{ $match: { type: 1 } }, { $sample: { size: 1 } }])

const getCommonCard = async () => await Card.aggregate([{ $match: { type: 0 } }, { $sample: { size: 1 } }])

const getCard = async (id) => await Card.findById(id)

const createCard = async (card) => {
    const newCard = new Card(card)
    newCard.setImgUrl(card.imageUrl)
    return await newCard.save()
}

const deleteCard = async (id) => await Card.findByIdAndDelete(id)

export { getCards, getMythicCard, getLegendaryCard, getEpicCard,
    getRareCard, getCommonCard, getCard, createCard, deleteCard }