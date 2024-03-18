// router for card

import { Router } from 'express'
import upload from '../libs/storage.js'
import * as cardController from '../controllers/cardController.js'
import verifyToken from '../middleware/verifyToken.js'
const cardRouter = Router()

cardRouter.get('/', verifyToken, cardController.getCards)
cardRouter.get('/mythic', verifyToken, cardController.getMythicCard)
cardRouter.get('/legendary', verifyToken, cardController.getLegendaryCard)
cardRouter.get('/epic', verifyToken, cardController.getEpicCard)
cardRouter.get('/rare', verifyToken, cardController.getRareCard)
cardRouter.get('/common', verifyToken, cardController.getCommonCard)
cardRouter.get('/:id', verifyToken, cardController.getCard)
cardRouter.post('/', verifyToken, upload.single('image'), cardController.createCard)
cardRouter.delete('/:id', verifyToken, cardController.deleteCard)

export default cardRouter