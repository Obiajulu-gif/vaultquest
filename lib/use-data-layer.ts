import { useQuery } from '@tanstack/react-query';
import { API_ENDPOINTS } from '@/src/config/contracts';
import { mapContractToPool, mapContractToAccount, mapApiToTransaction } from '@/src/lib/adapters';
import { PoolViewModel, AccountViewModel, TransactionAction } from '@/src/lib/types';

/**
 * Fetches and normalizes all available prize pools.
 */
export function usePools() {
  return useQuery<PoolViewModel[], Error>({
    queryKey: ['pools'],
    queryFn: async () => {
      const response = await fetch(API_ENDPOINTS.POOLS);
      if (!response.ok) throw new Error('Failed to fetch pool discovery data');
      const data = await response.json();
      return data.map(mapContractToPool);
    },
    staleTime: 30000, // Consider data fresh for 30 seconds
  });
}

/**
 * Reads user state and balances from the indexed contract data.
 */
export function useAccountBalance(address?: string) {
  return useQuery<AccountViewModel | null, Error>({
    queryKey: ['account-balance', address],
    queryFn: async () => {
      if (!address) return null;
      const response = await fetch(API_ENDPOINTS.ACCOUNT_DATA(address));
      if (!response.ok) throw new Error('Failed to fetch user account state');
      const data = await response.json();
      return mapContractToAccount(data, address);
    },
    enabled: !!address,
  });
}

/**
 * Polls for transaction finality. 
 * Automatically stops polling when a terminal state (confirmed/failed) is reached.
 */
export function useTxStatus(actionId: string | null) {
  return useQuery<TransactionAction | null, Error>({
    queryKey: ['tx-status', actionId],
    queryFn: async () => {
      if (!actionId) return null;
      const response = await fetch(API_ENDPOINTS.TRANSACTIONS(actionId));
      if (!response.ok) throw new Error('Failed to fetch transaction status');
      const data = await response.json();
      return mapApiToTransaction(data);
    },
    enabled: !!actionId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data || data.status === 'confirmed' || data.status === 'failed' || data.status === 'cancelled') {
        return false;
      }
      return 3000; // Poll every 3 seconds
    },
    // Ensure we don't use stale status when a new transaction starts
    gcTime: 0,
    staleTime: 0,
  });
}