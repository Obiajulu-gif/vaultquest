import { useQuery } from '@tanstack/react-query';
import { siteConfig } from '@/src/config/site';
import { TransactionAction } from '@/src/lib/types';

/**
 * Polls the backend action ledger for the status of a specific intent/transaction.
 * Useful for Soroban transactions that take time to propagate and index.
 * The query will automatically stop polling once the transaction reaches a terminal state.
 */
export function useTransactionStatus(actionId: string | null) {
  return useQuery<TransactionAction | null, Error>({
    queryKey: ['transaction-status', actionId],
    queryFn: async () => {
      if (!actionId) return null;
      const response = await fetch(`${siteConfig.API_BASE_URL}/actions/${actionId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch transaction status');
      }
      return response.json();
    },
    // Poll every 3 seconds while the transaction is not in a terminal state
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'confirmed' || status === 'failed' || status === 'cancelled') {
        return false; // Stop polling
      }
      return 3000; // Continue polling every 3 seconds
    },
    enabled: !!actionId, // Only enable the query if an actionId is provided
    staleTime: 0, // Always refetch immediately if enabled and not polling
  });
}