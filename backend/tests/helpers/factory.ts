import type { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";

export function makeIntentInput(overrides: Partial<{
  walletAddress: string;
  actionType: "deposit" | "withdraw" | "create_vault" | "claim" | "select_winner";
  actionPayload: Record<string, unknown>;
  idempotencyKey: string;
}> = {}) {
  return {
    walletAddress: overrides.walletAddress ?? "GABCDEF1234567890",
    actionType: overrides.actionType ?? "deposit",
    actionPayload: overrides.actionPayload ?? { vault_id: "42", amount: "1000000", token: "USDC" },
    idempotencyKey: overrides.idempotencyKey ?? randomUUID()
  };
}

export async function seedAction(prisma: PrismaClient, overrides: Partial<{
  walletAddress: string;
  actionType: "deposit" | "withdraw" | "create_vault" | "claim" | "select_winner";
  status: "pending" | "submitted" | "confirmed" | "failed" | "reverted" | "orphaned";
  txHash: string | null;
  idempotencyKey: string;
  actionPayload: unknown;
}> = {}) {
  return prisma.actionLedger.create({
    data: {
      idempotencyKey: overrides.idempotencyKey ?? randomUUID(),
      walletAddress: overrides.walletAddress ?? "GABCDEF1234567890",
      actionType: overrides.actionType ?? "deposit",
      actionPayload: (overrides.actionPayload ?? { vault_id: "1", amount: "100" }) as object,
      status: overrides.status ?? "pending",
      txHash: overrides.txHash ?? null
    }
  });
}
