## 1. Schema & Model Updates

- [x] 1.1 Add `pityCount` (default: 0, min: 0) and `pityMythicsCount` (default: 0, min: 0) to `userSchema` in `models/user.js` and verify with a test query script that defaults are respected.
- [x] 1.2 Verify `metadata` structure for `CARD_BUY` transactions in `models/transaction.js` and ensure pity audit fields are documented.

## 2. Core Business Logic & Endpoints

- [x] 2.1 Implement pity threshold evaluation and guaranteed Mythic roll in `services/userService.js` and `controllers/userController.js`, resetting `pityCount` on mythic drops and returning `isPity` and `pity` payload in `POST /user/:id/cards/roll`.
- [x] 2.2 Update `getUserStats` in `services/userService.js` to include the `pity` metrics object (`pullsSinceLastMythic`, `pityThreshold`, `pullsUntilGuaranteed`, `pityMythicsCount`) in `GET /user/:discordId/stats`.
- [x] 2.3 Update `getUserEffectiveGachaBreakdown` in `services/userService.js` to discount `user.pityMythicsCount` from both effective mythics and total evaluated pulls, verifying that luck scores remain strictly RNG-focused.

## 3. Historical Migration & Backfill

- [x] 3.1 Implement `scripts/backfillPity.js` to calculate consecutive non-mythic pulls by combining `test.users.json` and post-migration `CARD_BUY` transactions, with full support for `--dry-run`.
- [x] 3.2 Run `node scripts/backfillPity.js --dry-run` and live execution against MongoDB to populate `pityCount` and `pityMythicsCount` for all existing users, verifying expected counts (e.g. 0zb at 256).

## 4. Documentation & Vault Sync

- [x] 4.1 Update the centralized Obsidian Vault documentation (`Backend API/` and `Modelos y Contratos/`) via the configured MCP `obsidian_vault` to comply with the Definition of Done in `AGENTS.md`.
