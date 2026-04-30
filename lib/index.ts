import { PoolViewModel, PrizeViewModel, AccountViewModel } from '@/src/lib/types';

/**
 * Normalizes raw Soroban/Backend data into a UI-friendly PoolViewModel.
 */
export const normalizePoolData = (raw: any): PoolViewModel => ({
  id: raw.id?.toString() || '',
  name: raw.name || 'Unknown Pool',
  apy: Number(raw.interest_rate || 0) / 100, // Assuming APY is stored as integer (e.g., 500 for 5%)
  tvl: Number(raw.total_deposits || 0), // Assuming normalization to standard units (e.g., XLM)
  tokenSymbol: raw.token_symbol || 'XLM', // Dynamic token symbol
  participantCount: Number(raw.depositor_count || 0),
  isActive: !!raw.active,
  remainingTimeSeconds: Number(raw.time_left || 0),
});

/**
 * Normalizes raw prize event data into a UI-friendly PrizeViewModel.
 */
export const normalizePrizeData = (raw: any): PrizeViewModel => ({
  drawId: raw.draw_id?.toString() || raw.id?.toString() || '',
  winnerAddress: raw.winner_address || raw.winner || '',
  amount: Number(raw.amount || 0),
  timestamp: raw.timestamp ? new Date(raw.timestamp * 1000).toISOString() : new Date().toISOString(), // Assuming timestamp is in seconds
  txHash: raw.tx_hash || '',
});

/**
 * Normalizes raw user account and position data into a UI-friendly AccountViewModel.
 */
export const normalizeAccountData = (raw: any, address: string): AccountViewModel => ({
  address,
  totalDeposited: Number(raw.total_deposited || raw.principal || 0),
  activePools: Array.isArray(raw.active_pools) ? raw.active_pools.map((p: any) => p.toString()) : [],
  pendingRewards: Number(raw.pending_rewards || raw.interest || 0),
});