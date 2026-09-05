# Agent Guidelines for Smilbot Backend

## Tech Stack
- Node.js (ES Modules), Express.js
- MongoDB with Mongoose
- OpenSpec workflow for feature tracking and specifications

## Mandatory Documentation Policy
The `docs/` folder is the primary source of truth for bot developers and integrations:
- **`docs/features/`**: Detailed technical specifications for domain features.
- **`docs/README.md`**: Global route directory and endpoint quick reference.

### Critical Rule:
Any code change that alters, adds, or removes endpoints, parameters, models, or business logic **MUST** update the documentation in `docs/` before completing the task. Never consider a task finished with out-of-sync documentation.
