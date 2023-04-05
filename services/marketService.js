// service for market

import { Market } from '../models/market.js'

const getMarketOffer = async (marketId, offerId) => {
    const market = await Market.findById(marketId)
    return market.offers.id(offerId)
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

export default { getMarketOffer, addOffer, buyOffer, removeOffer }