import { PoolViewModel, AccountViewModel, TransactionAction } from '@/src/lib/types';

/**
 * Maps raw contract/API pool data to the UI-facing PoolViewModel.
 */
export const mapContractToPool = (raw: any): PoolViewModel => ({
  id: raw.id?.toString() || '',
  name: raw.name || 'Anonymous Pool',
  apy: Number(raw.interest_rate || 0) / 100, // Normalized from basis points
  tvl: Number(raw.total_deposits || 0),
  tokenSymbol: raw.token_symbol || 'XLM',
  participantCount: Number(raw.depositor_count || 0),
  isActive: !!raw.active,
  remainingTimeSeconds: Number(raw.time_left || 0),
});

/**
 * Maps raw account data to the AccountViewModel.
 */
export const mapContractToAccount = (raw: any, address: string): AccountViewModel => ({
  address,
  totalDeposited: Number(raw.total_deposited || raw.principal || 0),
  activePools: Array.isArray(raw.active_pools) ? raw.active_pools.map((p: any) => p.toString()) : [],
  pendingRewards: Number(raw.pending_rewards || raw.interest || 0),
});

/**
 * Normalizes transaction action responses for status tracking.
 */
export const mapApiToTransaction = (raw: any): TransactionAction => ({
  id: raw.id || '',
  status: (raw.status as TransactionAction['status']) || 'pending',
  txHash: raw.tx_hash,
});