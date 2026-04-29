# Deployment and Release Strategy

This document defines the deployment targets, environment promotion paths, and release procedures for VaultQuest frontend, backend, and Soroban artifacts.

## 1. Environments & Targets

| Environment | Branch | Soroban Network | Backend API | Frontend URL |
| :--- | :--- | :--- | :--- | :--- |
| **Local** | `N/A` | `standalone` | `localhost:3001` | `localhost:3000` |
| **Preview** | PR branches | `N/A` (Tests) | `api-preview.vaultquest.app` | Vercel/Netlify Preview |
| **Staging** | `develop` | `testnet` | `api-staging.vaultquest.app` | `staging.vaultquest.app` |
| **Production** | `main` | `public` | `api.vaultquest.app` | `vaultquest.app` |

## 2. Artifact Propagation

### Soroban Contracts
Contract deployment is the "anchor" for cross-stack changes.
1. **Deployment**: Contracts are deployed to the target network via GitHub Actions.
2. **Metadata**: The resulting Contract IDs are committed to `contracts/ids/[network].json`.
3. **Propagation**: 
   - Backend consumes Contract IDs via environment variables (synced from `ids/[network].json`).
   - Frontend consumes Contract IDs via `NEXT_PUBLIC_` environment variables.

### Feature Flags
Feature flags are managed via:
- **Environment Variables**: For environment-level toggles (e.g., `ENABLE_NEW_DASHBOARD`).
- **External Provider**: (e.g., LaunchDarkly/PostHog) for user-level or percentage rollouts.
Promotion of feature flags happens during the "Manual Approval" gate for Production.

### Backend Services
- **CI/CD**: Docker images are built and pushed to a registry (e.g., GHCR).
- **Promotion**: Images tagged with commit SHA for previews, and `staging`/`latest` for stable environments.

### Frontend
- **Build-time configuration**: Contract IDs must be available at build time for the frontend.

## 3. Release Pipelines

### A. Preview Pipeline (PR Verification)
- Triggered on Pull Requests to `develop` or `main`.
- **Frontend**: Automated preview deployments via Vercel/Netlify.
- **Backend**: CI checks + optional deployment to ephemeral preview environment.
- **Contracts**: Build and Test. No automatic deployment to Testnet to save on network clutter.

### B. Staging Pipeline (Shared Integration)
- Triggered on push to `develop`.
- **Step 1**: Deploy Contracts to Testnet (if changed). Update `contracts/ids/testnet.json`.
- **Step 2**: Run Backend Database Migrations (`prisma migrate deploy`).
- **Step 3**: Deploy Backend API and Indexer to Staging.
- **Step 4**: Deploy Frontend to Staging.

### C. Production Pipeline (Final Release)
- Triggered on push to `main` (merging `develop`).
- **Step 1**: Manual approval gate.
- **Step 2**: Deploy Contracts to Mainnet. Update `contracts/ids/public.json`.
- **Step 3**: Run Production Database Migrations.
- **Step 4**: Deploy Backend API and Indexer.
- **Step 5**: Deploy Frontend to Production.

## 4. Release Checklists

### Frontend-Only Change
- [ ] Lint and Typecheck pass.
- [ ] Preview URL verified on mobile and desktop.
- [ ] No regression in WalletConnect flow.

### Backend-Only Change
- [ ] Unit and Integration tests pass.
- [ ] Migration scripts (Prisma) tested against staging-cloned DB.
- [ ] API documentation (Swagger) updated.

### Contract-Only / Cross-Stack Change
- [ ] Contract tests pass.
- [ ] Contract deployed to Testnet.
- [ ] `contract-ids.json` updated and committed.
- [ ] Backend env vars updated with new IDs.
- [ ] Frontend env vars updated with new IDs.
- [ ] End-to-end flow verified in Staging.

## 5. Rollback & Incident Response

### Frontend/Backend
- **Strategy**: Revert to the previous stable Docker image or Git commit.
- **Process**: Trigger the "Rollback" workflow in GitHub Actions, selecting the target version.

### Soroban Contracts
- **Caution**: Contract state is immutable once updated.
- **Incompatible Change**: If a new contract version breaks compatibility, the frontend/backend must be rolled back to the version supporting the previous Contract ID.
- **Upgradeability**: Contracts using the "Proxy" pattern should be updated via the authorized upgrade path.

## 6. GitHub Configuration

### Environments
- `preview`: No protection.
- `staging`: Automated, requires `develop` branch.
- `production`: Requires manual approval from `maintainers` team.

### Secrets
- `SOROBAN_ACCOUNT_SECRET`: For contract deployment.
- `DATABASE_URL`: Per environment.
- `VERCEL_TOKEN`: For frontend deployments.
- `INTERNAL_SERVICE_SECRET`: For backend-indexer communication.
