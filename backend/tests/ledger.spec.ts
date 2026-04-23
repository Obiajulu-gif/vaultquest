import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { startTestDb, resetDb, type TestDb } from "./helpers/db.js";
import { makeIntentInput } from "./helpers/factory.js";
import { LedgerService } from "../src/services/ledger.js";
import { AppError } from "../src/errors.js";

describe("LedgerService.createAction", () => {
  let db: TestDb;
  let svc: LedgerService;

  beforeAll(async () => {
    db = await startTestDb();
    svc = new LedgerService(db.prisma);
  });
  afterAll(async () => {
    await db.stop();
  });
  beforeEach(async () => {
    await resetDb(db.prisma);
  });

  it("creates a pending action", async () => {
    const input = makeIntentInput();
    const result = await svc.createAction(input);
    expect(result.status).toBe("pending");
    expect(result.walletAddress).toBe(input.walletAddress);
    expect(result.idempotencyKey).toBe(input.idempotencyKey);
    expect(result.correlationId).toBeDefined();
  });

  it("returns same row on duplicate idempotency key with identical payload", async () => {
    const input = makeIntentInput();
    const first = await svc.createAction(input);
    const second = await svc.createAction(input);
    expect(second.id).toBe(first.id);
    expect(second.correlationId).toBe(first.correlationId);
  });

  it("rejects duplicate key with different payload", async () => {
    const input = makeIntentInput();
    await svc.createAction(input);
    await expect(
      svc.createAction({ ...input, actionPayload: { vault_id: "999", amount: "1" } })
    ).rejects.toBeInstanceOf(AppError);
  });

  it("allows different idempotency keys for same wallet and payload", async () => {
    const a = makeIntentInput({ idempotencyKey: "key-a" });
    const b = makeIntentInput({ idempotencyKey: "key-b" });
    const ra = await svc.createAction(a);
    const rb = await svc.createAction(b);
    expect(ra.id).not.toBe(rb.id);
  });
});

describe("LedgerService.attachTxHash", () => {
  let db: TestDb;
  let svc: LedgerService;

  beforeAll(async () => {
    db = await startTestDb();
    svc = new LedgerService(db.prisma);
  });
  afterAll(async () => {
    await db.stop();
  });
  beforeEach(async () => {
    await resetDb(db.prisma);
  });

  it("transitions pending -> submitted", async () => {
    const input = makeIntentInput();
    const created = await svc.createAction(input);
    const updated = await svc.attachTxHash(created.id, "tx_abc123");
    expect(updated.status).toBe("submitted");
    expect(updated.txHash).toBe("tx_abc123");
    expect(updated.submittedAt).not.toBeNull();
  });

  it("throws NOT_FOUND on unknown id", async () => {
    await expect(svc.attachTxHash("11111111-1111-1111-1111-111111111111", "tx"))
      .rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("rejects attachTxHash on terminal row", async () => {
    const input = makeIntentInput();
    const created = await svc.createAction(input);
    await db.prisma.actionLedger.update({
      where: { id: created.id },
      data: { status: "confirmed", confirmedAt: new Date() }
    });
    await expect(svc.attachTxHash(created.id, "tx_abc"))
      .rejects.toMatchObject({ code: "ILLEGAL_TRANSITION" });
  });

  it("auto-confirms when matching pending_event already exists", async () => {
    await db.prisma.pendingEvent.create({
      data: {
        txHash: "tx_race_1",
        sorobanEventId: "evt_xyz",
        eventPayload: { ok: true },
        statusHint: "confirmed"
      }
    });

    const input = makeIntentInput();
    const created = await svc.createAction(input);
    const updated = await svc.attachTxHash(created.id, "tx_race_1");

    expect(updated.status).toBe("confirmed");
    expect(updated.sorobanEventId).toBe("evt_xyz");
    expect(updated.confirmedAt).not.toBeNull();

    const consumed = await db.prisma.pendingEvent.findUnique({ where: { txHash: "tx_race_1" } });
    expect(consumed?.consumedAt).not.toBeNull();
  });
});
