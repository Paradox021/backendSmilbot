// controller for card

import * as cardService from '../services/cardService.js'

const getCards = async (req, res) => {
    try {
        const cards = await cardService.getCards()
        res.status(200).json(cards)
    } catch (error) {
        res.status(500).json({error: error.message})
    }
}

const getMythicCard = async (req, res) => {
    try {
        const mythicCard = await cardService.getMythicCard()
        res.status(200).json(mythicCard)
    } catch (error) {
        res.status(500).json({error: error.message})
    }
}

const getLegendaryCard = async (req, res) => {
    try {
        const legendaryCard = await cardService.getLegendaryCard()
        res.status(200).json(legendaryCard)
    } catch (error) {
        res.status(500).json({error: error.message})
    }
}

const getEpicCard = async (req, res) => {
    try {
        const epicCard = await cardService.getEpicCard()
        res.status(200).json(epicCard)
    } catch (error) {
        res.status(500).json({error: error.message})
    }
}

const getRareCard = async (req, res) => {
    try {
        const rareCard = await cardService.getRareCard()
        res.status(200).json(rareCard)
    } catch (error) {
        res.status(500).json({error: error.message})
    }
}

const getCommonCard = async (req, res) => {
    try {
        const commonCard = await cardService.getCommonCard()
        res.status(200).json(commonCard)
    } catch (error) {
        res.status(500).json({error: error.message})
    }
}

const getCard = async (req, res) => {
    try {
        const card = await cardService.getCard(req.params.id)
        res.status(200).json(card)
    } catch (error) {
        res.status(500).json({error: error.message})
    }
}

const createCard = async (req, res) => {
    try {
        const cardData = JSON.parse(req.body.data)
        cardData.imageUrl = req.file.filename
        console.log("datos de cartas --- ",cardData)
        const card = await cardService.createCard(cardData)
        res.status(201).json(card)
    } catch (error) {
        res.status(500).json({error: error.message})
    }
}

const deleteCard = async (req, res) => {
    try {
        const card = await cardService.deleteCard(req.params.id)
        res.status(200).json(card)
    } catch (error) {
        res.status(500).json({error: error.message})
    }
}

export { getCards, getMythicCard, getLegendaryCard, getEpicCard, 
    getRareCard, getCommonCard, getCard, createCard, deleteCard }
