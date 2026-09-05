## Why

Users in the community love comparing their gacha luck to celebrate high-rarity pulls ("blessed") or commiserate over poor drop rates ("cursed"). Because the backend already defines fixed tier drop probabilities in `cardService.js` and stores each user's card collection in `User.cards`, we can calculate a quantitative luck score and expose leaderboard rankings as well as individual luck stats for the Discord bot.

## What Changes

- **New Leaderboard Endpoint (`GET /leaderboard/luck`)**: Provides a sorted ranking of users by gacha luck percentage and delta relative to statistical expectations ($E = 4.475$ points per card).
  - Supports `order=desc` (default, luckiest/blessed) and `order=asc` (unluckiest/cursed).
  - Enforces a default minimum threshold of 20 cards (`minPulls=20`) to prevent low-sample distortion.
  - Returns structured rarity breakdowns and English tier labels (`GODLY`, `LUCKY`, `AVERAGE`, `UNLUCKY`, `CURSED`).
- **User Stats Enrichment (`GET /user/:discordId/stats`)**: Adds a `luck` object to the existing profile stats, reporting the user's score, percentage, tier, and eligibility status for the leaderboard.
- **Luck Computation Service**: Introduces helper logic in `userService.js` to compute expected vs actual luck points based on inventory rarity distribution.

## Capabilities

### New Capabilities
- `gacha-luck`: Calculates user luck metrics against rarity drop probabilities, providing `GET /leaderboard/luck` and enriching `GET /user/:discordId/stats` with a `luck` summary.

### Modified Capabilities
<!-- None: openspec/specs is currently empty. -->

## Impact

- **APIs Affected**:
  - `GET /leaderboard/luck` (new endpoint in `routers/leaderboardRouter.js` & `controllers/leaderboardController.js`).
  - `GET /user/:discordId/stats` (response payload enriched with `luck`).
- **Services Affected**:
  - `services/userService.js`: Adds leaderboard query and user luck calculation functions.
- **Dependencies**: No external dependencies added; uses native MongoDB aggregations / Mongoose queries.
