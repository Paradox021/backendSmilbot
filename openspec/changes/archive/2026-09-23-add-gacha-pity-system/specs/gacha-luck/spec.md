## MODIFIED Requirements

### Requirement: Market Neutralization in Gacha Counts
The system SHALL neutralize secondary market distortions and deterministic pity rewards by adjusting card counts according to market history and pity metrics, ensuring luck evaluates genuine RNG gacha pulls.

#### Scenario: Reconciling market purchases and sales
- **WHEN** a user's effective gacha rarity breakdown is computed
- **THEN** the system subtracts cards bought from the market (`MarketOffer` with `status: 'SOLD'` where user was buyer) and adds cards sold on the market (`MarketOffer` with `status: 'SOLD'` where user was seller), ensuring $\text{GachaCards} = \text{Inventory} - \text{Purchases} + \text{Sales}$

#### Scenario: Excluding pity mythic cards from luck calculations
- **WHEN** a user's effective gacha rarity breakdown and card totals are computed
- **THEN** the system subtracts `user.pityMythicsCount` from both effective mythic card count (`breakdown.mythic`) and total effective gacha cards (`totalCards`), ensuring guaranteed pity drops do not inflate or distort RNG luck scores

### Requirement: User Stats Luck Summary
The system SHALL include a `luck` summary object in the response of `GET /user/:discordId/stats`, displaying natural gacha rarity counts separate from deterministic pity mythics.

#### Scenario: User has met the leaderboard qualification threshold
- **WHEN** a client requests `/user/:discordId/stats` for a user with 20 or more effective gacha cards
- **THEN** the response includes a `luck` property with `eligibleForLeaderboard: true`, their `luckPercentage`, `luckDelta`, `tier`, `tierCode`, and rarity breakdown excluding pity mythics

#### Scenario: User has fewer than the threshold cards
- **WHEN** a client requests `/user/:discordId/stats` for a user with fewer than 20 effective gacha cards
- **THEN** the response includes a `luck` property with `eligibleForLeaderboard: false`, `cardsNeeded` indicating remaining cards to reach 20, alongside their preliminary score and breakdown
