# Gacha Pity Specification

## Purpose

Tracks non-mythic gacha pull streaks per user and guarantees a Mythic card drop when reaching the threshold of 250 pulls, exposing pity progress to the Discord bot and ledger.

## Requirements

### Requirement: Pity Counter Tracking and Guaranteed Mythic Drop
The system SHALL track consecutive gacha pulls without a Mythic card in `pityCount` on the user, guaranteeing a random Mythic card (`type: 4`) when a roll occurs with `pityCount >= 250`.

#### Scenario: User initiates a roll below the pity threshold and does not obtain a Mythic
- **WHEN** a user initiates a gacha roll (`POST /user/:id/cards/roll`) with `pityCount < 250` and the rolled card has `type < 4`
- **THEN** the system increments `pityCount` by 1, sets `isPity: false`, and returns the rolled card along with updated pity remaining count

#### Scenario: User initiates a roll below the pity threshold and obtains a natural Mythic
- **WHEN** a user initiates a gacha roll (`POST /user/:id/cards/roll`) with `pityCount < 250` and the random roll generates a Mythic card (`type: 4`)
- **THEN** the system resets `pityCount` to 0, sets `isPity: false`, leaves `pityMythicsCount` unchanged, and returns the natural Mythic card

#### Scenario: User reaches or exceeds pity threshold triggering guaranteed Mythic
- **WHEN** a user initiates a gacha roll (`POST /user/:id/cards/roll`) with `pityCount >= 250`
- **THEN** the system bypasses normal probability tiers, selects a random Mythic card (`type: 4`), increments `pityMythicsCount` by 1, resets `pityCount` to 0, and returns the card with `isPity: true` and `pity: { current: 0, threshold: 250, remaining: 250 }`

### Requirement: Gacha Roll Response Pity Payload
The system SHALL include pity progress indicators in the JSON response of `POST /user/:id/cards/roll`.

#### Scenario: Inspecting roll response for pity metadata
- **WHEN** any successful gacha roll is executed
- **THEN** the response includes `isPity` (boolean) and a `pity` object containing `current` (post-roll pity count), `threshold` (250), and `remaining` (`max(0, 250 - current)`)

### Requirement: Pity Telemetry in Ledger Transactions
The system SHALL persist pity execution status in the transaction ledger for all `CARD_BUY` operations.

#### Scenario: Verifying transaction metadata for pity and non-pity pulls
- **WHEN** a `CARD_BUY` transaction is generated
- **THEN** the `metadata` object includes `isPity` (boolean), `pityCountBefore` (number), and `pityCountAfter` (number)

### Requirement: User Stats Pity Summary
The system SHALL expose detailed pity statistics in the response of `GET /user/:discordId/stats`.

#### Scenario: Requesting user stats with pity metrics
- **WHEN** a client calls `GET /user/:discordId/stats`
- **THEN** the response includes a `pity` object containing `pullsSinceLastMythic`, `pityThreshold` (250), `pullsUntilGuaranteed`, and `pityMythicsCount`
