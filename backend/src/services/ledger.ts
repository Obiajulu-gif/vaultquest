import type { PrismaClient } from "@prisma/client";
import { ERROR_CODES } from "../constants.js";
import { AppError } from "../errors.js";
import type { IntentInput, ActionRecord } from "../types.js";

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return "[" + value.map((v) => stableStringify(v)).join(",") + "]";
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return (
    "{" +
    keys.map((k) => JSON.stringify(k) + ":" + stableStringify(obj[k])).join(",") +
    "}"
  );
}

export class LedgerService {
  constructor(private readonly prisma: PrismaClient) {}

  async createAction(input: IntentInput): Promise<ActionRecord> {
    const existing = await this.prisma.actionLedger.findUnique({
      where: { idempotencyKey: input.idempotencyKey }
    });

    if (existing) {
      const samePayload =
        stableStringify(existing.actionPayload) === stableStringify(input.actionPayload) &&
        existing.walletAddress === input.walletAddress &&
        existing.actionType === input.actionType;
      if (!samePayload) {
        throw AppError.conflict(
          ERROR_CODES.IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD,
          "idempotency key reused with a different payload"
        );
      }
      return existing as unknown as ActionRecord;
    }

    const created = await this.prisma.actionLedger.create({
      data: {
        idempotencyKey: input.idempotencyKey,
        walletAddress: input.walletAddress,
        actionType: input.actionType,
        actionPayload: input.actionPayload
      }
    });
    return created as unknown as ActionRecord;
  }
}
