export const ACTION_TYPES = ["deposit", "withdraw", "create_vault", "claim", "select_winner"] as const;
export type ActionType = (typeof ACTION_TYPES)[number];

export const ACTION_STATUSES = ["pending", "submitted", "confirmed", "failed", "reverted", "orphaned"] as const;
export type ActionStatus = (typeof ACTION_STATUSES)[number];

export const TERMINAL_STATUSES: readonly ActionStatus[] = ["confirmed", "failed", "reverted", "orphaned"];

const TRANSITIONS: Record<ActionStatus, readonly ActionStatus[]> = {
  pending: ["submitted", "failed"],
  submitted: ["confirmed", "reverted", "orphaned"],
  confirmed: [],
  failed: [],
  reverted: [],
  orphaned: []
};

export function canTransition(from: ActionStatus, to: ActionStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export const ERROR_CODES = {
  WALLET_REJECTED: "WALLET_REJECTED",
  WALLET_TIMEOUT: "WALLET_TIMEOUT",
  INVALID_PAYLOAD: "INVALID_PAYLOAD",
  NETWORK_ERROR: "NETWORK_ERROR",
  REVERTED_ON_CHAIN: "REVERTED_ON_CHAIN",
  ORPHAN_TTL_EXPIRED: "ORPHAN_TTL_EXPIRED",
  IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD: "IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD",
  ILLEGAL_TRANSITION: "ILLEGAL_TRANSITION",
  NOT_FOUND: "NOT_FOUND",
  UNAUTHORIZED: "UNAUTHORIZED"
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
