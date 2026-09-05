## 1. Core Luck Calculation & Service Logic

- [x] 1.1 Implement luck evaluation helper `calculateLuckScore` in `services/userService.js` with weights (Common: 1, Rare: 3, Epic: 10, Legendary: 50, Mythic: 200, E=4.475) and English tier codes (`GODLY`, `LUCKY`, `AVERAGE`, `UNLUCKY`, `CURSED`)
- [x] 1.2 Implement helper to calculate effective gacha cards reconciling inventory with market history ($\text{Gacha} = \text{Inventory} - \text{Purchases} + \text{Sales}$) using `MarketOffer` records
- [x] 1.3 Implement `getLeaderboardLuck` in `services/userService.js` that aggregates effective gacha rarity counts, filters by `minPulls` (default 20), sorts by `order` (`desc` for lucky, `asc` for cursed), and limits results
- [x] 1.4 Update `getUserStats` in `services/userService.js` to attach the `luck` summary object (including `eligibleForLeaderboard`, delta, tier, and breakdown)

## 2. API Endpoints & Routing

- [x] 2.1 Add `getLuckLeaderboard` in `controllers/leaderboardController.js` with parameter parsing for `order`, `minPulls`, and `limit`
- [x] 2.2 Register `GET /luck` route in `routers/leaderboardRouter.js`

## 3. Documentation & Verification

- [x] 3.1 Update `docs/features/telemetria-y-ledger.md` and `docs/README.md` with `/leaderboard/luck` usage examples and updated `/user/:discordId/stats` response format
- [x] 3.2 Validate behavior through automated script or API test requests verifying both `order=desc` and `order=asc` queries as well as minimum pull filtering and market adjustment logic
