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
        const cardName = req.body.cardName
        const discordId = req.body.discordId
        const { card, userId } = await userService.getUserCardByName(discordId, cardName)
        const offer = {
            cardId: card._id,
            price: req.body.price,
            seller: userId,
            active: true
        }
        
        await marketService.addOffer(req.params.marketId, offer)
        await userService.removeCard(discordId, offer.cardId)
        res.status(200).json(offer)
    } catch (error) {
        console.log(error)
        res.status(500).json({error: error.message})
    }
}

const buyOffer = async (req, res) => {
    try {
        const user = await userService.getUser(req.body.discordId)
        const offer = await marketService.buyOffer(req.params.marketId, req.params.offerId, user._id)
        if (!offer) {
            return res.status(404).json({error: "Offer not found"})
        }
        if (offer.seller === user._id) {
            return res.status(400).json({error: "You can't buy your own offer"})
        }
        if (offer.price > user.balance) {
            return res.status(400).json({error: "You don't have enough money"})
        }
        if (!offer.active) {
            return res.status(400).json({error: "This offer is no longer available"})
        }

        await userService.addCard(req.body.discordId, offer.cardId)
        await userService.removeBalance(req.body.discordId, offer.price)
        await userService.addBalanceWithId(offer.seller, offer.price)
        res.status(200).json(offer)
    } catch (error) {
        console.log("error --- ",error)
        res.status(500).json({error: error.message})
    }
}

const removeOffer = async (req, res) => {
    try {
        const user = await userService.getUser(req.body.discordId)
        const offer = await marketService.removeOffer(req.params.marketId, req.params.offerId, user._id)
        await userService.addCard(req.body.discordId, offer.cardId)
        res.status(200).json(offer)
    } catch (error) {
        res.status(500).json({error: error.message})
    }
}

export { getAllMarketOffers, addOffer, buyOffer, removeOffer }