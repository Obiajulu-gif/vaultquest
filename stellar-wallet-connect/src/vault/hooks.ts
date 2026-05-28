/**
 * Data hooks (adapters) that bind the {@link VaultContractClient} to React
 * state with consistent loading / stale / error handling for the pool detail
 * (#73) and reward history (#75) views.
 *
 * Kept dependency-light (plain `useState`/`useEffect`) so the components and
 * hooks can be tested with the mock client and no data-fetching library.
 */

import { useCallback, useEffect, useState } from "react";
import type {
  PoolSummary,
  RewardHistoryEntry,
  UserPosition,
  VaultContractClient,
} from "./contract/types";

export interface AsyncResource<T> {
  data: T | null;
  loading: boolean;
  /** True while a background refetch runs and previous data is still shown. */
  stale: boolean;
  error: Error | null;
  refetch: () => void;
}

function useAsync<T>(loader: () => Promise<T>, deps: ReadonlyArray<unknown>): AsyncResource<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [stale, setStale] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    // Keep prior data on-screen during a refetch and flag it as stale.
    setStale((prev) => (data !== null ? true : prev));
    if (data === null) setLoading(true);

    loader()
      .then((result) => {
        if (cancelled) return;
        setData(result);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
        setStale(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  return { data, loading, stale, error, refetch };
}

export interface PoolDetailResource {
  pool: PoolSummary | null;
  position: UserPosition | null;
  loading: boolean;
  stale: boolean;
  error: Error | null;
  refetch: () => void;
}

export function usePoolDetail(
  client: VaultContractClient,
  poolId: string,
  walletAddress?: string | null,
): PoolDetailResource {
  const { data, loading, stale, error, refetch } = useAsync(async () => {
    const [pool, position] = await Promise.all([
      client.getPool(poolId),
      walletAddress ? client.getUserPosition(poolId) : Promise.resolve(null),
    ]);
    return { pool, position };
  }, [client, poolId, walletAddress]);

  return {
    pool: data?.pool ?? null,
    position: data?.position ?? null,
    loading,
    stale,
    error,
    refetch,
  };
}

export function useRewardHistory(
  client: VaultContractClient,
  walletAddress: string | null,
): AsyncResource<RewardHistoryEntry[]> {
  return useAsync(
    async () => (walletAddress ? client.listRewardHistory(walletAddress) : []),
    [client, walletAddress],
  );
}
