import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { 
  DashboardData, 
  Pool, 
  UserPosition, 
  TransactionState, 
  LoadingState, 
  ErrorState,
  WalletState 
} from '../lib/types';
import { 
  getDashboardData, 
  getPools, 
  getUserPositions, 
  getTransactions,
  formatApiError 
} from '../lib/api';

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
  
  const [errors, setErrors] = useState<ErrorState>({});

  // Update wallet state when wagmi state changes
  useEffect(() => {
    setWalletState({
      isConnected,
      address: address || undefined,
    });
  }, [isConnected, address]);

  // Fetch pools
  const fetchPools = useCallback(async () => {
    if (loading.pools) return;
    
    setLoading(prev => ({ ...prev, pools: true }));
    setErrors(prev => ({ ...prev, pools: undefined }));
    
    try {
      const response = await getPools();
      if (response.success) {
        setPools(response.data);
      } else {
        setErrors(prev => ({ ...prev, pools: response.error || 'Failed to fetch pools' }));
      }
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
    
    // Computed values
    totalDeposits,
    totalInterestEarned,
    
    // Actions
    refresh,
    fetchPools,
    fetchUserPositions,
    fetchTransactions,
    fetchDashboardData,
  };
}
