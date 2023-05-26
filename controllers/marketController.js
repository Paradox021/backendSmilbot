// controller for market page 

import * as marketService from '../services/marketService.js'
import * as userService from '../services/userService.js'

const getAllMarketOffers = async (req, res) => {
    try {
        const offers = await marketService.getAllMarketOffers(req.params.marketId)
        res.status(200).json(offers)
    } catch (error) {
        res.status(500).json({error: error.message})
    }
}

const addOffer = async (req, res) => {
    try {
        const offer = await marketService.addOffer(req.params.marketId, req.body)
        await userService.removeCard(req.params.userId, offer.card)
        res.status(200).json(offer)
    } catch (error) {
        res.status(500).json({error: error.message})
    }
}

const buyOffer = async (req, res) => {
    try {
        const offer = await marketService.buyOffer(req.params.marketId, req.params.offerId)
        await userService.addCard(req.params.userId, offer.card)
        await userService.removeBalance(req.params.userId, offer.price)
        await userService.addBalance(offer.seller, offer.price)
        res.status(200).json(offer)
    } catch (error) {
        res.status(500).json({error: error.message})
    }
}

const removeOffer = async (req, res) => {
    try {
        const offer = await marketService.removeOffer(req.params.marketId, req.params.offerId)
        await userService.addCard(req.params.userId, offer.card)
        res.status(200).json(offer)
    } catch (error) {
        res.status(500).json({error: error.message})
    }
}