import { ValidationError, ValidationResult } from './validation';

// Error types
export type AppError = {
  code: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  recoverable: boolean;
  action?: string;
  timestamp: number;
  context?: Record<string, any>;
  retryable: boolean;
  retryCount?: number;
  maxRetries?: number;
};

export type ErrorState = {
  errors: AppError[];
  hasErrors: boolean;
  hasWarnings: boolean;
  criticalError: AppError | null;
  recoveryActions: string[];
};

export type RecoveryAction = {
  id: string;
  label: string;
  description: string;
  action: () => Promise<void> | void;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'destructive';
};

// Error codes and messages
export const ERROR_CODES = {
  // Wallet errors
  WALLET_NOT_CONNECTED: 'WALLET_NOT_CONNECTED',
  WALLET_NO_ADDRESS: 'WALLET_NO_ADDRESS',
  WALLET_REJECTED: 'WALLET_REJECTED',
  WALLET_BUSY: 'WALLET_BUSY',
  WALLET_TIMEOUT: 'WALLET_TIMEOUT',
  
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  NETWORK_TIMEOUT: 'NETWORK_TIMEOUT',
  UNSUPPORTED_NETWORK: 'UNSUPPORTED_NETWORK',
  NETWORK_UNKNOWN: 'NETWORK_UNKNOWN',
  
  // Transaction errors
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',
  TRANSACTION_STALE: 'TRANSACTION_STALE',
  TRANSACTION_TIMEOUT: 'TRANSACTION_TIMEOUT',
  TRANSACTION_REJECTED: 'TRANSACTION_REJECTED',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  GAS_LIMIT_EXCEEDED: 'GAS_LIMIT_EXCEEDED',
  
  // Pool errors
  POOL_NOT_FOUND: 'POOL_NOT_FOUND',
  POOL_NOT_ACTIVE: 'POOL_NOT_STARTED',
  POOL_EXPIRED: 'POOL_EXPIRED',
  POOL_FULL: 'POOL_FULL',
  
  // Validation errors
  INVALID_AMOUNT: 'INVALID_AMOUNT',
  INVALID_ADDRESS: 'INVALID_ADDRESS',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  AMOUNT_TOO_SMALL: 'AMOUNT_TOO_SMALL',
  AMOUNT_TOO_LARGE: 'AMOUNT_TOO_LARGE',
  
  // Data errors
  DATA_STALE: 'DATA_STALE',
  DATA_CORRUPTED: 'DATA_CORRUPTED',
  DATA_MISSING: 'DATA_MISSING',
  
  // System errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  MAINTENANCE_MODE: 'MAINTENANCE_MODE',
} as const;

// Error message templates
export const getErrorMessage = (code: string, context?: Record<string, any>): string => {
  const messages: Record<string, string> = {
    [ERROR_CODES.WALLET_NOT_CONNECTED]: 'Please connect your wallet to continue',
    [ERROR_CODES.WALLET_NO_ADDRESS]: 'Wallet connected but no address available',
    [ERROR_CODES.WALLET_REJECTED]: 'Transaction was rejected by wallet',
    [ERROR_CODES.WALLET_BUSY]: 'Wallet is busy with another transaction',
    [ERROR_CODES.WALLET_TIMEOUT]: 'Wallet connection timed out',
    
    [ERROR_CODES.NETWORK_ERROR]: 'Network connection error. Please check your internet',
    [ERROR_CODES.NETWORK_TIMEOUT]: 'Network request timed out',
    [ERROR_CODES.UNSUPPORTED_NETWORK]: `Network ${context?.network || 'unknown'} is not supported`,
    [ERROR_CODES.NETWORK_UNKNOWN]: 'Unable to detect network. Please refresh',
    
    [ERROR_CODES.TRANSACTION_FAILED]: `Transaction failed: ${context?.error || 'Unknown error'}`,
    [ERROR_CODES.TRANSACTION_STALE]: 'Transaction is taking longer than expected',
    [ERROR_CODES.TRANSACTION_TIMEOUT]: 'Transaction timed out',
    [ERROR_CODES.TRANSACTION_REJECTED]: 'Transaction was rejected',
    [ERROR_CODES.INSUFFICIENT_FUNDS]: 'Insufficient funds for this transaction',
    [ERROR_CODES.GAS_LIMIT_EXCEEDED]: 'Gas limit exceeded',
    
    [ERROR_CODES.POOL_NOT_FOUND]: 'Pool not found',
    [ERROR_CODES.POOL_NOT_ACTIVE]: 'Pool is not currently active',
    [ERROR_CODES.POOL_EXPIRED]: 'This pool has ended',
    [ERROR_CODES.POOL_FULL]: 'Pool has reached maximum capacity',
    
    [ERROR_CODES.INVALID_AMOUNT]: 'Invalid amount specified',
    [ERROR_CODES.INVALID_ADDRESS]: 'Invalid address specified',
    [ERROR_CODES.INSUFFICIENT_BALANCE]: `Insufficient balance. Available: ${context?.available || '0'}`,
    [ERROR_CODES.AMOUNT_TOO_SMALL]: `Amount too small. Minimum: ${context?.minimum || '0'}`,
    [ERROR_CODES.AMOUNT_TOO_LARGE]: `Amount too large. Maximum: ${context?.maximum || '∞'}`,
    
    [ERROR_CODES.DATA_STALE]: 'Data is stale. Please refresh',
    [ERROR_CODES.DATA_CORRUPTED]: 'Data appears to be corrupted',
    [ERROR_CODES.DATA_MISSING]: 'Required data is missing',
    
    [ERROR_CODES.UNKNOWN_ERROR]: 'An unknown error occurred',
    [ERROR_CODES.INTERNAL_ERROR]: 'Internal server error',
    [ERROR_CODES.RATE_LIMITED]: 'Too many requests. Please try again later',
    [ERROR_CODES.MAINTENANCE_MODE]: 'System is under maintenance',
  };
  
  return messages[code] || messages[ERROR_CODES.UNKNOWN_ERROR];
};

// Error severity determination
export const getErrorSeverity = (code: string): 'error' | 'warning' | 'info' => {
  const severityMap: Record<string, 'error' | 'warning' | 'info'> = {
    [ERROR_CODES.WALLET_NOT_CONNECTED]: 'error',
    [ERROR_CODES.WALLET_NO_ADDRESS]: 'error',
    [ERROR_CODES.WALLET_REJECTED]: 'error',
    [ERROR_CODES.WALLET_BUSY]: 'warning',
    [ERROR_CODES.WALLET_TIMEOUT]: 'error',
    
    [ERROR_CODES.NETWORK_ERROR]: 'error',
    [ERROR_CODES.NETWORK_TIMEOUT]: 'warning',
    [ERROR_CODES.UNSUPPORTED_NETWORK]: 'error',
    [ERROR_CODES.NETWORK_UNKNOWN]: 'warning',
    
    [ERROR_CODES.TRANSACTION_FAILED]: 'error',
    [ERROR_CODES.TRANSACTION_STALE]: 'warning',
    [ERROR_CODES.TRANSACTION_TIMEOUT]: 'error',
    [ERROR_CODES.TRANSACTION_REJECTED]: 'error',
    [ERROR_CODES.INSUFFICIENT_FUNDS]: 'error',
    [ERROR_CODES.GAS_LIMIT_EXCEEDED]: 'error',
    
    [ERROR_CODES.POOL_NOT_FOUND]: 'error',
    [ERROR_CODES.POOL_NOT_ACTIVE]: 'warning',
    [ERROR_CODES.POOL_EXPIRED]: 'error',
    [ERROR_CODES.POOL_FULL]: 'warning',
    
    [ERROR_CODES.INVALID_AMOUNT]: 'error',
    [ERROR_CODES.INVALID_ADDRESS]: 'error',
    [ERROR_CODES.INSUFFICIENT_BALANCE]: 'error',
    [ERROR_CODES.AMOUNT_TOO_SMALL]: 'error',
    [ERROR_CODES.AMOUNT_TOO_LARGE]: 'warning',
    
    [ERROR_CODES.DATA_STALE]: 'warning',
    [ERROR_CODES.DATA_CORRUPTED]: 'error',
    [ERROR_CODES.DATA_MISSING]: 'error',
    
    [ERROR_CODES.UNKNOWN_ERROR]: 'error',
    [ERROR_CODES.INTERNAL_ERROR]: 'error',
    [ERROR_CODES.RATE_LIMITED]: 'warning',
    [ERROR_CODES.MAINTENANCE_MODE]: 'info',
  };
  
  return severityMap[code] || 'error';
};

// Error recoverability determination
export const isRecoverable = (code: string): boolean => {
  const recoverableCodes = new Set([
    ERROR_CODES.WALLET_NOT_CONNECTED,
    ERROR_CODES.WALLET_NO_ADDRESS,
    ERROR_CODES.WALLET_BUSY,
    ERROR_CODES.NETWORK_TIMEOUT,
    ERROR_CODES.NETWORK_UNKNOWN,
    ERROR_CODES.TRANSACTION_STALE,
    ERROR_CODES.TRANSACTION_TIMEOUT,
    ERROR_CODES.POOL_NOT_ACTIVE,
    ERROR_CODES.AMOUNT_TOO_LARGE,
    ERROR_CODES.DATA_STALE,
    ERROR_CODES.RATE_LIMITED,
  ]);
  
  return recoverableCodes.has(code);
};

// Error retryability determination
export const isRetryable = (code: string): boolean => {
  const retryableCodes = new Set([
    ERROR_CODES.NETWORK_TIMEOUT,
    ERROR_CODES.TRANSACTION_TIMEOUT,
    ERROR_CODES.TRANSACTION_STALE,
    ERROR_CODES.DATA_STALE,
    ERROR_CODES.RATE_LIMITED,
    ERROR_CODES.WALLET_TIMEOUT,
  ]);
  
  return retryableCodes.has(code);
};

// Create error object
export const createError = (
  code: string, 
  context?: Record<string, any>,
  customMessage?: string
): AppError => {
  return {
    code,
    message: customMessage || getErrorMessage(code, context),
    severity: getErrorSeverity(code),
    recoverable: isRecoverable(code),
    action: getDefaultAction(code),
    timestamp: Date.now(),
    context,
    retryable: isRetryable(code),
    retryCount: 0,
    maxRetries: getMaxRetries(code),
  };
};

// Default recovery actions
export const getDefaultAction = (code: string): string | undefined => {
  const actionMap: Record<string, string> = {
    [ERROR_CODES.WALLET_NOT_CONNECTED]: 'connect_wallet',
    [ERROR_CODES.WALLET_NO_ADDRESS]: 'reconnect_wallet',
    [ERROR_CODES.WALLET_BUSY]: 'wait_and_retry',
    [ERROR_CODES.WALLET_TIMEOUT]: 'reconnect_wallet',
    
    [ERROR_CODES.NETWORK_TIMEOUT]: 'retry_request',
    [ERROR_CODES.NETWORK_UNKNOWN]: 'refresh_connection',
    [ERROR_CODES.UNSUPPORTED_NETWORK]: 'switch_network',
    
    [ERROR_CODES.TRANSACTION_STALE]: 'check_transaction',
    [ERROR_CODES.TRANSACTION_TIMEOUT]: 'retry_transaction',
    [ERROR_CODES.TRANSACTION_REJECTED]: 'adjust_transaction',
    
    [ERROR_CODES.INSUFFICIENT_BALANCE]: 'add_funds',
    [ERROR_CODES.AMOUNT_TOO_LARGE]: 'reduce_amount',
    
    [ERROR_CODES.DATA_STALE]: 'refresh_data',
    [ERROR_CODES.RATE_LIMITED]: 'wait_and_retry',
  };
  
  return actionMap[code];
};

// Maximum retry attempts
export const getMaxRetries = (code: string): number => {
  const retryMap: Record<string, number> = {
    [ERROR_CODES.NETWORK_TIMEOUT]: 3,
    [ERROR_CODES.TRANSACTION_TIMEOUT]: 2,
    [ERROR_CODES.TRANSACTION_STALE]: 3,
    [ERROR_CODES.DATA_STALE]: 2,
    [ERROR_CODES.RATE_LIMITED]: 2,
    [ERROR_CODES.WALLET_TIMEOUT]: 1,
  };
  
  return retryMap[code] || 0;
};

// Error state management
export class ErrorManager {
  private errors: AppError[] = [];
  private listeners: ((state: ErrorState) => void)[] = [];

  addError(error: AppError | string, context?: Record<string, any>): void {
    const errorObj = typeof error === 'string' 
      ? createError(error, context)
      : error;
    
    // Check for duplicate errors
    const existingError = this.errors.find(e => 
      e.code === errorObj.code && 
      e.context?.poolId === errorObj.context?.poolId
    );
    
    if (existingError) {
      // Update retry count for existing errors
      existingError.retryCount = (existingError.retryCount || 0) + 1;
    } else {
      this.errors.push(errorObj);
    }
    
    this.notifyListeners();
  }

  removeError(code: string, context?: Record<string, any>): void {
    this.errors = this.errors.filter(error => {
      if (context?.poolId) {
        return !(error.code === code && error.context?.poolId === context.poolId);
      }
      return error.code !== code;
    });
    this.notifyListeners();
  }

  clearErrors(): void {
    this.errors = [];
    this.notifyListeners();
  }

  getErrorState(): ErrorState {
    const criticalError = this.errors.find(e => e.severity === 'error' && !e.recoverable);
    const recoveryActions = Array.from(new Set(
      this.errors
        .filter(e => e.action)
        .map(e => e.action!)
    ));

    return {
      errors: [...this.errors],
      hasErrors: this.errors.some(e => e.severity === 'error'),
      hasWarnings: this.errors.some(e => e.severity === 'warning'),
      criticalError: criticalError || null,
      recoveryActions,
    };
  }

  subscribe(listener: (state: ErrorState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    const state = this.getErrorState();
    this.listeners.forEach(listener => listener(state));
  }

  // Retry logic
  canRetry(error: AppError): boolean {
    return error.retryable && 
           (error.retryCount || 0) < (error.maxRetries || 0);
  }

  incrementRetryCount(error: AppError): void {
    error.retryCount = (error.retryCount || 0) + 1;
    this.notifyListeners();
  }
}

// Global error manager instance
export const errorManager = new ErrorManager();

// Error boundary component helper
export const handleAsyncError = async (
  operation: () => Promise<any>,
  errorContext?: Record<string, any>
): Promise<any> => {
  try {
    return await operation();
  } catch (error) {
    console.error('Async operation failed:', error);
    
    let errorCode = ERROR_CODES.UNKNOWN_ERROR;
    let context = errorContext;

    if (error instanceof Error) {
      // Parse common error patterns
      if (error.message.includes('network') || error.message.includes('fetch')) {
        errorCode = ERROR_CODES.NETWORK_ERROR;
      } else if (error.message.includes('timeout')) {
        errorCode = ERROR_CODES.NETWORK_TIMEOUT;
      } else if (error.message.includes('rejected') || error.message.includes('denied')) {
        errorCode = ERROR_CODES.TRANSACTION_REJECTED;
      } else if (error.message.includes('insufficient')) {
        errorCode = ERROR_CODES.INSUFFICIENT_FUNDS;
      }
      
      context = { ...context, originalError: error.message };
    }

    errorManager.addError(errorCode, context);
    throw error;
  }
};

// Validation error conversion
export const convertValidationErrors = (validationResult: ValidationResult): AppError[] => {
  return validationResult.errors.map(message => 
    createError(ERROR_CODES.INVALID_AMOUNT, { message })
  );
};

// Recovery action generator
export const generateRecoveryActions = (errors: AppError[]): RecoveryAction[] => {
  const actions: RecoveryAction[] = [];
  const actionSet = new Set<string>();

  errors.forEach(error => {
    if (error.action && !actionSet.has(error.action)) {
      actionSet.add(error.action);
      
      switch (error.action) {
        case 'connect_wallet':
          actions.push({
            id: 'connect_wallet',
            label: 'Connect Wallet',
            description: 'Connect your wallet to continue',
            action: () => {
              // Trigger wallet connection
              window.dispatchEvent(new CustomEvent('connect_wallet'));
            },
            variant: 'primary',
          });
          break;

        case 'reconnect_wallet':
          actions.push({
            id: 'reconnect_wallet',
            label: 'Reconnect Wallet',
            description: 'Reconnect your wallet',
            action: () => {
              window.dispatchEvent(new CustomEvent('reconnect_wallet'));
            },
            variant: 'primary',
          });
          break;

        case 'switch_network':
          actions.push({
            id: 'switch_network',
            label: 'Switch Network',
            description: 'Switch to a supported network',
            action: () => {
              window.dispatchEvent(new CustomEvent('switch_network'));
            },
            variant: 'secondary',
          });
          break;

        case 'refresh_data':
          actions.push({
            id: 'refresh_data',
            label: 'Refresh',
            description: 'Refresh the data',
            action: () => {
              window.dispatchEvent(new CustomEvent('refresh_data'));
            },
            variant: 'secondary',
          });
          break;

        case 'retry_transaction':
          actions.push({
            id: 'retry_transaction',
            label: 'Retry Transaction',
            description: 'Retry the failed transaction',
            action: () => {
              window.dispatchEvent(new CustomEvent('retry_transaction', {
                detail: error.context,
              }));
            },
            variant: 'primary',
          });
          break;

        case 'reduce_amount':
          actions.push({
            id: 'reduce_amount',
            label: 'Reduce Amount',
            description: 'Enter a smaller amount',
            action: () => {
              window.dispatchEvent(new CustomEvent('reduce_amount'));
            },
            variant: 'secondary',
          });
          break;

        case 'add_funds':
          actions.push({
            id: 'add_funds',
            label: 'Add Funds',
            description: 'Add more funds to your wallet',
            action: () => {
              window.dispatchEvent(new CustomEvent('add_funds'));
            },
            variant: 'secondary',
          });
          break;
      }
    }
  });

  return actions;
};
