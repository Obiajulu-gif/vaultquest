# Release & Deployment Strategy

This document outlines the deployment and release process for VaultQuest.

## 1. Deployment Targets

### Environments

- **Preview**: Ephemeral environments for pull requests (frontend only)
- **Staging**: Pre-production environment (develop branch)
  - Network: Stellar Testnet
  - Purpose: Integration testing and QA
- **Production**: Live environment (main branch)
  - Network: Stellar Mainnet
  - Purpose: End-user facing

### Branch Mapping

| Branch   | Environment | Network         | Auto-Deploy |
|----------|-------------|-----------------|-------------|
| PR       | Preview     | Testnet         | Yes         |
| develop  | Staging     | Testnet         | Yes         |
| main     | Production  | Mainnet/Public  | Yes         |

## 2. Artifact Propagation

### Soroban Contracts

1. **Build**: Contracts are compiled to WASM and optimized
2. **Deploy**: Deployed to the target network (testnet or mainnet)
3. **Metadata**: The resulting Contract IDs are committed to `contracts/ids/[network].json`
4. **Propagation**: 
   - Backend consumes Contract IDs via environment variables (synced from `contracts/ids/[network].json`)
   - Frontend consumes Contract IDs via `NEXT_PUBLIC_` environment variables
   - Indexer reads Contract IDs from the artifact uploaded in the contracts job

### Backend

1. **Database Migrations**: Prisma migrations are applied first using `prisma migrate deploy`
2. **Contract IDs**: Contract IDs are loaded from the artifact created by the contracts job
3. **Deployment**: Backend API is deployed to the configured cloud provider
4. **Environment Variables**: 
   - `DATABASE_URL`: PostgreSQL connection string
   - `CLOUD_PROVIDER`: Target deployment platform (Railway, Fly.io, AWS, etc.)
   - Contract IDs loaded from `contracts/ids/[network].json`

### Event Indexer

1. **Contract IDs**: Indexer receives Contract IDs from the contracts job artifact
2. **Deployment**: Indexer is deployed to the same cloud provider as backend
3. **Configuration**: Indexer connects to the same database as backend

### Frontend

1. **Contract IDs**: Frontend receives Contract IDs via environment variables
2. **Build**: Next.js application is built with proper environment variables
3. **Deployment**: Deployed to Vercel
4. **Environment Variables**:
   - `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`: WalletConnect project identifier
   - `NEXT_PUBLIC_NETWORK`: Network identifier (testnet or public)
   - Contract IDs exposed via `NEXT_PUBLIC_` prefix

## 3. CI/CD Pipelines

### Continuous Integration (Per Component)

**Contracts** (`contracts.yml`):
- Trigger: Push/PR to contracts directory
- Steps: Lint (clippy), test, build WASM

**Backend** (`backend.yml`):
- Trigger: Push/PR to backend directory
- Steps: Lint, test, build

**Frontend** (`frontend.yml`):
- Trigger: Push/PR to frontend directory
- Steps: Lint, build, preview deployment (PRs from same repo only)

### Continuous Deployment (`cd.yml`)

**Trigger**: Push to `main` or `develop` branches

**Job Sequence**:

1. **deploy-contracts**
   - Builds and deploys Soroban contracts
   - Uploads contract IDs as artifact
   - Commits IDs to repo (develop branch only)
   
2. **deploy-backend** (depends on contracts)
   - Downloads contract IDs artifact
   - Runs database migrations
   - Deploys backend API
   
3. **deploy-indexer** (depends on contracts)
   - Downloads contract IDs artifact
   - Deploys event indexer
   
4. **deploy-frontend** (depends on contracts)
   - Downloads contract IDs artifact
   - Deploys to Vercel

**Key Features**:
- Contract IDs are propagated via GitHub Actions artifacts
- Each job downloads the latest contract IDs
- No cross-job file dependencies (each job is isolated)
- Sequential deployment ensures correct dependency order

## 4. Required Secrets & Variables

### Repository Secrets

Configure these in GitHub Settings → Secrets and variables → Actions:

**Contracts**:
- `SOROBAN_ACCOUNT_SECRET`: Private key for deploying contracts

**Backend**:
- `DATABASE_URL`: PostgreSQL connection string
- `CLOUD_PROVIDER`: Target cloud platform (Railway, Fly.io, AWS, GCP, etc.)

**Frontend**:
- `VERCEL_TOKEN`: Vercel authentication token
- `VERCEL_ORG_ID`: Vercel organization ID
- `VERCEL_PROJECT_ID`: Vercel project ID
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`: WalletConnect project ID

### GitHub Environments

Create these environments in GitHub Settings → Environments:

1. **preview**
   - Protection rules: None
   - Used for PR deployments

2. **staging**
   - Protection rules: Optional (require reviewers)
   - Used for develop branch

3. **production**
   - Protection rules: Required reviewers, wait timer
   - Used for main branch

## 5. Deployment Script Requirements

### Contract Deployment Script

Create `contracts/scripts/deploy.sh`:

```bash
#!/bin/bash
set -e

NETWORK=$1

if [ -z "$NETWORK" ]; then
  echo "Usage: $0 <network>"
  exit 1
fi

echo "Deploying to $NETWORK..."

# Build contracts
cargo build --release --target wasm32-unknown-unknown

# Deploy each contract and capture IDs
# Example:
DRIP_POOL_ID=$(soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/drip_pool.wasm \
  --source $SOROBAN_ACCOUNT_SECRET \
  --rpc-url $RPC_URL \
  --network-passphrase "$NETWORK_PASSPHRASE")

# Write contract IDs to JSON
mkdir -p contracts/ids
cat > contracts/ids/$NETWORK.json <<EOF
{
  "drip_pool": "$DRIP_POOL_ID"
}
EOF

echo "Contract IDs saved to contracts/ids/$NETWORK.json"
```

Make it executable:
```bash
chmod +x contracts/scripts/deploy.sh
```

## 6. Rollback Procedures

### Using the Rollback Workflow

1. Go to **Actions** → **Rollback Deployment**
2. Click **Run workflow**
3. Fill in the required inputs:
   - **Environment**: production or staging
   - **Component**: Which part to rollback (all, contracts, backend, indexer, frontend)
   - **Version**: Git tag or commit SHA to rollback to
   - **Reason**: Explanation for the rollback
4. Confirm and run

The workflow will:
- Validate the target version exists
- Create a tracking issue
- Deploy the selected component(s) to the target version
- Update the tracking issue with results

### Manual Rollback

If the automated rollback fails:

**Contracts**:
```bash
git checkout <version>
cd contracts
./scripts/deploy.sh <network>
```

**Backend**:
```bash
git checkout <version>
# Deploy using your cloud provider's CLI
# For database migrations, manually verify state
```

**Frontend**:
```bash
# Use Vercel dashboard to rollback to previous deployment
# Or redeploy from specific commit
```

### Database Rollback

⚠️ **Warning**: Database rollbacks require careful manual intervention

1. Identify the migration to rollback to
2. Use Prisma's migration resolution:
   ```bash
   npx prisma migrate resolve --rolled-back <migration_name>
   ```
3. Manually verify data integrity
4. Consider creating a migration to reverse changes instead

## 7. Monitoring & Verification

### Post-Deployment Checks

**Contracts**:
- Verify contract IDs in `contracts/ids/[network].json`
- Test contract invocations on network
- Check Stellar Expert/Stellarterm for contract status

**Backend**:
- Health check endpoint returns 200
- Database migrations applied successfully
- Logs show no errors

**Indexer**:
- Indexer is processing events
- Database is being populated
- No error logs

**Frontend**:
- Application loads successfully
- Wallet connection works
- Contract interactions succeed

### Monitoring Tools

- **Stellar Dashboard**: Monitor network status
- **Cloud Provider Dashboards**: Check application health
- **Database Monitoring**: PostgreSQL query performance
- **Frontend Monitoring**: Vercel Analytics, error tracking

## 8. Troubleshooting

### Common Issues

**Contract deployment fails**:
- Verify `SOROBAN_ACCOUNT_SECRET` is correct
- Check account has sufficient XLM balance
- Ensure RPC endpoint is accessible

**Database migration fails**:
- Check `DATABASE_URL` is correct
- Verify database is accessible from runner
- Review migration SQL for errors

**Frontend deployment fails**:
- Verify all `NEXT_PUBLIC_` environment variables are set in Vercel
- Check build logs for errors
- Ensure contract IDs are properly loaded

**Artifact not found**:
- Check the contracts job completed successfully
- Verify artifact name matches in download step
- Ensure artifact retention period hasn't expired

## 9. Best Practices

1. **Test on staging first**: Always deploy to staging/testnet before production
2. **Version everything**: Use Git tags for releases
3. **Monitor deployments**: Watch logs during and after deployment
4. **Have rollback ready**: Know your rollback procedure before deploying
5. **Document incidents**: Track issues and resolutions
6. **Gradual rollouts**: Consider feature flags for risky changes
7. **Database backups**: Always backup before migrations
8. **Communication**: Notify team of deployments

## 10. Release Checklist

Before releasing to production:

- [ ] All tests pass on staging
- [ ] Manual QA completed
- [ ] Database migrations tested
- [ ] Contract deployments verified on testnet
- [ ] Performance testing completed
- [ ] Security review (if applicable)
- [ ] Documentation updated
- [ ] Team notified
- [ ] Rollback plan ready
- [ ] Post-deployment verification steps prepared