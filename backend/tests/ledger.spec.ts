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
