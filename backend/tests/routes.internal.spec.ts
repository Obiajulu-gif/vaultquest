import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { randomUUID } from "node:crypto";
import { startTestDb, resetDb, type TestDb } from "./helpers/db.js";
import { buildApp } from "../src/app.js";
import type { FastifyInstance } from "fastify";

describe("/internal/reconcile", () => {
  let db: TestDb;
  let app: FastifyInstance;

  beforeAll(async () => {
    db = await startTestDb();
    app = buildApp({ prisma: db.prisma, internalSecret: "very-secret-123" });
  });
  afterAll(async () => {
    await app.close();
    await db.stop();
  });
  beforeEach(async () => { await resetDb(db.prisma); });

  it("rejects without secret", async () => {
    const res = await app.inject({
      method: "POST", url: "/internal/reconcile",
      headers: { "content-type": "application/json" },
      payload: { tx_hash: "tx", soroban_event_id: "e", event_payload: {}, status_hint: "confirmed" }
    });
    expect(res.statusCode).toBe(401);
  });

  it("matches a submitted action and confirms it", async () => {
    const key = randomUUID();
    const create = await app.inject({
      method: "POST", url: "/actions",
      headers: { "idempotency-key": key, "content-type": "application/json" },
      payload: { wallet_address: "GA", action_type: "deposit", action_payload: { v: 1 } }
    });
    const id = create.json().id;
    await app.inject({
      method: "PATCH", url: `/actions/${id}/submitted`,
      headers: { "content-type": "application/json" },
      payload: { tx_hash: "tx_match" }
    });

    const res = await app.inject({
      method: "POST", url: "/internal/reconcile",
      headers: { "x-internal-secret": "very-secret-123", "content-type": "application/json" },
      payload: { tx_hash: "tx_match", soroban_event_id: "evt_1", event_payload: {}, status_hint: "confirmed" }
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().matched).toBe(true);

    const row = await app.inject({ method: "GET", url: `/actions/${id}` });
    expect(row.json().status).toBe("confirmed");
  });

  it("parks unknown tx_hash", async () => {
    const res = await app.inject({
      method: "POST", url: "/internal/reconcile",
      headers: { "x-internal-secret": "very-secret-123", "content-type": "application/json" },
      payload: { tx_hash: "tx_unknown", soroban_event_id: "evt", event_payload: {}, status_hint: "confirmed" }
    });
    expect(res.statusCode).toBe(202);
    expect(res.json().parked).toBe(true);
  });
});
