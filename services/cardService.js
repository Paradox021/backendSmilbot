// service for card

import { Card } from '../models/cardModel.js'

async function getCards(){
    return await Card.find()
}

async function getMythicCard(){
    return await Card.aggregate([{ $match: { type: "mythic" } }, { $sample: { size: 1 } }])
}

async function getLegendaryCard(){
    return await Card.aggregate([{ $match: { type: "legendary" } }, { $sample: { size: 1 } }])
}

async function getEpicCard(){    
    return await Card.aggregate([{ $match: { type: "epic" } }, { $sample: { size: 1 } }])
}

async function getRareCard(){
    return await Card.aggregate([{ $match: { type: "rare" } }, { $sample: { size: 1 } }])
}

async function getCommonCard(){
    return await Card.aggregate([{ $match: { type: "common" } }, { $sample: { size: 1 } }])
}

async function getCard(id){
    return await Card.findById(id)
}

async function createCard(card){
    const newCard = new Card(card)
    newCard.setImgUrl(card.imageUrl)
    return await newCard.save()
}

async function deleteCard(id){
    return await Card.findByIdAndDelete(id)
}

export { getCards, getMythicCard, getLegendaryCard, getEpicCard,
    getRareCard, getCommonCard, getCard, createCard, deleteCard }