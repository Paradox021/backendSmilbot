// controller for market page 
import * as marketService from '../services/marketService.js'
import * as userService from '../services/userService.js'

const getAllMarketOffers = async (req, res) => {
    try {
        const market = await marketService.getMarket(req.params.marketId)
        if (!market) {
            await marketService.createMarket(req.params.marketId)
        }
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
        let user = await userService.getUser(discordId)
        if (!user) {
            user = await userService.createUser({discordId: discordId, username: req.body.username})
        }
        const market = await marketService.getMarket(req.params.marketId)
        if (!market) {
            await marketService.createMarket({discordId: req.params.marketId})
        }
        const { card, userId } = await userService.getUserCardByName(discordId, cardName)
        if (!card) {
            return res.status(404).json({error: "Card not found"})
        }
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
        let user = await userService.getUser(req.body.discordId)
        const offer = await marketService.getMarketOffer(req.params.marketId, req.params.offerId)

        if (!user) {
            user = await userService.createUser({discordId: req.body.discordId, username: req.body.username})
        }
        const market = await marketService.getMarket(req.params.marketId)
        if (!market) {
            await marketService.createMarket({discordId: req.params.marketId})
        }
        if (!offer) {
            return res.status(404).json({error: "Offer not found"})
        }
        if (offer.price > user.balance) {
            return res.status(400).json({error: "You don't have enough money"})
        }

        const buyedOffer = await marketService.buyOffer(req.params.marketId, req.params.offerId, user._id)
        await userService.addCard(req.body.discordId, buyedOffer.cardId)
        await userService.removeBalance(req.body.discordId, buyedOffer.price)
        await userService.addBalanceWithId(buyedOffer.seller, buyedOffer.price)
        res.status(200).json(buyedOffer)
    } catch (error) {
        console.log("error --- ",error)
        res.status(500).json({error: error.message})
    }
}

const removeOffer = async (req, res) => {
    try {
        let user = await userService.getUser(req.body.discordId)
        if (!user) {
            user = await userService.createUser({discordId: req.body.discordId, username: req.body.username})
        }
        const market = await marketService.getMarket(req.params.marketId)
        if (!market) {
            await marketService.createMarket({discordId: req.params.marketId})
        }
        const removedOffer = await marketService.removeOffer(req.params.marketId, req.params.offerId, user._id)
        await userService.addCard(req.body.discordId, removedOffer.cardId)
        res.status(200).json(removedOffer)
    } catch (error) {
        res.status(500).json({error: error.message})
    }
}

export { getAllMarketOffers, addOffer, buyOffer, removeOffer }