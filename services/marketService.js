// service for market

import { Market } from '../models/market.js'

const getMarketOffer = async (marketId, offerId) => {
    const market = await Market.find({discordId:marketId})
    return market.offers.id(offerId)
}

const getAllMarketOffers = async (marketId) => {
    const market = await Market.find({discordId:marketId}).populate('offers.cardId')
    console.log(market)
    if(!market) return []
    const activeOffers = market[0].offers.filter(offer => offer.active == true)
    if(!market) return []
    return activeOffers
}

const addOffer = async (marketId, offer) => {
  const market = await Market.find({discordId:marketId})
  market[0].offers.push(offer)
  await market[0].save()
}

const buyOffer = async (marketId, offerId, buyerId) => {
    const market = await Market.find({discordId:marketId})
    const offer = market[0].offers.id(offerId)
    if(offer.active == false) throw new Error('Offer is not active')
    if(offer.seller.toString() == buyerId.toString()) throw new Error('You can\'t buy your own offer')
    offer.active = false
    offer.buyer = buyerId
    await market[0].save()
    return offer
}

const removeOffer = async (marketId, offerId, userId) => {
    const market = await Market.find({discordId:marketId})
    const offer = market[0].offers.id(offerId)
    console.log(offer)
    if(!offer) throw new Error('Offer not found')
    if(offer.seller.toString() != userId.toString()) throw new Error('You can\'t remove an offer that is not yours!')
    if(offer.active == false) throw new Error('Offer is not active')
    market[0].offers.pull(offerId)
    await market[0].save()
    return offer
}

export { getMarketOffer, addOffer, buyOffer, removeOffer, getAllMarketOffers }