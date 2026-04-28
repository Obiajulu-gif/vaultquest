// Drip Wave Core Types - State Model
// This file defines the data contract between frontend, Soroban contracts, and backend services.
// See docs/STATE_MODEL.md for detailed documentation.

// ============================================================
// CORE ENTITIES
// ============================================================

/**
 * Vault (Prize Pool)
 * A prize-linked savings pool where users deposit assets to earn yield and win prizes.
 * Source: Soroban contract reads
 */
export interface Vault {
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
  prizeCadence: PrizeCadence;
  
  // Status
  status: VaultStatus;
}

/**
 * User Position
 * A user's deposit position in a specific vault.
 * Source: Soroban contract reads
 */
export interface UserPosition {
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
}

/**
 * Subscription (Drip)
 * A recurring deposit configuration for automated savings.
 * Source: Backend / Indexed data
 */
export interface Subscription {
  // Identification
  id: string;
  userAddress: string;
  vaultId: string;
  
  // Configuration
  amount: string;
  frequency: SubscriptionFrequency;
  nextExecution: number;
  
  // Status
  status: SubscriptionStatus;
  
  // Execution history
  lastExecutedAt?: number;
  totalExecuted: number;
}

/**
 * Payout (Prize)
 * A prize awarded to a user.
 * Source: Backend / Indexed data
 */
export interface Payout {
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
}

/**
 * Transaction
 * A first-class transaction status tracking object.
 * Source: Local optimistic state + Soroban confirmation
 */
export interface Transaction {
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
}

// ============================================================
// AGGREGATE STATE OBJECTS
// ============================================================

/**
 * Dashboard State
 * Minimum states needed for dashboard view
 */
export interface DashboardState {
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

/**
 * Activity History State
 * Minimum states needed for activity history view
 */
export interface ActivityHistoryState {
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

/**
 * Recovery Flow State
 * Minimum states needed for recovery flows
 */
export interface RecoveryState {
  // Recovery status
  status: 'idle' | 'recovering' | 'recovered' | 'failed';
  
  // Recovered data
  recoveredPositions?: UserPosition[];
  recoveredSubscriptions?: Subscription[];
  
  // Error
  error?: string;
}

// ============================================================
// WALLET STATE
// ============================================================

export interface WalletState {
  isConnected: boolean;
  address?: string;
  network?: string;
  balance?: string;
}

// ============================================================
// UI STATE TYPES
// ============================================================

export interface LoadingState {
  vaults: boolean;
  positions: boolean;
  subscriptions: boolean;
  transactions: boolean;
  dashboard: boolean;
}

export interface ErrorState {
  vaults?: string;
  positions?: string;
  subscriptions?: string;
  transactions?: string;
  dashboard?: string;
  wallet?: string;
}

// ============================================================
// API RESPONSE TYPES
// ============================================================

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
  timestamp: number;
}

// ============================================================
// EVENT TYPES
// ============================================================

/** Event types for real-time updates from Soroban contracts */
export interface VaultEvent {
  type: 'deposit' | 'withdraw' | 'vault_created' | 'vault_completed' | 'prize_awarded';
  vaultId: string;
  data: any;
  timestamp: number;
}

// ============================================================
// FORM TYPES
// ============================================================

export interface CreateVaultForm {
  name: string;
  description: string;
  tokenAddress: string;
  prizeCadence: PrizeCadence;
  apr: number; // as percentage (0-100)
}

export interface DepositForm {
  vaultId: string;
  amount: string;
}

export interface WithdrawForm {
  vaultId: string;
  amount: string;
}

export interface CreateSubscriptionForm {
  vaultId: string;
  amount: string;
  frequency: SubscriptionFrequency;
}

// ============================================================
// CONSTANTS
// ============================================================

export const SUPPORTED_TOKENS = {
  XLM: 'native',  // Stellar native token
  USDC: 'USDC',
  USDT: 'USDT',
} as const;

export const TRANSACTION_STATUS_LABELS: Record<TransactionStatus, string> = {
  pending: 'Pending',
  submitting: 'Submitting',
  submitted: 'Submitted',
  confirming: 'Confirming',
  confirmed: 'Confirmed',
  failed: 'Failed',
  reverted: 'Reverted',
};

export const VAULT_STATUS_LABELS: Record<VaultStatus, string> = {
  active: 'Active',
  paused: 'Paused',
  closed: 'Closed',
  completed: 'Completed',
};

export const POSITION_STATUS_LABELS: Record<PositionStatus, string> = {
  active: 'Active',
  withdrawing: 'Withdrawing',
  withdrawn: 'Withdrawn',
  ineligible: 'Ineligible',
};

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  active: 'Active',
  paused: 'Paused',
  cancelled: 'Cancelled',
  failed: 'Failed',
};

export const PAYOUT_STATUS_LABELS: Record<PayoutStatus, string> = {
  unclaimed: 'Unclaimed',
  claiming: 'Claiming',
  claimed: 'Claimed',
  expired: 'Expired',
};

// ============================================================
// TYPE DEFINITIONS
// ============================================================

/** Vault status */
export type VaultStatus = 
  | 'active'        // Accepting deposits
  | 'paused'        // Temporarily paused
  | 'closed'        // No longer accepting deposits
  | 'completed';    // Prize pool exhausted

/** Position status */
export type PositionStatus = 
  | 'active'        // Currently earning yield
  | 'withdrawing'   // Withdrawal in progress
  | 'withdrawn'     // Fully withdrawn
  | 'ineligible';   // Not eligible for prizes

/** Subscription frequency */
export type SubscriptionFrequency = 
  | 'daily' 
  | 'weekly' 
  | 'monthly';

/** Subscription status */
export type SubscriptionStatus = 
  | 'active'        // Scheduled and running
  | 'paused'        // Temporarily paused by user
  | 'cancelled'     // Cancelled by user
  | 'failed';       // Execution failed

/** Prize draw cadence */
export type PrizeCadence = 
  | 'daily' 
  | 'weekly' 
  | 'monthly';

/** Payout status */
export type PayoutStatus = 
  | 'unclaimed'     // Awaiting claim
  | 'claiming'      // Claim transaction pending
  | 'claimed'       // Successfully claimed
  | 'expired';      // Claim window expired

/** Transaction type */
export type TransactionType = 
  | 'deposit'       // Deposit to vault
  | 'withdraw'      // Withdraw from vault
  | 'claim'         // Claim prize
  | 'subscribe'     // Create subscription
  | 'unsubscribe';  // Cancel subscription

/** Transaction status */
export type TransactionStatus = 
  | 'pending'       // Awaiting user confirmation
  | 'submitting'    // Submitting to network
  | 'submitted'     // Submitted, awaiting confirmation
  | 'confirming'    // Being confirmed
  | 'confirmed'     // Successfully confirmed
  | 'failed'        // Transaction failed
  | 'reverted';     // Transaction reverted
