import { z } from "zod";
import { ACTION_TYPES, ACTION_STATUSES } from "../constants.js";

export const walletSchema = z.string().min(1).max(120);
export const idempotencyKeySchema = z.string().uuid();

export const createActionBody = z.object({
  wallet_address: walletSchema,
  action_type: z.enum(ACTION_TYPES),
  action_payload: z.record(z.unknown())
});

export const attachTxBody = z.object({
  tx_hash: z.string().min(4).max(200)
});

export const cancelBody = z.object({
  error_code: z.string().min(1).max(64),
  error_detail: z.string().max(1000).optional()
});

export const listQuery = z.object({
  wallet: walletSchema,
  status: z.enum(ACTION_STATUSES).optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25)
});

export const reconcileBody = z.object({
  tx_hash: z.string().min(4).max(200),
  soroban_event_id: z.string().min(1).max(200),
  event_payload: z.record(z.unknown()),
  status_hint: z.enum(["confirmed", "reverted"])
});

export const dashboardQuery = z.object({
  wallet: walletSchema,
  stale_after_ms: z.coerce.number().int().min(0).max(24 * 60 * 60 * 1000).optional()
});
