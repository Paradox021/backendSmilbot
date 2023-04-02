// router for card

import { Router } from 'express'
import upload from '../libs/storage.js'
import * as cardController from '../controllers/cardController.js'

const cardRouter = Router()

cardRouter.get('/', cardController.getCards)
cardRouter.get('/mythic', cardController.getMythicCard)
cardRouter.get('/legendary', cardController.getLegendaryCard)
cardRouter.get('/epic', cardController.getEpicCard)
cardRouter.get('/rare', cardController.getRareCard)
cardRouter.get('/common', cardController.getCommonCard)
cardRouter.get('/:id', cardController.getCard)
cardRouter.post('/', upload.single('image'), cardController.createCard)
cardRouter.delete('/:id', cardController.deleteCard)

export default cardRouter