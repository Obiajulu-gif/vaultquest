import { z } from 'zod';
import { Pool, UserPosition, TransactionState, WalletState } from './types';

// Validation schemas
export const CreatePoolSchema = z.object({
  name: z.string()
    .min(1, 'Pool name is required')
    .max(100, 'Pool name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Pool name can only contain letters, numbers, spaces, hyphens, and underscores'),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  tokenAddress: z.string()
    .min(1, 'Token is required')
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid token address'),
  duration: z.number()
    .min(1, 'Duration must be at least 1 day')
    .max(365, 'Duration cannot exceed 365 days'),
  interestRate: z.number()
    .min(0.01, 'Interest rate must be at least 0.01%')
    .max(100, 'Interest rate cannot exceed 100%'),
});

export const DepositSchema = z.object({
  poolId: z.string().min(1, 'Pool ID is required'),
  amount: z.string()
    .min(1, 'Amount is required')
    .regex(/^\d*\.?\d+$/, 'Amount must be a valid number')
    .refine((val) => parseFloat(val) > 0, 'Amount must be greater than 0')
    .refine((val) => parseFloat(val) >= 0.001, 'Minimum deposit is 0.001'),
});

export const WithdrawSchema = z.object({
  poolId: z.string().min(1, 'Pool ID is required'),
  amount: z.string()
    .min(1, 'Amount is required')
    .regex(/^\d*\.?\d+$/, 'Amount must be a valid number')
    .refine((val) => parseFloat(val) > 0, 'Amount must be greater than 0'),
});

// Validation result types
export type ValidationResult<T = any> = {
  isValid: boolean;
  errors: string[];
  data?: T;
};

export type ActionPrerequisites = {
  walletConnected: boolean;
  walletReady: boolean;
  networkSupported: boolean;
  sufficientBalance: boolean;
  poolActive: boolean;
  userPositionExists: boolean;
  prerequisitesMet: boolean;
};

export type ValidationError = {
  code: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  recoverable: boolean;
  action?: string;
};

// Wallet validation
export const validateWalletState = (walletState: WalletState): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!walletState.isConnected) {
    errors.push({
      code: 'WALLET_NOT_CONNECTED',
      message: 'Please connect your wallet to continue',
      severity: 'error',
      recoverable: true,
      action: 'connect_wallet',
    });
  }

  if (walletState.isConnected && !walletState.address) {
    errors.push({
      code: 'WALLET_NO_ADDRESS',
      message: 'Wallet connected but no address available',
      severity: 'error',
      recoverable: true,
      action: 'reconnect_wallet',
    });
  }

  if (walletState.network && !['stellar', 'testnet'].includes(walletState.network)) {
    errors.push({
      code: 'UNSUPPORTED_NETWORK',
      message: `Network ${walletState.network} is not supported`,
      severity: 'error',
      recoverable: true,
      action: 'switch_network',
    });
  }

  return errors;
};

// Pool validation
export const validatePoolState = (pool: Pool | null, action: 'deposit' | 'withdraw' | 'create'): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!pool) {
    errors.push({
      code: 'POOL_NOT_FOUND',
      message: 'Pool not found',
      severity: 'error',
      recoverable: false,
    });
    return errors;
  }

  if (pool.status !== 'active' && action !== 'withdraw') {
    errors.push({
      code: 'POOL_NOT_ACTIVE',
      message: `Pool is ${pool.status}. Only active pools accept new deposits.`,
      severity: 'error',
      recoverable: false,
    });
  }

  const now = Date.now();
  if (pool.endTime < now) {
    errors.push({
      code: 'POOL_EXPIRED',
      message: 'This pool has ended. No more deposits are accepted.',
      severity: 'error',
      recoverable: false,
    });
  }

  if (pool.startTime > now) {
    errors.push({
      code: 'POOL_NOT_STARTED',
      message: `This pool starts on ${new Date(pool.startTime).toLocaleDateString()}`,
      severity: 'warning',
      recoverable: true,
      action: 'wait_for_start',
    });
  }

  return errors;
};

// User position validation
export const validateUserPosition = (position: UserPosition | null, action: 'deposit' | 'withdraw'): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (action === 'withdraw' && !position) {
    errors.push({
      code: 'NO_POSITION',
      message: 'You have no position in this pool to withdraw from',
      severity: 'error',
      recoverable: false,
    });
  }

  if (position && action === 'withdraw') {
    const balance = parseFloat(position.totalAmount);
    if (balance <= 0) {
      errors.push({
        code: 'ZERO_BALANCE',
        message: 'Your balance is zero. Nothing to withdraw.',
        severity: 'error',
        recoverable: false,
      });
    }
  }

  return errors;
};

// Balance validation
export const validateBalance = (
  amount: string, 
  userBalance: string, 
  tokenSymbol: string
): ValidationError[] => {
  const errors: ValidationError[] = [];
  const amountNum = parseFloat(amount);
  const balanceNum = parseFloat(userBalance);

  if (amountNum > balanceNum) {
    errors.push({
      code: 'INSUFFICIENT_BALANCE',
      message: `Insufficient ${tokenSymbol} balance. You have ${balanceNum.toFixed(4)} ${tokenSymbol}`,
      severity: 'error',
      recoverable: true,
      action: 'reduce_amount',
    });
  }

  return errors;
};

// Transaction validation
export const validateTransactionState = (transaction: TransactionState | null): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!transaction) {
    errors.push({
      code: 'TRANSACTION_NOT_FOUND',
      message: 'Transaction not found',
      severity: 'error',
      recoverable: false,
    });
    return errors;
  }

  const staleThreshold = 5 * 60 * 1000; // 5 minutes
  const now = Date.now();
  if (transaction.status === 'pending' && (now - transaction.timestamp) > staleThreshold) {
    errors.push({
      code: 'TRANSACTION_STALE',
      message: 'Transaction is taking longer than expected. It may have failed.',
      severity: 'warning',
      recoverable: true,
      action: 'check_transaction',
    });
  }

  if (transaction.status === 'failed') {
    errors.push({
      code: 'TRANSACTION_FAILED',
      message: `Transaction failed: ${transaction.error || 'Unknown error'}`,
      severity: 'error',
      recoverable: true,
      action: 'retry_transaction',
    });
  }

  return errors;
};

// Action prerequisites check
export const checkActionPrerequisites = (
  action: 'create_pool' | 'deposit' | 'withdraw',
  walletState: WalletState,
  pool?: Pool,
  userPosition?: UserPosition,
  userBalance?: string
): ActionPrerequisites => {
  const walletConnected = walletState.isConnected && !!walletState.address;
  const walletReady = walletConnected && !walletState.isConnecting;
  const networkSupported = !walletState.network || ['stellar', 'testnet'].includes(walletState.network);
  
  let sufficientBalance = false;
  if (userBalance) {
    sufficientBalance = parseFloat(userBalance) > 0;
  }
  
  const poolActive = pool ? pool.status === 'active' : false;
  const userPositionExists = !!userPosition;
  
  const prerequisitesMet = walletReady && 
    networkSupported && 
    (action === 'create_pool' ? true : sufficientBalance) &&
    (action === 'withdraw' ? userPositionExists : true) &&
    (action !== 'deposit' || poolActive);

  return {
    walletConnected,
    walletReady,
    networkSupported,
    sufficientBalance,
    poolActive,
    userPositionExists,
    prerequisitesMet,
  };
};

// Comprehensive validation for actions
export const validateCreatePool = (data: unknown, walletState: WalletState): ValidationResult => {
  const errors: string[] = [];
  
  // Validate wallet
  const walletErrors = validateWalletState(walletState);
  errors.push(...walletErrors.map(e => e.message));
  
  // Validate form data
  const formResult = CreatePoolSchema.safeParse(data);
  if (!formResult.success) {
    errors.push(...formResult.error.errors.map(e => e.message));
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    data: formResult.success ? formResult.data : undefined,
  };
};

export const validateDeposit = (
  data: unknown, 
  walletState: WalletState, 
  pool: Pool | null, 
  userBalance: string
): ValidationResult => {
  const errors: string[] = [];
  
  // Validate wallet
  const walletErrors = validateWalletState(walletState);
  errors.push(...walletErrors.map(e => e.message));
  
  // Validate pool
  const poolErrors = validatePoolState(pool, 'deposit');
  errors.push(...poolErrors.map(e => e.message));
  
  // Validate form data
  const formResult = DepositSchema.safeParse(data);
  if (!formResult.success) {
    errors.push(...formResult.error.errors.map(e => e.message));
  } else {
    // Validate balance
    const balanceErrors = validateBalance(
      formResult.data.amount, 
      userBalance, 
      pool?.token.symbol || 'TOKEN'
    );
    errors.push(...balanceErrors.map(e => e.message));
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    data: formResult.success ? formResult.data : undefined,
  };
};

export const validateWithdraw = (
  data: unknown, 
  walletState: WalletState, 
  pool: Pool | null, 
  userPosition: UserPosition | null
): ValidationResult => {
  const errors: string[] = [];
  
  // Validate wallet
  const walletErrors = validateWalletState(walletState);
  errors.push(...walletErrors.map(e => e.message));
  
  // Validate pool
  const poolErrors = validatePoolState(pool, 'withdraw');
  errors.push(...poolErrors.map(e => e.message));
  
  // Validate user position
  const positionErrors = validateUserPosition(userPosition, 'withdraw');
  errors.push(...positionErrors.map(e => e.message));
  
  // Validate form data
  const formResult = WithdrawSchema.safeParse(data);
  if (!formResult.success) {
    errors.push(...formResult.error.errors.map(e => e.message));
  } else if (userPosition) {
    // Validate withdrawal amount against position balance
    const amount = parseFloat(formResult.data.amount);
    const positionBalance = parseFloat(userPosition.totalAmount);
    if (amount > positionBalance) {
      errors.push(`Amount exceeds your position balance of ${positionBalance.toFixed(4)} ${userPosition.tokenSymbol}`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    data: formResult.success ? formResult.data : undefined,
  };
};

// Error recovery suggestions
export const getRecoveryActions = (errors: ValidationError[]): string[] => {
  const actions = new Set<string>();
  
  errors.forEach(error => {
    if (error.action) {
      actions.add(error.action);
    }
    
    // Add default recovery actions based on error codes
    switch (error.code) {
      case 'WALLET_NOT_CONNECTED':
      case 'WALLET_NO_ADDRESS':
        actions.add('connect_wallet');
        break;
      case 'UNSUPPORTED_NETWORK':
        actions.add('switch_network');
        break;
      case 'INSUFFICIENT_BALANCE':
        actions.add('reduce_amount');
        actions.add('add_funds');
        break;
      case 'TRANSACTION_STALE':
      case 'TRANSACTION_FAILED':
        actions.add('retry_transaction');
        actions.add('check_transaction');
        break;
      case 'POOL_NOT_ACTIVE':
        actions.add('browse_active_pools');
        break;
    }
  });
  
  return Array.from(actions);
};

// Stale data detection
export const detectStaleData = (lastUpdated: number, thresholdMinutes: number = 2): boolean => {
  const threshold = thresholdMinutes * 60 * 1000;
  return (Date.now() - lastUpdated) > threshold;
};

// Network state validation
export const validateNetworkState = (walletState: WalletState): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (walletState.network === 'unknown') {
    errors.push({
      code: 'NETWORK_UNKNOWN',
      message: 'Unable to detect network. Please check your wallet connection.',
      severity: 'warning',
      recoverable: true,
      action: 'refresh_connection',
    });
  }
  
  if (walletState.isConnecting) {
    errors.push({
      code: 'WALLET_CONNECTING',
      message: 'Wallet is still connecting...',
      severity: 'info',
      recoverable: false,
    });
  }
  
  return errors;
};
