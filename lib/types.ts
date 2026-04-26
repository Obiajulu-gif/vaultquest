// Drip Wave Core Types
export interface Pool {
  id: string;
  name: string;
  description?: string;
  token: {
    address: string;
    symbol: string;
    decimals: number;
    name: string;
  };
  totalDeposits: string;
  participantCount: number;
  interestRate: number; // APY as percentage
  duration: number; // Duration in seconds
  startTime: number;
  endTime: number;
  status: PoolStatus;
  winner?: {
    address: string;
    amount: string;
    timestamp: number;
  };
}

export type PoolStatus = 'active' | 'completed' | 'cancelled';

export interface UserPosition {
  poolId: string;
  poolName: string;
  tokenSymbol: string;
  principalAmount: string;
  interestEarned: string;
  totalAmount: string;
  depositTimestamp: number;
  isEligibleForPrize: boolean;
  hasClaimed: boolean;
}

export interface TransactionState {
  id: string;
  type: TransactionType;
  status: TransactionStatus;
  poolId?: string;
  amount?: string;
  txHash?: string;
  error?: string;
  timestamp: number;
}

export type TransactionType = 'deposit' | 'withdraw' | 'claim' | 'create_pool';

export type TransactionStatus = 'pending' | 'submitted' | 'confirmed' | 'failed' | 'reverted';

export interface DashboardData {
  totalDeposits: string;
  totalInterestEarned: string;
  activePositions: UserPosition[];
  recentTransactions: TransactionState[];
  availablePools: Pool[];
}

export interface WalletState {
  isConnected: boolean;
  address?: string;
  network?: string;
  balance?: string;
}

// UI State Types
export interface LoadingState {
  pools: boolean;
  positions: boolean;
  transactions: boolean;
  dashboard: boolean;
}

export interface ErrorState {
  pools?: string;
  positions?: string;
  transactions?: string;
  dashboard?: string;
  wallet?: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
  timestamp: number;
}

// Event Types for real-time updates
export interface PoolEvent {
  type: 'deposit' | 'withdraw' | 'pool_created' | 'pool_completed' | 'winner_selected';
  poolId: string;
  data: any;
  timestamp: number;
}

// Form Types
export interface CreatePoolForm {
  name: string;
  description: string;
  tokenAddress: string;
  duration: number; // in seconds
  interestRate: number; // as percentage (0-100)
}

export interface DepositForm {
  poolId: string;
  amount: string;
}

export interface WithdrawForm {
  poolId: string;
  amount: string;
}

// Constants
export const SUPPORTED_TOKENS = {
  STELLAR: '0x0000000000000000000000000000000000000000',
  USDC: '0xA0b86a33E6441893F6f7AD06c28f5BAA7D4b0D16',
  USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
} as const;

export const TRANSACTION_STATUS_LABELS: Record<TransactionStatus, string> = {
  pending: 'Pending',
  submitted: 'Submitted',
  confirmed: 'Confirmed',
  failed: 'Failed',
  reverted: 'Reverted',
};

export const POOL_STATUS_LABELS: Record<PoolStatus, string> = {
  active: 'Active',
  completed: 'Completed',
  cancelled: 'Cancelled',
};
