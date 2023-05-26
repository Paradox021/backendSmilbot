import { Router } from 'express'
import upload from '../libs/storage.js'
import * as marketController from '../controllers/marketController.js'

const marketRouter = Router()

marketRouter.get('/:marketId/offers', marketController.getMarketOffers)
marketRouter.post('/:marketId/offers', marketController.addOffer)
marketRouter.post('/:marketId/offers/:offerId/buy', marketController.buyOffer)
marketRouter.delete('/:marketId/offers/:offerId', marketController.removeOffer)

export default marketRouter