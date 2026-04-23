import { Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import { ERROR_CODES } from "../constants.js";
import { AppError } from "../errors.js";
import type { IntentInput, ActionRecord } from "../types.js";
import type { ActionStatus } from "../constants.js";

export type ListActionsParams = {
  walletAddress: string;
  status?: ActionStatus;
  limit: number;
  cursor?: string | null;
};

export type ListActionsResult = {
  items: ActionRecord[];
  nextCursor: string | null;
};

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
        actionPayload: input.actionPayload as object
      }
    });
    return created as unknown as ActionRecord;
  }

  async attachTxHash(id: string, txHash: string): Promise<ActionRecord> {
    return this.prisma.$transaction(async (tx) => {
      const row = await tx.actionLedger.findUnique({ where: { id } });
      if (!row) throw AppError.notFound(`action ${id} not found`);

      if (row.status !== "pending") {
        throw AppError.conflict(
          ERROR_CODES.ILLEGAL_TRANSITION,
          `cannot attach tx_hash to action in status ${row.status}`
        );
      }

      const pending = await tx.pendingEvent.findUnique({ where: { txHash } });

      if (pending) {
        await tx.pendingEvent.update({
          where: { txHash },
          data: { consumedAt: new Date() }
        });
        const confirmed = await tx.actionLedger.update({
          where: { id },
          data: {
            status: pending.statusHint === "reverted" ? "reverted" : "confirmed",
            txHash,
            submittedAt: new Date(),
            confirmedAt: new Date(),
            sorobanEventId: pending.sorobanEventId,
            errorCode: pending.statusHint === "reverted" ? ERROR_CODES.REVERTED_ON_CHAIN : null
          }
        });
        return confirmed as unknown as ActionRecord;
      }

      const updated = await tx.actionLedger.update({
        where: { id },
        data: {
          status: "submitted",
          txHash,
          submittedAt: new Date()
        }
      });
      return updated as unknown as ActionRecord;
    });
  }

  async cancelAction(id: string, errorCode: string, errorDetail?: string): Promise<ActionRecord> {
    const row = await this.prisma.actionLedger.findUnique({ where: { id } });
    if (!row) throw AppError.notFound(`action ${id} not found`);

    if (row.status !== "pending") {
      throw AppError.conflict(
        ERROR_CODES.ILLEGAL_TRANSITION,
        `cannot cancel action in status ${row.status}`
      );
    }

    const updated = await this.prisma.actionLedger.update({
      where: { id },
      data: { status: "failed", errorCode, errorDetail: errorDetail ?? null }
    });
    return updated as unknown as ActionRecord;
  }

  async getAction(id: string): Promise<ActionRecord | null> {
    const row = await this.prisma.actionLedger.findUnique({ where: { id } });
    return row ? (row as unknown as ActionRecord) : null;
  }

  async listActions(params: ListActionsParams): Promise<ListActionsResult> {
    const { walletAddress, status, limit, cursor } = params;

    const rows = await this.prisma.actionLedger.findMany({
      where: { walletAddress, ...(status !== undefined && { status }) },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(cursor != null && { cursor: { id: cursor }, skip: 1 })
    });

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore ? (items[items.length - 1]?.id ?? null) : null;

    return { items: items as unknown as ActionRecord[], nextCursor };
  }

  async reconcileEvent(input: {
    txHash: string;
    sorobanEventId: string;
    eventPayload: unknown;
    statusHint: "confirmed" | "reverted";
  }): Promise<{ matched: boolean }> {
    return this.prisma.$transaction(async (tx) => {
      const row = await tx.actionLedger.findFirst({ where: { txHash: input.txHash } });

      if (!row) {
        await tx.pendingEvent.upsert({
          where: { txHash: input.txHash },
          create: {
            txHash: input.txHash,
            sorobanEventId: input.sorobanEventId,
            eventPayload: input.eventPayload as object,
            statusHint: input.statusHint
          },
          update: {}
        });
        return { matched: false };
      }

      if (row.status === "confirmed" || row.status === "reverted") {
        return { matched: true };
      }

      await tx.actionLedger.update({
        where: { id: row.id },
        data: {
          status: input.statusHint === "reverted" ? "reverted" : "confirmed",
          sorobanEventId: input.sorobanEventId,
          confirmedAt: new Date(),
          errorCode: input.statusHint === "reverted" ? ERROR_CODES.REVERTED_ON_CHAIN : null
        }
      });
      return { matched: true };
    });
  }

  async findByIdempotencyKey(key: string): Promise<ActionRecord | null> {
    const row = await this.prisma.actionLedger.findUnique({ where: { idempotencyKey: key } });
    return (row as unknown as ActionRecord) ?? null;
  }

  async scrubWallet(walletAddress: string): Promise<{ scrubbed: number }> {
    const result = await this.prisma.actionLedger.updateMany({
      where: { walletAddress, redactedAt: null },
      data: {
        actionPayload: Prisma.DbNull as unknown as never,
        redactedAt: new Date()
      }
    });
    return { scrubbed: result.count };
  }
}
