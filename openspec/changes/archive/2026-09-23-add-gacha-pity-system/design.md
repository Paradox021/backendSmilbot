## Context

The backend handles gacha rolls via `userController.rollRandomCard`, which queries `cardService.getRandomCard()` (using cumulative roll weights from 0 to 1000) and delegates persistence and balance deduction to `userService.rollRandomCardPurchase`. Ledger entries are saved in `Transaction` with `type: 'CARD_BUY'`. Competitive luck is computed in `userService.getUserEffectiveGachaBreakdown` and `userService.calculateLuckScore`.

Currently, there is no pity counter: every roll is purely independent RNG with a 0.5% chance of rolling a Mythic (`type: 4`).

## Goals / Non-Goals

**Goals:**
- Provide a deterministic hard pity safety net that guarantees a Mythic card at 250 pulls without a Mythic (`pityCount >= 250`).
- Ensure `pityCount` resets to 0 whenever a Mythic is obtained (whether through pity or natural roll).
- Transparently expose pity status in `POST /user/:id/cards/roll` and `GET /user/:discordId/stats`.
- Record pity telemetry in `Transaction` metadata for auditing.
- Isolate pity mythic cards from the quantitative luck formula so guaranteed drops do not distort player luck rankings.
- Accurately backfill existing users' `pityCount` using historical data from `test.users.json` and MongoDB `CARD_BUY` transactions.

**Non-Goals:**
- Soft pity (incremental probability ramps prior to pull 250).
- Pity guarantees for lower rarities (Legendary, Epic, etc.).
- Shared or transferable pity pools between users.

## Decisions

### 1. Hard Pity Check & Card Selection Flow
- **Decision**: In `userService.rollRandomCardPurchase`, or evaluated when preparing the roll in `userController` / `userService`:
  - If `user.pityCount >= 250`:
    - Instead of calling `getRandomCard()`, call `cardService.getMythicCard()` to directly select a random Mythic.
    - Set `isPity = true`.
    - Reset `user.pityCount = 0`.
  - If `user.pityCount < 250`:
    - Perform regular `getRandomCard()`.
    - If the obtained card is Mythic (`card.type === 4`):
      - Set `isPity = false`.
      - Reset `user.pityCount = 0`.
    - If the obtained card is not Mythic (`card.type < 4`):
      - Set `isPity = false`.
      - Increment `user.pityCount += 1`.
- **Alternative considered**: Implementing soft pity (gradually increasing odds from pull 180). Rejected to keep probability math clean, predictable, and aligned with user requirements.

### 2. User Schema Additions
- **Decision**: Add two numeric fields to `models/user.js`:
  ```javascript
  pityCount: { type: Number, default: 0, min: 0 },
  pityMythicsCount: { type: Number, default: 0, min: 0 }
  ```
- **Rationale**: `pityCount` tracks the active streak; `pityMythicsCount` stores lifetime guaranteed drops needed to neutralize luck and display separate stats in Discord.

### 3. Ledger Auditability in Transaction Metadata
- **Decision**: In `rollRandomCardPurchase`, include pity execution details in the `CARD_BUY` transaction metadata:
  ```javascript
  metadata: {
      cardId: card._id,
      cardType: card.type,
      cardName: card.name,
      roll,
      isPity,
      pityCountBefore,
      pityCountAfter: user.pityCount
  }
  ```
- **Rationale**: Complies with the golden rule of ledger immutability and enables full retrospective auditing of gacha behavior.

### 4. Luck Neutralization Formula
- **Decision**: In `getUserEffectiveGachaBreakdown`:
  ```javascript
  const pityCountToDiscount = user.pityMythicsCount || 0
  const adjustedMythic = Math.max(0, breakdown.mythic - pityCountToDiscount)
  const adjustedTotal = Math.max(0, totalCards - pityCountToDiscount)
  breakdown.mythic = adjustedMythic
  totalCards = adjustedTotal
  ```
- **Rationale**: A pity mythic is a deterministic reward, not a random stroke of luck. Subtracting both 1 mythic and 1 total card ensures that the user is evaluated purely on their random pulls without artificially boosting or penalizing their RNG luck rating.

### 5. Historical Backfill Strategy (`scripts/backfillPity.js`)
- **Decision**:
  1. Load `test.users.json` (where `cards` was pushed sequentially in chronological order).
  2. Scan backwards from the end of `u.cards` to find the last occurrence of any Mythic card ID (`642dbd17fc0fd3e62bde6659`, `6481f2c39042a8506a0a2fb9`, `653fbc6f132972fac19121fe`, `6aaac9996b34bd61defaab36`).
  3. The number of non-mythic cards after that index gives `pullsSinceMythicInDump`.
  4. Query MongoDB for all `Transaction` documents with `discordId: u.discordId` and `type: 'CARD_BUY'` sorted by `createdAt: 1`.
  5. Step through each transaction: if `cardType === 4`, reset pity to 0; otherwise increment pity.
  6. Support `--dry-run` to print the summary table without committing.
  7. On live run, update `User.updateOne({ _id: u._id }, { $set: { pityCount: calculatedPity, pityMythicsCount: 0 } })`.

## Risks / Trade-offs

- **[Risk] High-frequency concurrent rolls bypassing pity**:
  - *Mitigation*: Ensure user balance and pity counters are updated and persisted synchronously in `rollRandomCardPurchase`.
- **[Risk] Users who already exceeded 250 pulls (e.g. 0zb at 256)**:
  - *Mitigation*: The condition `pityCount >= 250` immediately triggers on their very first pull after rollout, smoothly absorbing any overshoot without errors.

## Migration Plan

1. Merge schema and service modifications.
2. Run `node scripts/backfillPity.js --dry-run` to inspect proposed values.
3. Run `node scripts/backfillPity.js` to initialize `pityCount` in MongoDB.
4. Verify endpoints and documentation.
