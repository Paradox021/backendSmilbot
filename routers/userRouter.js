// router for user

import { Router } from 'express'
import * as userController from '../controllers/userController.js'
import verifyToken from '../middleware/verifyToken.js'

const userRouter = Router()

userRouter.get('/', verifyToken, userController.getUsers)
userRouter.post('/id', verifyToken, userController.getUser)
userRouter.post('/', verifyToken, userController.createUser)
userRouter.delete('/:id', verifyToken, userController.deleteUser)
userRouter.post('/:id/dailyBalance', verifyToken, userController.dailyBalance)
userRouter.post('/:id/card/:cardId', verifyToken, userController.addCard)
userRouter.delete('/:id/card/:cardId', verifyToken, userController.removeCard)
userRouter.post('/:id/balance/:amount', verifyToken, userController.addBalance)
userRouter.delete('/:id/balance/:amount', verifyToken, userController.removeBalance)
userRouter.get('/:id/cards', verifyToken, userController.getUserWithCards)
userRouter.get('/:id/cards/number', verifyToken, userController.getUserWithNumberOfCards)

export default userRouter
