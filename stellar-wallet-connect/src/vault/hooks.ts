/**
 * Data hooks (adapters) that bind the {@link VaultContractClient} to React
 * state with consistent loading / stale / error handling for the pool detail
 * (#73), reward history (#75), and activity export (#92) views.
 *
 * Kept dependency-light (plain `useState`/`useEffect`) so the components and
 * hooks can be tested with the mock client and no data-fetching library.
 */

import { useCallback, useEffect, useState } from "react";
import type {
  PoolActionInput,
  PoolActionType,
  PoolSummary,
  RewardHistoryEntry,
  UserPosition,
  VaultContractClient,
} from "./contract/types";
import { useTxFlow, type TxFlowOptions, type TxFlowResult } from "./lib/txStateMachine";

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

// ---------------------------------------------------------------------------
// usePoolAction (#94) — shared transaction flow for all wallet actions.
// Wraps useTxFlow and binds it to a VaultContractClient so callers don't
// need to pass the client into run() each time.
// ---------------------------------------------------------------------------

export interface PoolActionFlow extends TxFlowResult {
  /** Convenience wrapper — no need to pass `client` on each call. */
  submit: (type: PoolActionType, input: PoolActionInput, options?: TxFlowOptions) => Promise<void>;
}

export function usePoolAction(client: VaultContractClient): PoolActionFlow {
  const flow = useTxFlow();
  const submit = useCallback(
    (type: PoolActionType, input: PoolActionInput, options?: TxFlowOptions) =>
      flow.run(client, type, input, options),
    [client, flow],
  );
  return { ...flow, submit };
}

// ---------------------------------------------------------------------------
// useActivityExport (#92) — download wallet activity from the backend REST API.
// Uses bare fetch() since the frontend has no shared REST client layer.
// ---------------------------------------------------------------------------

export type ExportFormat = "json" | "csv";

export interface ActivityExportOptions {
  wallet: string;
  format: ExportFormat;
  from?: string;
  to?: string;
  /** Base URL of the backend API. Defaults to "/api". */
  baseUrl?: string;
}

export type ExportState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; filename: string }
  | { status: "error"; message: string };

export interface ActivityExportResult {
  state: ExportState;
  trigger: (options: ActivityExportOptions) => Promise<void>;
  reset: () => void;
}

export function useActivityExport(): ActivityExportResult {
  const [state, setState] = useState<ExportState>({ status: "idle" });

  const reset = useCallback(() => setState({ status: "idle" }), []);

  const trigger = useCallback(async (options: ActivityExportOptions) => {
    const { wallet, format, from, to, baseUrl = "/api" } = options;
    setState({ status: "loading" });

    try {
      const params = new URLSearchParams({ wallet, format });
      if (from) params.set("from", from);
      if (to) params.set("to", to);

      const res = await fetch(`${baseUrl}/actions/export?${params.toString()}`);

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: { message?: string } };
        throw new Error(body.error?.message ?? `Export failed (${res.status})`);
      }

      if (format === "csv") {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const filename = `vaultquest-activity-${wallet.slice(0, 8)}.csv`;
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        setState({ status: "success", filename });
      } else {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const filename = `vaultquest-activity-${wallet.slice(0, 8)}.json`;
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        setState({ status: "success", filename });
      }
    } catch (err) {
      setState({ status: "error", message: err instanceof Error ? err.message : String(err) });
    }
  }, []);

  return { state, trigger, reset };
}
