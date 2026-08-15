// service for market with independent MarketOffer collection

import { MarketOffer } from '../models/marketOffer.js'

const createMarket = async (market) => {
    return { discordId: market.discordId }
}

const getMarket = async (marketId) => {
    return { discordId: marketId }
}

const getMarketOffer = async (marketId, offerId) => {
    return await MarketOffer.findOne({ _id: offerId, serverId: marketId })
}

const getAllMarketOffers = async (marketId) => {
    return await MarketOffer.find({
        serverId: marketId,
        $or: [{ status: 'ACTIVE' }, { status: { $exists: false }, active: true }]
    })
        .populate('cardId')
        .populate('seller')
        .sort({ createdAt: -1 })
}

const addOffer = async (marketId, offerData) => {
    const newOffer = new MarketOffer({
        ...offerData,
        serverId: marketId,
        status: 'ACTIVE',
        active: true
    })
    return await newOffer.save()
}

const buyOffer = async (marketId, offerId, buyer) => {
    const offer = await MarketOffer.findOne({ _id: offerId, serverId: marketId })
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

    return await offer.save()
}

const removeOffer = async (marketId, offerId, userId) => {
    const offer = await MarketOffer.findOne({ _id: offerId, serverId: marketId })
    if (!offer) throw new Error('Offer not found')

    if (offer.seller.toString() !== userId.toString()) {
        throw new Error('You can\'t remove an offer that is not yours!')
    }

    const isInactive = offer.status ? offer.status !== 'ACTIVE' : offer.active === false
    if (isInactive) throw new Error('Offer is not active')

    offer.active = false
    offer.status = 'CANCELLED'
    offer.cancelledAt = new Date()

    return await offer.save()
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