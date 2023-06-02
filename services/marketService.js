// service for market

import { Market } from '../models/market.js'

const getMarketOffer = async (marketId, offerId) => {
    const market = await Market.findById(marketId)
    return market.offers.id(offerId)
}

const getAllMarketOffers = async (marketId) => {
    const market = await Market.find({discordId:marketId}).populate('offers.cardId')
    if(!market) return []
    return market[0].offers
}

const addOffer = async (marketId, offer) => {
  const market = await Market.findById(marketId)
  market.offers.push(offer)
  await market.save()
}

const buyOffer = async (marketId, offerId, buyerId) => {
    const market = await Market.findById(marketId)
    const offer = market.offers.id(offerId)
    offer.active = false
    offer.buyer = buyerId
    await market.save()
}

const removeOffer = async (marketId, offerId) => {
    const market = await Market.findById(marketId)
    market.offers.pull(offerId)
    await market.save()
}

export { getMarketOffer, addOffer, buyOffer, removeOffer, getAllMarketOffers }