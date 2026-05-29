/**
 * Shared transaction state machine for wallet-driven actions (#94).
 *
 * All wallet flows (join, drip, claim, withdraw, create) pass through the same
 * lifecycle. This hook owns that lifecycle so each flow gets consistent state
 * labels, transitions, and recovery options without duplicating logic.
 *
 * The `stage` value is intentionally typed as `TimelineStage` so callers can
 * pass it straight to `<TransactionTimeline>` with no mapping.
 */

import { useCallback, useState } from "react";
import type { TimelineStage } from "../../components/TransactionTimeline";
import type { PoolActionInput, PoolActionType, VaultContractClient } from "../contract/types";

export type TxFlowState =
  | { stage: "idle" }
  | { stage: "preparing" }
  | { stage: "awaiting-signature" }
  | { stage: "submitting"; txHash?: string }
  | { stage: "confirming"; txHash: string }
  | { stage: "indexing"; txHash: string }
  | { stage: "success"; txHash: string }
  | { stage: "failed"; failedAt: Exclude<TimelineStage, "success" | "failed">; message: string };

export interface TxFlowResult {
  /** Current flow state — pass `state.stage` directly to `<TransactionTimeline stage={...}>`. */
  state: TxFlowState;
  /** True while any non-idle, non-terminal stage is active. */
  busy: boolean;
  /** Execute a wallet action, driving the machine through its stages. */
  run: (
    client: VaultContractClient,
    type: PoolActionType,
    input: PoolActionInput,
    options?: TxFlowOptions,
  ) => Promise<void>;
  /** Reset back to idle so the same hook can run another action. */
  reset: () => void;
}

export interface TxFlowOptions {
  /**
   * Called when the transaction reaches the indexing stage with a confirmed
   * tx hash. Use this to trigger a data refetch in the parent.
   */
  onConfirmed?: (txHash: string) => void;
  /**
   * Milliseconds to wait in the `indexing` stage before advancing to
   * `success`. Defaults to 2 000 ms — enough for the backend reconciler to
   * pick up the event in most environments.
   */
  indexingDelayMs?: number;
}

const STAGE_ORDER: Record<TimelineStage, number> = {
  preparing: 0,
  "awaiting-signature": 1,
  submitting: 2,
  confirming: 3,
  indexing: 4,
  success: 5,
  failed: -1,
};

function isTerminal(stage: TimelineStage): boolean {
  return stage === "success" || stage === "failed";
}

function mapError(err: unknown): { failedAt: Exclude<TimelineStage, "success" | "failed">; message: string } {
  const message = err instanceof Error ? err.message : String(err);
  // Map known ContractInterfaceError kinds to the stage where they occur.
  const kind = (err as { kind?: string }).kind ?? "";
  if (kind === "wallet_disconnected" || kind === "signature_rejected") {
    return { failedAt: "awaiting-signature", message };
  }
  if (kind === "rpc_failure" || kind === "contract_error") {
    return { failedAt: "submitting", message };
  }
  return { failedAt: "confirming", message };
}

export function useTxFlow(): TxFlowResult {
  const [state, setState] = useState<TxFlowState>({ stage: "idle" });

  const busy =
    state.stage !== "idle" && !isTerminal(state.stage as TimelineStage);

  const reset = useCallback(() => setState({ stage: "idle" }), []);

  const run = useCallback(
    async (
      client: VaultContractClient,
      type: PoolActionType,
      input: PoolActionInput,
      options: TxFlowOptions = {},
    ) => {
      const { onConfirmed, indexingDelayMs = 2_000 } = options;

      // Prevent double-submission.
      setState((prev) => {
        if (prev.stage !== "idle" && !isTerminal(STAGE_ORDER[prev.stage as TimelineStage] >= 0 ? prev.stage as TimelineStage : "failed")) {
          return prev;
        }
        return { stage: "preparing" };
      });

      try {
        setState({ stage: "awaiting-signature" });
        const result = await client.submitAction(type, input);

        setState({ stage: "submitting", txHash: result.txHash });

        setState({ stage: "confirming", txHash: result.txHash });
        onConfirmed?.(result.txHash);

        setState({ stage: "indexing", txHash: result.txHash });
        await new Promise<void>((resolve) => setTimeout(resolve, indexingDelayMs));

        setState({ stage: "success", txHash: result.txHash });
      } catch (err) {
        const { failedAt, message } = mapError(err);
        setState({ stage: "failed", failedAt, message });
      }
    },
    [],
  );

  return { state, busy, run, reset };
}
