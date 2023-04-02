// controller for card

import * as cardService from '../services/cardService.js'

async function getCards(req, res){
    const cards = await cardService.getCards()
    res.status(200).json(cards)
}

async function getMythicCard(req, res){
    const cards = await cardService.getMythicCard()
    res.status(200).json(cards)
}

async function getLegendaryCard(req, res){
    const cards = await cardService.getLegendaryCard()
    res.status(200).json(cards)
}

async function getEpicCard(req, res){
    const cards = await cardService.getEpicCard()
    res.status(200).json(cards)
}

async function getRareCard(req, res){
    const cards = await cardService.getRareCard()
    res.status(200).json(cards)
}

async function getCommonCard(req, res){
    const cards = await cardService.getCommonCard()
    res.status(200).json(cards)
}

async function getCard(req, res){
    const card = await cardService.getCard(req.params.id)
    res.status(200).json(card)
}

async function createCard(req, res){
    const card = req.body
    card.imageUrl = req.file.filename
    const newCard = await cardService.createCard(card)
    res.status(201).json(newCard)
}

async function deleteCard(req, res){
    await cardService.deleteCard(req.params.id)
    res.status(204).json()
}

export { getCards, getMythicCard, getLegendaryCard, getEpicCard, 
    getRareCard, getCommonCard, getCard, createCard, deleteCard }
