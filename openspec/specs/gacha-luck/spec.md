# Gacha Luck Specification

## Purpose
Calculates gacha luck metrics by evaluating user inventory rarity distribution against theoretical drop rates, exposing competitive rankings and player profile stats.

## Requirements

### Requirement: Gacha Luck Leaderboard Endpoint
The system SHALL expose an endpoint `GET /leaderboard/luck` that returns a ranked list of users ordered by their gacha luck relative to theoretical drop rates.

#### Scenario: Requesting default luck leaderboard
- **WHEN** a client sends a `GET` request to `/leaderboard/luck` without query parameters
- **THEN** the system returns HTTP 200 with a list of up to 10 users having at least 20 effective gacha cards, sorted by luck percentage in descending order (`order=desc`)

#### Scenario: Requesting unlucky/cursed leaderboard
- **WHEN** a client sends a `GET` request to `/leaderboard/luck?order=asc`
- **THEN** the system returns HTTP 200 with users sorted by luck percentage in ascending order (worst luck first), excluding users with fewer than `minPulls` effective cards

#### Scenario: Customizing limit and minimum pulls threshold
- **WHEN** a client sends a `GET` request with query parameters `limit=25` and `minPulls=15`
- **THEN** the system returns at most 25 qualifying users who have at least 15 effective gacha cards

### Requirement: Quantitative Luck Metric and Rarity Scoring
The system SHALL compute luck using fixed point weights per card rarity (Common: 1, Rare: 3, Epic: 10, Legendary: 50, Mythic: 200) relative to the baseline expected average of 4.475 points per card.

#### Scenario: Calculating luck score and percentage delta
- **WHEN** a user's collection is evaluated
- **THEN** the system computes `luckPercentage` as `(actualPoints / expectedPoints) * 100` and `luckDelta` as `((actualPoints / expectedPoints) - 1) * 100`, formatted with a sign prefix (e.g., `+25.4%` or `-18.2%`)

#### Scenario: Assigning standardized tier codes
- **WHEN** a user's luck delta is calculated
- **THEN** the system assigns:
  - `tierCode: "GODLY"` and `tier: "Godly Luck"` if delta > +40%
  - `tierCode: "LUCKY"` and `tier: "Lucky"` if delta is between +15% and +40%
  - `tierCode: "AVERAGE"` and `tier: "Average"` if delta is between -15% and +15%
  - `tierCode: "UNLUCKY"` and `tier: "Unlucky"` if delta is between -30% and -15%
  - `tierCode: "CURSED"` and `tier: "Cursed"` if delta < -30%

### Requirement: Market Neutralization in Gacha Counts
The system SHALL neutralize secondary market distortions by adjusting card counts according to market history, ensuring luck evaluates genuine gacha pulls.

#### Scenario: Reconciling market purchases and sales
- **WHEN** a user's effective gacha rarity breakdown is computed
- **THEN** the system subtracts cards bought from the market (`MarketOffer` with `status: 'SOLD'` where user was buyer) and adds cards sold on the market (`MarketOffer` with `status: 'SOLD'` where user was seller), ensuring $\text{GachaCards} = \text{Inventory} - \text{Purchases} + \text{Sales}$

### Requirement: User Stats Luck Summary
The system SHALL include a `luck` summary object in the response of `GET /user/:discordId/stats`.

#### Scenario: User has met the leaderboard qualification threshold
- **WHEN** a client requests `/user/:discordId/stats` for a user with 20 or more effective gacha cards
- **THEN** the response includes a `luck` property with `eligibleForLeaderboard: true`, their `luckPercentage`, `luckDelta`, `tier`, `tierCode`, and rarity breakdown

#### Scenario: User has fewer than the threshold cards
- **WHEN** a client requests `/user/:discordId/stats` for a user with fewer than 20 effective gacha cards
- **THEN** the response includes a `luck` property with `eligibleForLeaderboard: false`, `cardsNeeded` indicating remaining cards to reach 20, alongside their preliminary score and breakdown
