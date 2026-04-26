import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { 
  DashboardData, 
  Pool, 
  UserPosition, 
  TransactionState, 
  LoadingState, 
  ErrorState as UIErrorState,
  WalletState 
} from '../lib/types';
import { 
  getDashboardData, 
  getPools, 
  getUserPositions, 
  getTransactions,
  formatApiError 
} from '../lib/api';
import { 
  validateWalletState, 
  validatePoolState, 
  validateUserPosition,
  validateCreatePool,
  validateDeposit,
  validateWithdraw,
  checkActionPrerequisites,
  detectStaleData,
  ActionPrerequisites,
  ValidationResult
} from '../lib/validation';
import { 
  errorManager, 
  handleAsyncError, 
  convertValidationErrors,
  ErrorState as ErrorManagerState
} from '../lib/error-handling';

export function useDripWave() {
  const { address, isConnected } = useAccount();
  
  // State management
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
  });
  
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [pools, setPools] = useState<Pool[]>([]);
  const [userPositions, setUserPositions] = useState<UserPosition[]>([]);
  const [transactions, setTransactions] = useState<TransactionState[]>([]);
  
  const [loading, setLoading] = useState<LoadingState>({
    pools: false,
    positions: false,
    transactions: false,
    dashboard: false,
  });
  
  const [errors, setErrors] = useState<UIErrorState>({});
  const [errorState, setErrorState] = useState<ErrorManagerState>({
    errors: [],
    hasErrors: false,
    hasWarnings: false,
    criticalError: null,
    recoveryActions: [],
  });
  
  // Data freshness tracking
  const [lastUpdated, setLastUpdated] = useState<Record<string, number>>({});

  // Update wallet state when wagmi state changes
  useEffect(() => {
    setWalletState({
      isConnected,
      address: address || undefined,
    });
    
    // Validate wallet state and update error manager
    const walletErrors = validateWalletState({
      isConnected,
      address: address || undefined,
    });
    
    walletErrors.forEach(error => {
      errorManager.addError(error);
    });
    
    // Clear wallet-related errors when wallet is properly connected
    if (isConnected && address) {
      errorManager.removeError('WALLET_NOT_CONNECTED');
      errorManager.removeError('WALLET_NO_ADDRESS');
    }
  }, [isConnected, address]);

  // Subscribe to error manager updates
  useEffect(() => {
    const unsubscribe = errorManager.subscribe((state) => {
      setErrorState(state);
    });
    
    return unsubscribe;
  }, []);

  // Fetch pools with error handling
  const fetchPools = useCallback(async () => {
    if (loading.pools) return;
    
    setLoading(prev => ({ ...prev, pools: true }));
    setErrors(prev => ({ ...prev, pools: undefined }));
    
    try {
      await handleAsyncError(async () => {
        const response = await getPools();
        if (response.success) {
          setPools(response.data);
          setLastUpdated(prev => ({ ...prev, pools: Date.now() }));
          errorManager.removeError('DATA_STALE');
        } else {
          throw new Error(response.error || 'Failed to fetch pools');
        }
      });
    } catch (error) {
      setErrors(prev => ({ ...prev, pools: formatApiError(error) }));
    } finally {
      setLoading(prev => ({ ...prev, pools: false }));
    }
  }, [loading.pools]);

  // Fetch user positions
  const fetchUserPositions = useCallback(async () => {
    if (!address || loading.positions) return;
    
    setLoading(prev => ({ ...prev, positions: true }));
    setErrors(prev => ({ ...prev, positions: undefined }));
    
    try {
      const response = await getUserPositions(address);
      if (response.success) {
        setUserPositions(response.data);
      } else {
        setErrors(prev => ({ ...prev, positions: response.error || 'Failed to fetch positions' }));
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, positions: formatApiError(error) }));
    } finally {
      setLoading(prev => ({ ...prev, positions: false }));
    }
  }, [address, loading.positions]);

  // Fetch transactions
  const fetchTransactions = useCallback(async () => {
    if (!address || loading.transactions) return;
    
    setLoading(prev => ({ ...prev, transactions: true }));
    setErrors(prev => ({ ...prev, transactions: undefined }));
    
    try {
      const response = await getTransactions(address);
      if (response.success) {
        setTransactions(response.data);
      } else {
        setErrors(prev => ({ ...prev, transactions: response.error || 'Failed to fetch transactions' }));
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, transactions: formatApiError(error) }));
    } finally {
      setLoading(prev => ({ ...prev, transactions: false }));
    }
  }, [address, loading.transactions]);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    if (!address || loading.dashboard) return;
    
    setLoading(prev => ({ ...prev, dashboard: true }));
    setErrors(prev => ({ ...prev, dashboard: undefined }));
    
    try {
      const response = await getDashboardData(address);
      if (response.success) {
        setDashboardData(response.data);
      } else {
        setErrors(prev => ({ ...prev, dashboard: response.error || 'Failed to fetch dashboard data' }));
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, dashboard: formatApiError(error) }));
    } finally {
      setLoading(prev => ({ ...prev, dashboard: false }));
    }
  }, [address, loading.dashboard]);

  // Initial data fetch when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      fetchPools();
      fetchUserPositions();
      fetchTransactions();
      fetchDashboardData();
    } else {
      // Reset data when wallet disconnects
      setDashboardData(null);
      setUserPositions([]);
      setTransactions([]);
    }
  }, [isConnected, address, fetchPools, fetchUserPositions, fetchTransactions, fetchDashboardData]);

  // Refresh functions
  const refresh = useCallback(() => {
    fetchPools();
    if (address) {
      fetchUserPositions();
      fetchTransactions();
      fetchDashboardData();
    }
  }, [fetchPools, fetchUserPositions, fetchTransactions, fetchDashboardData, address]);

  // Get active pools only
  const activePools = pools.filter(pool => pool.status === 'active');
  
  // Get user's total deposits
  const totalDeposits = userPositions.reduce(
    (total, position) => total + parseFloat(position.totalAmount), 
    0
  );
  
  // Get total interest earned
  const totalInterestEarned = userPositions.reduce(
    (total, position) => total + parseFloat(position.interestEarned), 
    0
  );

  // Get pending transactions
  const pendingTransactions = transactions.filter(
    tx => tx.status === 'pending' || tx.status === 'submitted'
  );

  // Validation methods
  const validateAction = useCallback((
    action: 'create_pool' | 'deposit' | 'withdraw',
    data: any,
    pool?: Pool,
    userBalance?: string
  ): ValidationResult => {
    switch (action) {
      case 'create_pool':
        return validateCreatePool(data, walletState);
      case 'deposit':
        if (!pool || !userBalance) {
          return {
            isValid: false,
            errors: ['Pool and user balance required for deposit validation'],
          };
        }
        return validateDeposit(data, walletState, pool, userBalance);
      case 'withdraw':
        if (!pool) {
          return {
            isValid: false,
            errors: ['Pool required for withdraw validation'],
          };
        }
        const userPosition = userPositions.find(pos => pos.poolId === pool.id);
        return validateWithdraw(data, walletState, pool, userPosition);
      default:
        return {
          isValid: false,
          errors: ['Unknown action type'],
        };
    }
  }, [walletState, userPositions]);

  const checkPrerequisites = useCallback((
    action: 'create_pool' | 'deposit' | 'withdraw',
    pool?: Pool,
    userBalance?: string
  ): ActionPrerequisites => {
    const userPosition = pool ? userPositions.find(pos => pos.poolId === pool.id) : undefined;
    return checkActionPrerequisites(action, walletState, pool, userPosition, userBalance);
  }, [walletState, userPositions]);

  // Data freshness checks
  const isDataStale = useCallback((dataType: 'pools' | 'positions' | 'transactions' | 'dashboard'): boolean => {
    const lastUpdate = lastUpdated[dataType];
    if (!lastUpdate) return true;
    return detectStaleData(lastUpdate);
  }, [lastUpdated]);

  const markDataFresh = useCallback((dataType: 'pools' | 'positions' | 'transactions' | 'dashboard') => {
    setLastUpdated(prev => ({ ...prev, [dataType]: Date.now() }));
    errorManager.removeError('DATA_STALE');
  }, []);

  // Error management
  const clearErrors = useCallback(() => {
    errorManager.clearErrors();
  }, []);

  const dismissError = useCallback((errorCode: string) => {
    errorManager.removeError(errorCode);
  }, []);

  return {
    // State
    walletState,
    dashboardData,
    pools,
    activePools,
    userPositions,
    transactions,
    pendingTransactions,
    loading,
    errors,
    errorState,
    
    // Computed values
    totalDeposits,
    totalInterestEarned,
    
    // Actions
    refresh,
    fetchPools,
    fetchUserPositions,
    fetchTransactions,
    fetchDashboardData,
    
    // Validation
    validateAction,
    checkPrerequisites,
    
    // Data freshness
    isDataStale,
    markDataFresh,
    
    // Error management
    clearErrors,
    dismissError,
  };
}
