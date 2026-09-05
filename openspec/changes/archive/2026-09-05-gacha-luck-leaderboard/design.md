## Context

See `proposal.md` for motivation. The backend represents user inventories as an array of `{ cardId, count }` in `User.cards`, and card catalog items contain a `type` (0 = Common, 1 = Rare, 2 = Epic, 3 = Legendary, 4 = Mythic) in `models/card.js`. Drop rates are defined in `services/cardService.js`:
- Mythic (type 4): 0.5% (p = 0.005)
- Legendary (type 3): 2.0% (p = 0.020)
- Epic (type 2): 10.0% (p = 0.100)
- Rare (type 1): 30.0% (p = 0.300)
- Common (type 0): 57.5% (p = 0.575)

Furthermore, all historical secondary market transactions are recorded in `market_offers` (`models/marketOffer.js`) with `status: 'SOLD'`, referencing `cardId`, `buyer`, and `seller`.

## Goals / Non-Goals

**Goals:**
- Provide a consistent formula for scoring user gacha luck based on their effective gacha pulls.
- Neutralize secondary market effects: users who bought cards on the market must not have their luck artificially boosted, and users who sold rolled cards must not have their luck penalized.
- Expose `GET /leaderboard/luck` with ranking by luckiest (`desc`) and unluckiest/cursed (`asc`).
- Filter out users who have fewer than `minPulls` (default 20) in leaderboard queries.
- Enrich `GET /user/:discordId/stats` with a `luck` breakdown and eligibility flag.
- Use English response keys and tier identifiers (`GODLY`, `LUCKY`, `AVERAGE`, `UNLUCKY`, `CURSED`).

**Non-Goals:**
- Modifying roll algorithms or altering drop rates in `cardService.js`.
- Modifying existing market purchase/sell logic.

## Decisions

### Decision 1: Scoring Algorithm and Weights
- **Choice**: Weighted Point Expected Value ($E = 4.475$ pts / card).
  - Weights: Common = 1, Rare = 3, Epic = 10, Legendary = 50, Mythic = 200.
  - $E = (0.575 \times 1) + (0.300 \times 3) + (0.100 \times 10) + (0.020 \times 50) + (0.005 \times 200) = 4.475$.
  - Formula: $\text{luckPercentage} = (\text{actualPoints} / (N \times 4.475)) \times 100$.
  - Delta: $\text{luckDelta} = \text{luckPercentage} - 100\%$.
- **Rationale**: Highly intuitive and produces clear, human-readable percentages (e.g. `+34.2%` or `-21.5%`) for Discord bot embeds.
- **Alternatives Considered**: Z-Score (statistically rigorous but confusing for casual Discord users who expect a percentage score).

### Decision 2: Market Neutralization Equation ($G = I - B + S$)
- **Choice**: Compute effective gacha pulls per card type as:
  $$\text{GachaCards} = \text{CurrentInventory} - \text{MarketPurchases} + \text{MarketSales}$$
  - Cards bought from the market (`MarketOffer` with `buyer: user._id, status: 'SOLD'`) are subtracted from the user's inventory.
  - Cards sold on the market (`MarketOffer` with `seller: user._id, status: 'SOLD'`) were obtained via gacha and are credited back to the seller's luck.
- **Rationale**: Completely eliminates pay-to-win luck distortion (buying Mythics does not improve your luck score) and preserves historical accuracy for legacy users before telemetry without needing complex log replays.

### Decision 3: Qualification Threshold (`minPulls = 20`)
- **Choice**: Default 20 total effective gacha cards required to appear on `/leaderboard/luck`.
- **Rationale**: Prevents users with very few pulls (e.g. 1 roll yielding 1 Mythic) from artificially dominating the leaderboard. Users below 20 still see their score in `/user/:discordId/stats` with `eligibleForLeaderboard: false`.

### Decision 4: Tier Classification Scale
- **Choice**:
  - `GODLY` (> +40% delta): "Godly Luck"
  - `LUCKY` (+15% to +40%): "Lucky"
  - `AVERAGE` (-15% to +15%): "Average"
  - `UNLUCKY` (-30% to -15%): "Unlucky"
  - `CURSED` (< -30% delta): "Cursed"

### Decision 5: Query Optimization
- **Choice**: Load card types into an in-memory lookup map (`cardId -> type`). For individual stats, query user's sold and bought offers in `MarketOffer`. For the leaderboard, batch-aggregate or aggregate user inventories adjusted by sold/bought offers.

## Risks / Trade-offs

- **[Trade-off: Negative adjusted counts in edge cases where a user traded outside the market]** → *Mitigation*: Clamped at 0 (`Math.max(0, count)`) per card so counts never become negative.
- **[Performance: Aggregating MarketOffers across all users]** → *Mitigation*: `MarketOffer` is already indexed on `{ seller: 1, status: 1 }` and `{ buyer: 1, status: 1 }`, ensuring near-instant lookups.
