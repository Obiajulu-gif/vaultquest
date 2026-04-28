# Drip Wave State Model

## Overview

This document defines the core domain model and state flow for Drip Wave, a prize-linked savings protocol on Stellar. It establishes the data contract between frontend, Soroban contracts, and backend services.

## Core Entities

### 1. Vault (Prize Pool)

A vault represents a prize-linked savings pool where users deposit assets to earn yield and win prizes.

```typescript
interface Vault {
  // Soroban contract address
  id: string;
  
  // Metadata
  name: string;
  description: string;
  protocol: "Drip Wave";
  network: "Stellar";
  
  // Token configuration
  token: {
    address: string;  // Stellar asset address
    symbol: string;   // e.g., "XLM", "USDC"
    decimals: number;
  };
  
  // Pool economics
  totalDeposits: string;      // Total principal deposited
  totalYield: string;         // Total yield generated
  prizePool: string;          // Current prize pool size
  apr: number;                // Annual percentage rate
  
  // Participation
  participantCount: number;
  
  // Timing
  createdAt: number;
  nextPrizeDraw: number;
  prizeCadence: "daily" | "weekly" | "monthly";
  
  // Status
  status: VaultStatus;
  
  // Source: Soroban contract reads
}
```

### 2. User Position

A user's deposit position in a specific vault.

```typescript
interface UserPosition {
  // Identification
  id: string;                 // Composite: vaultId + userAddress
  vaultId: string;
  userAddress: string;
  
  // Position details
  principalAmount: string;    // Original deposit amount
  currentAmount: string;      // Principal + accrued yield
  yieldEarned: string;        // Total yield earned
  
  // Prize eligibility
  isEligible: boolean;
  ticketsCount: number;       // Number of prize tickets
  
  // Timing
  depositedAt: number;
  lastYieldAt: number;
  
  // Status
  status: PositionStatus;
  
  // Source: Soroban contract reads
}
```

### 3. Subscription (Drip)

A recurring deposit configuration for automated savings.

```typescript
interface Subscription {
  // Identification
  id: string;
  userAddress: string;
  vaultId: string;
  
  // Configuration
  amount: string;
  frequency: "daily" | "weekly" | "monthly";
  nextExecution: number;
  
  // Status
  status: SubscriptionStatus;
  
  // Execution history
  lastExecutedAt?: number;
  totalExecuted: number;
  
  // Source: Backend / Indexed data
}
```

### 4. Payout (Prize)

A prize awarded to a user.

```typescript
interface Payout {
  // Identification
  id: string;
  vaultId: string;
  winnerAddress: string;
  
  // Prize details
  amount: string;
  token: {
    address: string;
    symbol: string;
  };
  
  // Timing
  awardedAt: number;
  
  // Claim status
  status: PayoutStatus;
  claimedAt?: number;
  txHash?: string;
  
  // Source: Backend / Indexed data
}
```

### 5. Transaction

A first-class transaction status tracking object.

```typescript
interface Transaction {
  // Identification
  id: string;
  userAddress: string;
  
  // Transaction details
  type: TransactionType;
  vaultId?: string;
  amount?: string;
  
  // Stellar transaction
  txHash?: string;
  
  // Status
  status: TransactionStatus;
  
  // Error handling
  error?: string;
  errorCode?: string;
  
  // Timing
  createdAt: number;
  submittedAt?: number;
  confirmedAt?: number;
  
  // Source: Local optimistic state + Soroban confirmation
}
```

## State Ownership Boundaries

### Soroban Contract (On-Chain State)

**Reads:**
- Vault total deposits, yield, prize pool
- User positions (principal, yield, eligibility)
- Transaction confirmations

**Writes:**
- Deposits, withdrawals
- Prize distribution
- Position updates

**Update Frequency:** Real-time via contract events

### Backend / Indexer (Indexed State)

**Reads:**
- Historical transaction data
- Payout history
- Subscription configurations
- User activity history

**Writes:**
- Subscription scheduling
- Payout records
- Analytics aggregation

**Update Frequency:** Near real-time via event indexing

### Local State (Optimistic UI)

**Reads:**
- Pending transaction status
- Form input state
- UI-specific filters/sorting

**Writes:**
- Transaction initiation
- Optimistic balance updates
- UI preferences

**Update Frequency:** Immediate on user action

## User Journey State Flow

### 1. Landing → Connect

```
State: Disconnected
  ↓ [User clicks connect]
State: Connecting
  ↓ [Wallet connected]
State: Connected
  - walletAddress set
  - network confirmed (Stellar)
```

### 2. Connect → Browse Vaults

```
State: Connected
  ↓ [Load vaults]
State: LoadingVaults
  ↓ [Soroban read + Backend index]
State: VaultsLoaded
  - vaults array populated
  - user positions loaded
```

### 3. Browse → Deposit

```
State: VaultsLoaded
  ↓ [User selects vault + enters amount]
State: TransactionPending
  - tx: { type: 'deposit', status: 'pending' }
  ↓ [User confirms]
State: TransactionSubmitted
  - tx: { status: 'submitted', txHash: '...' }
  ↓ [Soroban confirmation]
State: TransactionConfirmed
  - tx: { status: 'confirmed' }
  - userPosition updated
  - vault.totalDeposits updated
```

### 4. Deposit → Create Subscription

```
State: TransactionConfirmed
  ↓ [User configures subscription]
State: SubscriptionPending
  ↓ [Backend creates schedule]
State: SubscriptionActive
  - subscription: { status: 'active' }
```

### 5. Monitor → Prize Won

```
State: SubscriptionActive
  ↓ [Prize draw event]
State: PrizeAwarded
  - payout: { status: 'unclaimed' }
  ↓ [User claims]
State: ClaimPending
  - tx: { type: 'claim', status: 'pending' }
  ↓ [Soroban confirmation]
State: ClaimConfirmed
  - payout: { status: 'claimed' }
```

### 6. Monitor → Withdraw

```
State: SubscriptionActive
  ↓ [User initiates withdrawal]
State: WithdrawalPending
  - tx: { type: 'withdraw', status: 'pending' }
  ↓ [Soroban confirmation]
State: WithdrawalConfirmed
  - tx: { status: 'confirmed' }
  - userPosition: { status: 'withdrawn' }
  - subscription: { status: 'cancelled' }
```

## Type Definitions

### Vault Status

```typescript
type VaultStatus = 
  | 'active'        // Accepting deposits
  | 'paused'        // Temporarily paused
  | 'closed'        // No longer accepting deposits
  | 'completed';    // Prize pool exhausted
```

### Position Status

```typescript
type PositionStatus = 
  | 'active'        // Currently earning yield
  | 'withdrawing'   // Withdrawal in progress
  | 'withdrawn'     // Fully withdrawn
  | 'ineligible';   // Not eligible for prizes
```

### Subscription Status

```typescript
type SubscriptionStatus = 
  | 'active'        // Scheduled and running
  | 'paused'        // Temporarily paused by user
  | 'cancelled'     // Cancelled by user
  | 'failed';       // Execution failed
```

### Payout Status

```typescript
type PayoutStatus = 
  | 'unclaimed'     // Awaiting claim
  | 'claiming'      // Claim transaction pending
  | 'claimed'       // Successfully claimed
  | 'expired';      // Claim window expired
```

### Transaction Type

```typescript
type TransactionType = 
  | 'deposit'       // Deposit to vault
  | 'withdraw'      // Withdraw from vault
  | 'claim'         // Claim prize
  | 'subscribe'     // Create subscription
  | 'unsubscribe';  // Cancel subscription
```

### Transaction Status

```typescript
type TransactionStatus = 
  | 'pending'       // Awaiting user confirmation
  | 'submitting'    // Submitting to network
  | 'submitted'     // Submitted, awaiting confirmation
  | 'confirming'    // Being confirmed
  | 'confirmed'     // Successfully confirmed
  | 'failed'        // Transaction failed
  | 'reverted';     // Transaction reverted
```

## Minimum States for Dashboard

### Dashboard State

```typescript
interface DashboardState {
  // User overview
  totalDeposits: string;
  totalYield: string;
  totalPrizesWon: string;
  
  // Active positions
  positions: UserPosition[];
  
  // Active subscriptions
  subscriptions: Subscription[];
  
  // Recent activity
  recentTransactions: Transaction[];
  recentPayouts: Payout[];
  
  // Available vaults
  vaults: Vault[];
  
  // Loading states
  loading: {
    positions: boolean;
    subscriptions: boolean;
    transactions: boolean;
    vaults: boolean;
  };
  
  // Error states
  errors: {
    positions?: string;
    subscriptions?: string;
    transactions?: string;
    vaults?: string;
  };
}
```

### Activity History State

```typescript
interface ActivityHistoryState {
  // All user transactions
  transactions: Transaction[];
  
  // All payouts
  payouts: Payout[];
  
  // Pagination
  page: number;
  pageSize: number;
  hasMore: boolean;
  
  // Filters
  filters: {
    type?: TransactionType;
    status?: TransactionStatus;
    dateFrom?: number;
    dateTo?: number;
  };
  
  // Loading
  loading: boolean;
  error?: string;
}
```

### Recovery Flow State

```typescript
interface RecoveryState {
  // Recovery status
  status: 'idle' | 'recovering' | 'recovered' | 'failed';
  
  // Recovered data
  recoveredPositions?: UserPosition[];
  recoveredSubscriptions?: Subscription[];
  
  // Error
  error?: string;
}
```

## Naming Conventions

- **Vault**: Prize pool (not "pool" to avoid confusion with liquidity pools)
- **Position**: User's deposit in a vault
- **Subscription**: Recurring deposit (also called "drip")
- **Payout**: Prize awarded to user
- **Transaction**: Any on-chain operation
- **Ticket**: Prize eligibility unit (proportional to deposit)

## Data Flow Diagram

```
┌─────────────┐
│   Frontend  │
│  (Local UI) │
└──────┬──────┘
       │
       ├─► Optimistic Updates
       │   - Transaction status
       │   - Form state
       │
       ├─► Soroban Reads
       │   ← Vault data
       │   ← User positions
       │   ← Transaction confirmations
       │
       └─► Backend API
           ← Historical data
           ← Subscription config
           ← Payout history
           ← Activity logs
```

## Implementation Notes

1. **Transaction Status as First-Class**: Transaction status should never be component-local. All transaction state must flow through the central Transaction entity.

2. **Optimistic Updates**: When a user initiates a transaction, immediately update local state with `status: 'pending'`, then update to `status: 'submitted'` once the transaction is sent to Stellar.

3. **Event-Driven Updates**: Use Soroban contract events to trigger state updates for vault totals, prize draws, and position changes.

4. **Error Boundaries**: Each state object should have an optional error field to gracefully handle failures without breaking the entire UI.

5. **Type Safety**: All entities should be strongly typed with TypeScript interfaces to prevent data shape mismatches between contract, backend, and frontend.
