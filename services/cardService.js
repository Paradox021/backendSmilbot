// service for card

import { Card } from '../models/card.js'

const getCards = async () => await Card.find()

const getMythicCard = async () => await Card.aggregate([{ $match: { type: "mythic" } }, { $sample: { size: 1 } }])

const getLegendaryCard = async () => await Card.aggregate([{ $match: { type: "legendary" } }, { $sample: { size: 1 } }])

const getEpicCard = async () => await Card.aggregate([{ $match: { type: "epic" } }, { $sample: { size: 1 } }])

const getRareCard = async () => await Card.aggregate([{ $match: { type: "rare" } }, { $sample: { size: 1 } }])

const getCommonCard = async () => await Card.aggregate([{ $match: { type: "common" } }, { $sample: { size: 1 } }])

const getCard = async (id) => await Card.findById(id)

const createCard = async (card) => {
    const newCard = new Card(card)
    newCard.setImgUrl(card.imageUrl)
    return await newCard.save()
}

const deleteCard = async (id) => await Card.findByIdAndDelete(id)

export { getCards, getMythicCard, getLegendaryCard, getEpicCard,
    getRareCard, getCommonCard, getCard, createCard, deleteCard }