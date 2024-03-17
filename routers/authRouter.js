import { Router } from 'express'
import authController from '../controllers/authController.js'

const authRouter = Router()

authRouter.get('/discord', authController.discordAuth)

export default authRouter