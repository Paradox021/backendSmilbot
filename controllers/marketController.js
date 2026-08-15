// controller for market page 
import * as marketService from '../services/marketService.js'
import * as userService from '../services/userService.js'
import { User } from '../models/user.js'
import { createTransaction } from '../services/transactionService.js'

const getAllMarketOffers = async (req, res) => {
    try {
        const market = await marketService.getMarket(req.params.marketId)
        if (!market) {
            await marketService.createMarket({ discordId: req.params.marketId })
        }
        const offers = await marketService.getAllMarketOffers(req.params.marketId)
        res.status(200).json(offers)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

const addOffer = async (req, res) => {
    try {
        const cardName = req.body.cardName
        const discordId = req.body.discordId
        let user = await userService.getUser(discordId)
        if (!user) {
            user = await userService.createUser({ discordId: discordId, username: req.body.username })
        }
        const market = await marketService.getMarket(req.params.marketId)
        if (!market) {
            await marketService.createMarket({ discordId: req.params.marketId })
        }
        const { card, userId } = await userService.getUserCardByName(discordId, cardName)
        if (!card) {
            return res.status(404).json({ error: "Card not found" })
        }
        const offer = {
            cardId: card._id,
            price: Number(req.body.price),
            seller: userId,
            sellerDiscordId: discordId,
            active: true,
            status: 'ACTIVE'
        }
        
        await marketService.addOffer(req.params.marketId, offer)
        await userService.removeCard(discordId, offer.cardId)
        res.status(200).json(offer)
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: error.message })
    }
}

const buyOffer = async (req, res) => {
    try {
        let buyer = await userService.getUser(req.body.discordId)
        if (!buyer) {
            buyer = await userService.createUser({ discordId: req.body.discordId, username: req.body.username })
        }

        const offer = await marketService.getMarketOffer(req.params.marketId, req.params.offerId)
        if (!offer) {
            return res.status(404).json({ error: "Offer not found" })
        }

        const isInactive = offer.status ? offer.status !== 'ACTIVE' : offer.active === false
        if (isInactive) {
            return res.status(400).json({ error: "Offer is not active" })
        }

        if (offer.price > buyer.balance) {
            return res.status(400).json({ error: "You don't have enough money" })
        }

        const seller = await User.findById(offer.seller)
        if (!seller) {
            return res.status(404).json({ error: "Seller not found" })
        }

        if (seller._id.toString() === buyer._id.toString()) {
            return res.status(400).json({ error: "You can't buy your own offer" })
        }

        // Ejecutar compra en el mercado
        const boughtOffer = await marketService.buyOffer(req.params.marketId, req.params.offerId, buyer)

        // Transferir carta al comprador
        await userService.addCard(buyer.discordId, boughtOffer.cardId)

        // Actualizar balance y métricas del comprador
        const buyerBalanceBefore = buyer.balance
        buyer.balance -= boughtOffer.price
        const buyerBalanceAfter = buyer.balance
        buyer.totalCoinsSpent = (buyer.totalCoinsSpent || 0) + boughtOffer.price
        await buyer.save()

        // Registrar transacción de compra (buyer)
        await createTransaction({
            discordId: buyer.discordId,
            type: 'MARKET_BUY',
            amount: -boughtOffer.price,
            balanceBefore: buyerBalanceBefore,
            balanceAfter: buyerBalanceAfter,
            metadata: {
                cardId: boughtOffer.cardId ? boughtOffer.cardId.toString() : null,
                sellerDiscordId: seller.discordId,
                offerId: boughtOffer._id ? boughtOffer._id.toString() : null
            }
        })

        // Actualizar balance y métricas del vendedor
        const sellerBalanceBefore = seller.balance
        seller.balance += boughtOffer.price
        const sellerBalanceAfter = seller.balance
        seller.totalCoinsEarned = (seller.totalCoinsEarned || 0) + boughtOffer.price
        await seller.save()

        // Registrar transacción de venta (seller)
        await createTransaction({
            discordId: seller.discordId,
            type: 'MARKET_SELL',
            amount: boughtOffer.price,
            balanceBefore: sellerBalanceBefore,
            balanceAfter: sellerBalanceAfter,
            metadata: {
                cardId: boughtOffer.cardId ? boughtOffer.cardId.toString() : null,
                buyerDiscordId: buyer.discordId,
                offerId: boughtOffer._id ? boughtOffer._id.toString() : null
            }
        })

        res.status(200).json(boughtOffer)
    } catch (error) {
        console.log("error --- ", error)
        res.status(500).json({ error: error.message })
    }
}

const removeOffer = async (req, res) => {
    try {
        let user = await userService.getUser(req.body.discordId)
        if (!user) {
            user = await userService.createUser({ discordId: req.body.discordId, username: req.body.username })
        }
        const market = await marketService.getMarket(req.params.marketId)
        if (!market) {
            await marketService.createMarket({ discordId: req.params.marketId })
        }
        const removedOffer = await marketService.removeOffer(req.params.marketId, req.params.offerId, user._id)
        await userService.addCard(req.body.discordId, removedOffer.cardId)
        res.status(200).json(removedOffer)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

export { getAllMarketOffers, addOffer, buyOffer, removeOffer }