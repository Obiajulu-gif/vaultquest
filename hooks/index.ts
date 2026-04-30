import { useQuery } from '@tanstack/react-query';
import { siteConfig } from '@/src/config/site';
import { normalizePoolData, normalizePrizeData, normalizeAccountData } from '@/src/lib/adapters';
import { PoolViewModel, PrizeViewModel, AccountViewModel } from '@/src/lib/types';

/**
 * Hook to fetch all available prize pools.
 */
export function usePools() {
  return useQuery<PoolViewModel[]>({
    queryKey: ['pools'],
    queryFn: async () => {
      // In a real scenario, this would call the backend indexer or Soroban RPC
      // For now, we simulate fetching from a backend API.
      const response = await fetch(`${siteConfig.API_BASE_URL}/pools`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch pools');
      }
      const data = await response.json();
      return data.map(normalizePoolData);
    },
    staleTime: siteConfig.REFETCH_INTERVAL, // Data considered fresh for this duration
    refetchInterval: siteConfig.REFETCH_INTERVAL, // Poll for new data
  });
}

/**
 * Hook to fetch prize history and views.
 */
export function usePrizeData(poolId?: string) {
  return useQuery<PrizeViewModel[]>({
    queryKey: ['prizes', poolId],
    queryFn: async () => {
      const url = poolId
        ? `${siteConfig.API_BASE_URL}/prizes?poolId=${poolId}`
        : `${siteConfig.API_BASE_URL}/prizes`;
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch prizes');
      }
      const data = await response.json();
      return data.map(normalizePrizeData);
    },
    enabled: true, // Always enabled, or conditionally based on poolId if desired
    staleTime: siteConfig.REFETCH_INTERVAL,
    refetchInterval: siteConfig.REFETCH_INTERVAL,
  });
}

/**
 * Hook to fetch user-specific account positions and rewards.
 */
export function useUserAccount(address?: string) {
  return useQuery<AccountViewModel | null>({
    queryKey: ['account', address],
    queryFn: async () => {
      if (!address) return null;
      // This might aggregate data from both the indexer and direct contract calls
      const response = await fetch(`${siteConfig.API_BASE_URL}/accounts/${address}`); // Changed endpoint for clarity
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch account data');
      }
      const data = await response.json();
      return normalizeAccountData(data, address);
    },
    enabled: !!address, // Only fetch if address is provided
    staleTime: siteConfig.REFETCH_INTERVAL,
    refetchInterval: siteConfig.REFETCH_INTERVAL,
  });
}