import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { startTestDb, resetDb, type TestDb } from "./helpers/db.js";
import { seedAction } from "./helpers/factory.js";
import { sweepOrphans } from "../src/services/reconciler.js";

describe("sweepOrphans", () => {
  let db: TestDb;
  beforeAll(async () => { db = await startTestDb(); });
  afterAll(async () => { await db.stop(); });
  beforeEach(async () => { await resetDb(db.prisma); });

  it("marks submitted rows older than TTL as orphaned", async () => {
    const now = new Date();
    const oldRow = await seedAction(db.prisma, { status: "submitted", txHash: "tx_old" });
    await db.prisma.actionLedger.update({
      where: { id: oldRow.id },
      data: { updatedAt: new Date(now.getTime() - 30 * 60 * 1000) }
    });

    const fresh = await seedAction(db.prisma, { status: "submitted", txHash: "tx_fresh" });
    const result = await sweepOrphans(db.prisma, { ttlMinutes: 10 });

    expect(result.orphaned).toBe(1);
    const refreshed = await db.prisma.actionLedger.findUnique({ where: { id: oldRow.id } });
    expect(refreshed?.status).toBe("orphaned");
    expect(refreshed?.errorCode).toBe("ORPHAN_TTL_EXPIRED");

    const stillSubmitted = await db.prisma.actionLedger.findUnique({ where: { id: fresh.id } });
    expect(stillSubmitted?.status).toBe("submitted");
  });

  it("does not touch pending rows", async () => {
    const now = new Date();
    const old = await seedAction(db.prisma, { status: "pending" });
    await db.prisma.actionLedger.update({
      where: { id: old.id },
      data: { updatedAt: new Date(now.getTime() - 60 * 60 * 1000) }
    });
    const result = await sweepOrphans(db.prisma, { ttlMinutes: 10 });
    expect(result.orphaned).toBe(0);
  });

  it("deletes pending_events older than 1 hour with no match", async () => {
    await db.prisma.pendingEvent.create({
      data: {
        txHash: "tx_stale",
        sorobanEventId: "evt_stale",
        eventPayload: {},
        statusHint: "confirmed",
        receivedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
      }
    });
    const result = await sweepOrphans(db.prisma, { ttlMinutes: 10 });
    expect(result.prunedEvents).toBe(1);
    const found = await db.prisma.pendingEvent.findUnique({ where: { txHash: "tx_stale" } });
    expect(found).toBeNull();
  });
});
