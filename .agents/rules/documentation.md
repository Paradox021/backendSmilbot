# Documentation Maintenance Rules

This repository maintains comprehensive documentation under `docs/` as the single source of truth for the Smilbot Discord Bot integration and backend APIs.

## Mandatory Rules for AI Agents

1. **Synchronized Documentation Updates**:
   - Whenever you create, modify, or deprecate an API endpoint, controller, or route, you **MUST** update:
     - The corresponding feature spec file under `docs/features/` (e.g., `docs/features/telemetria-y-ledger.md`, `docs/features/mercado-p2p.md`, etc.).
     - The global index and routes table in `docs/README.md`.
   - Never mark an implementation task or user request as complete without having verified and updated the relevant `docs/` files.

2. **Schema & Contract Accuracy**:
   - Every documented endpoint must accurately describe:
     - HTTP Method and exact route (including query params).
     - Request body payload schema (if applicable).
     - Response status codes and complete JSON response examples.
     - Any business rules, rate limits, or error conditions.

3. **OpenSpec Changes**:
   - Any OpenSpec proposal and task list (`tasks.md`) MUST include an explicit task step for updating documentation in `docs/`.
