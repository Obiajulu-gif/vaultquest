import type { ActionType, ActionStatus } from "./constants.js";

export type IntentInput = {
  walletAddress: string;
  actionType: ActionType;
  actionPayload: Record<string, unknown>;
  idempotencyKey: string;
};

export type ActionRecord = {
  id: string;
  idempotencyKey: string;
  walletAddress: string;
  actionType: ActionType;
  actionPayload: unknown;
  status: ActionStatus;
  txHash: string | null;
  sorobanEventId: string | null;
  correlationId: string;
  errorCode: string | null;
  errorDetail: string | null;
  retryCount: number;
  redactedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  submittedAt: Date | null;
  confirmedAt: Date | null;
};
