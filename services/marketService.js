// service for market

import { Market } from '../models/market.js'

const createMarket = async (market) => {
    const newMarket = new Market(market)
    return await newMarket.save()
}

// get market by discordId
const getMarket = async (marketId) => {
    const market = await Market.find({ discordId: marketId })
    if (market.length === 0) return null
    return market[0]
}

const getMarketOffer = async (marketId, offerId) => {
    const market = await Market.find({ discordId: marketId })
    if (market.length === 0) return null
    return market[0].offers.id(offerId)
}

const getAllMarketOffers = async (marketId) => {
    const market = await Market.find({ discordId: marketId })
        .populate('offers.cardId')
        .populate('offers.seller')
    if (market.length === 0) return []
    // Filtrar solo las ofertas activas
    const activeOffers = market[0].offers.filter(offer => {
        if (offer.status) return offer.status === 'ACTIVE'
        return offer.active === true
    })
    return activeOffers
}

const addOffer = async (marketId, offer) => {
    const market = await Market.find({ discordId: marketId })
    if (market.length === 0) throw new Error('Market not found')
    offer.status = 'ACTIVE'
    offer.active = true
    market[0].offers.push(offer)
    await market[0].save()
}

const buyOffer = async (marketId, offerId, buyer) => {
    const market = await Market.find({ discordId: marketId })
    if (market.length === 0) throw new Error('Market not found')
    const offer = market[0].offers.id(offerId)
    if (!offer) throw new Error('Offer not found')
    
    const isInactive = offer.status ? offer.status !== 'ACTIVE' : offer.active === false
    if (isInactive) throw new Error('Offer is not active')
    
    if (offer.seller.toString() === buyer._id.toString()) {
        throw new Error('You can\'t buy your own offer')
    }

    offer.active = false
    offer.status = 'SOLD'
    offer.buyer = buyer._id
    offer.buyerDiscordId = buyer.discordId
    offer.soldPrice = offer.price
    offer.soldAt = new Date()

    await market[0].save()
    return offer
}

const removeOffer = async (marketId, offerId, userId) => {
    const market = await Market.find({ discordId: marketId })
    if (market.length === 0) throw new Error('Market not found')
    const offer = market[0].offers.id(offerId)
    if (!offer) throw new Error('Offer not found')
    if (offer.seller.toString() !== userId.toString()) {
        throw new Error('You can\'t remove an offer that is not yours!')
    }
    
    const isInactive = offer.status ? offer.status !== 'ACTIVE' : offer.active === false
    if (isInactive) throw new Error('Offer is not active')

    // En lugar de borrar físicamente, cambiamos estado a CANCELLED
    offer.active = false
    offer.status = 'CANCELLED'
    offer.cancelledAt = new Date()

    await market[0].save()
    return offer
}

export {
    getMarketOffer,
    addOffer,
    buyOffer,
    removeOffer,
    getAllMarketOffers,
    createMarket,
    getMarket
}