import { Router } from 'express'
import * as marketController from '../controllers/marketController.js'
import verifyToken from '../middleware/verifyToken.js'

const marketRouter = Router()

marketRouter.get('/:marketId/offers', verifyToken, marketController.getAllMarketOffers)
marketRouter.post('/:marketId/offers', verifyToken, marketController.addOffer)
marketRouter.post('/:marketId/offers/:offerId/buy', verifyToken, marketController.buyOffer)
marketRouter.delete('/:marketId/offers/:offerId', verifyToken, marketController.removeOffer)

export default marketRouter