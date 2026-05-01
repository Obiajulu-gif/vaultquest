# Release Documentation

## Pipeline Overview
The CI/CD pipeline automates the promotion of code from development to production.

### Artifacts
Contract IDs are generated during the `deploy-contracts` job and stored in `contracts/ids/`. These are required by both the backend (for indexing) and the frontend (for transaction signing).

### Rollback
In the event of a critical failure, use the **Rollback Environment** action. Provide the Git SHA of the last stable build. This will trigger a redeployment of that specific state to the target environment.