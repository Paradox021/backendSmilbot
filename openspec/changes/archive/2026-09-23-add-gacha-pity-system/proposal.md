## Why

Players currently experience severe unlucky streaks when opening gacha cards due to the low drop rate of Mythic cards (0.5%), with some active users exceeding 250 consecutive pulls without receiving a single Mythic card. Introducing a deterministic pity system (safety net) at 250 pulls guarantees players a Mythic card, protects long-term engagement, and prevents gacha fatigue while maintaining mathematical integrity in competitive luck rankings.

## What Changes

- Introduce a gacha pity counter (`pityCount`) tracked on the User model that increments with each non-mythic pull and resets to `0` whenever a Mythic card is obtained (whether naturally or via pity).
- Enforce guaranteed Mythic card drop when a user initiates a roll with `pityCount >= 250`, bypassing normal RNG and awarding a random Mythic card (`type: 4`).
- Track cumulative historical pity mythics (`pityMythicsCount`) on the User model.
- Extend `POST /user/:id/cards/roll` response to return `isPity: boolean` and a `pity` progress summary object (`{ current, threshold, remaining }`).
- Extend `GET /user/:discordId/stats` response to return user pity stats (`pullsSinceLastMythic`, `pityThreshold`, `pullsUntilGuaranteed`, `pityMythicsCount`).
- Record pity telemetry in the Ledger: `Transaction` metadata for `CARD_BUY` records `isPity: true/false`, `pityCountBefore`, and `pityCountAfter`.
- Exclude pity mythic cards from the quantitative gacha luck calculation (`gacha-luck`) by discounting them from both earned mythics and total evaluated pulls, ensuring pity rewards do not distort RNG luck ratings.
- Provide a migration and backfill script (`scripts/backfillPity.js`) utilizing historical card data (`test.users.json`) and subsequent ledger transactions to accurately set initial pity counters for existing users.

## Capabilities

### New Capabilities
- `gacha-pity`: Covers pity counter tracking, guaranteed Mythic drops at threshold (250 pulls), pity reset rules, API responses, and ledger audit metadata.

### Modified Capabilities
- `gacha-luck`: Updates the effective gacha rarity calculation to discount pity mythic cards and their corresponding pull counts, preserving genuine RNG luck metrics.

## Impact

- **Database Schemas**:
  - `User`: Adds `pityCount` (Number, default 0, min 0) and `pityMythicsCount` (Number, default 0, min 0).
  - `Transaction`: Adds pity audit metadata (`isPity`, `pityCountBefore`, `pityCountAfter`) in `CARD_BUY` records.
- **API Endpoints**:
  - `POST /user/:id/cards/roll`: Extended JSON payload with `isPity` and `pity` status object.
  - `GET /user/:discordId/stats`: Extended JSON payload with `pity` metrics and separate count of natural vs pity mythics.
- **Business Logic & Services**:
  - `services/cardService.js` & `services/userService.js`: Pity threshold verification, deterministic mythic pulling, and luck neutralization.
- **Scripts**:
  - `scripts/backfillPity.js`: Dedicated CLI migration script supporting `--dry-run`.
- **Documentation (Affected Files)**:
  - Obsidian Vault (`smilbot-vault`):
    - `Modelos y Contratos/Gacha y Pity.md` (Nueva especificación del sistema de piedad).
    - `Modelos y Contratos/Sistema de Suerte y Tiers.md` (Neutralización estadística de pity).
    - `Backend API/Endpoints Cartas.md` (Contrato de API y payload de roll con pity).
    - `Backend API/Endpoints Usuarios y Stats.md` (Esquema de User y payload de stats).
    - `Backend API/Scripts y Mantenimiento.md` (Comandos de backfill).
