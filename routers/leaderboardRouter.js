// router for leaderboard

import { Router } from 'express'
import * as leaderboardController from '../controllers/leaderboardController.js'

const leaderboardRouter = Router()

leaderboardRouter.get('/streaks', leaderboardController.getStreaksLeaderboard)
leaderboardRouter.get('/wealth', leaderboardController.getWealthLeaderboard)
leaderboardRouter.get('/cards', leaderboardController.getCardsLeaderboard)

export default leaderboardRouter
