// router for user

import { Router } from 'express'
import * as userController from '../controllers/userController.js'

const userRouter = Router()

userRouter.get('/', userController.getUsers)
userRouter.post('/id', userController.getUser)
userRouter.post('/', userController.createUser)
userRouter.delete('/:id', userController.deleteUser)
userRouter.post('/:id/dailyBalance', userController.dailyBalance)
userRouter.post('/:id/card/:cardId', userController.addCard)
userRouter.delete('/:id/card/:cardId', userController.removeCard)
userRouter.post('/:id/balance/:amount', userController.addBalance)
userRouter.delete('/:id/balance/:amount', userController.removeBalance)
userRouter.get('/:id/cards', userController.getUserWithCards)
userRouter.get('/:id/cards/number', userController.getUserWithNumberOfCards)

export default userRouter
