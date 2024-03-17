import { Router } from 'express'
import * as authController from '../controllers/authController.js'

const authRouter = Router()

authRouter.get('/discord', authController.discordAuth)
authRouter.get('/discord/callback', authController.discordAuthCallback)

export default authRouter