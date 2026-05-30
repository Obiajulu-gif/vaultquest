import type { FC, ReactNode } from "react";
import { Coins, Trophy, Users } from "lucide-react";
import { useStore } from "@nanostores/react";
import {
  ErrorState,
  LoadingState,
  StaleIndicator,
  WalletDisconnectedState,
} from "../../components/FallbackStates";
import type { PoolActionType, PoolStatus, PoolSummary, UserPosition } from "../contract/types";
import { formatAmount, formatDate, truncateAddress } from "../lib/format";
import { OnboardingChecklist } from "./OnboardingChecklist";
import { isNetworkMismatch } from "../../core/store.js";
import { NetworkDiagnostics } from "../../components/NetworkDiagnostics";

/**
 * Pool detail view (#73): overview, the connected user's position, and the
 * actions available from the current pool state. Presentational — pair it with
 * `usePoolDetail` for data. Handles loading / stale / error / wallet states and
 * is responsive (stacked on mobile, two columns on desktop).
 */

export interface PoolDetailProps {
  pool: PoolSummary | null;
  position?: UserPosition | null;
  loading?: boolean;
  stale?: boolean;
  error?: string | null;
  walletConnected?: boolean;
  onConnect?: () => void;
  onRetry?: () => void;
  /** Invoked when the user triggers a pool action. */
  onAction?: (type: PoolActionType) => void;
  showOnboarding?: boolean;
}

const STATUS_BADGE: Record<PoolStatus, { label: string; className: string }> = {
  open: { label: "Open", className: "bg-emerald-500/15 text-emerald-300" },
  locked: { label: "Locked", className: "bg-sky-500/15 text-sky-300" },
  drawing: { label: "Drawing", className: "bg-amber-500/15 text-amber-300" },
  settled: { label: "Settled", className: "bg-gray-500/15 text-gray-300" },
};

const Stat: FC<{ icon: ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="rounded-xl border border-red-900/30 bg-[#1A0505]/60 p-4">
    <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-400">
      {icon}
      {label}
    </div>
    <p className="mt-1 text-lg font-semibold text-white">{value}</p>
  </div>
);

/** Actions available to the connected user given pool state and position. */
export function availableActions(pool: PoolSummary, position: UserPosition | null): PoolActionType[] {
  const joined = position?.joined ?? false;
  switch (pool.status) {
    case "open":
      return joined ? ["drip", "withdraw"] : ["join"];
    case "locked":
      return joined ? ["withdraw"] : [];
    case "settled":
      return joined ? ["claim", "withdraw"] : [];
    case "drawing":
    default:
      return [];
  }
}

const ACTION_LABEL: Record<PoolActionType, string> = {
  create: "Create pool",
  join: "Join pool",
  drip: "Add deposit",
  claim: "Claim reward",
  withdraw: "Withdraw",
};

export const PoolDetail: FC<PoolDetailProps> = ({
  pool,
  position = null,
  loading = false,
  stale = false,
  error = null,
  walletConnected = true,
  onConnect,
  onRetry,
  onAction,
  showOnboarding = true,
}) => {
  const mismatch = useStore(isNetworkMismatch);

  if (error) {
    return <ErrorState title="Couldn't load pool" message={error} onRetry={onRetry} />;
  }
  if (loading && pool === null) {
    return <LoadingState label="Loading pool…" />;
  }
  if (pool === null) {
    return <ErrorState title="Pool unavailable" message="This pool could not be found." onRetry={onRetry} />;
  }

  const badge = STATUS_BADGE[pool.status];
  const actions = walletConnected ? availableActions(pool, position) : [];

  return (
    <section aria-label={`Pool ${pool.name}`} className="space-y-6">
      {showOnboarding && <OnboardingChecklist />}

      <NetworkDiagnostics />

      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white">{pool.name}</h1>
          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${badge.className}`}>
            {badge.label}
          </span>
        </div>
        {stale && <StaleIndicator />}
      </header>

      {/* Overview */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={<Coins className="h-3.5 w-3.5" aria-hidden="true" />} label="TVL" value={formatAmount(pool.tvl, pool.asset)} />
        <Stat icon={<Users className="h-3.5 w-3.5" aria-hidden="true" />} label="Participants" value={String(pool.participantCount)} />
        <Stat icon={<Trophy className="h-3.5 w-3.5" aria-hidden="true" />} label="Expected yield" value={pool.expectedYield} />
        <Stat icon={<Trophy className="h-3.5 w-3.5" aria-hidden="true" />} label="Prize" value={pool.prize ?? "—"} />
      </div>

      <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
        <div className="flex justify-between gap-2 sm:flex-col">
          <dt className="text-gray-400">Opens</dt>
          <dd className="text-gray-200">{formatDate(pool.opensAt)}</dd>
        </div>
        <div className="flex justify-between gap-2 sm:flex-col">
          <dt className="text-gray-400">Locks</dt>
          <dd className="text-gray-200">{formatDate(pool.locksAt)}</dd>
        </div>
        <div className="flex justify-between gap-2 sm:flex-col">
          <dt className="text-gray-400">Draws</dt>
          <dd className="text-gray-200">{formatDate(pool.drawsAt)}</dd>
        </div>
      </dl>

      {/* User position */}
      <div className="rounded-2xl border border-red-900/30 bg-[#1A0505]/60 p-5">
        <h2 className="text-lg font-semibold text-white">Your position</h2>
        {!walletConnected ? (
          <div className="mt-3">
            <WalletDisconnectedState onConnect={onConnect} />
          </div>
        ) : position?.joined ? (
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-gray-400">Deposited</dt>
              <dd className="text-base font-semibold text-white">{formatAmount(position.deposited, pool.asset)}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Shares</dt>
              <dd className="text-base font-semibold text-white">{formatAmount(position.shares)}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-gray-400">Wallet</dt>
              <dd className="font-mono text-gray-200">{truncateAddress(position.walletAddress)}</dd>
            </div>
          </dl>
        ) : (
          <p className="mt-2 text-sm text-gray-400">You haven't joined this pool yet.</p>
        )}
      </div>

      {/* Actions */}
      {actions.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {actions.map((action) => (
            <button
              key={action}
              type="button"
              onClick={() => !mismatch && onAction?.(action)}
              disabled={mismatch}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1A0505] ${
                mismatch
                  ? "bg-gray-600 opacity-50 cursor-not-allowed focus-visible:ring-gray-400"
                  : "bg-red-600 hover:bg-red-700 focus-visible:ring-red-400"
              }`}
              title={mismatch ? "Actions blocked due to network mismatch" : ACTION_LABEL[action]}
            >
              {ACTION_LABEL[action]}
            </button>
          ))}
        </div>
      )}
    </section>
  );
};

export default PoolDetail;
