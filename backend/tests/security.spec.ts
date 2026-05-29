import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { randomUUID } from "node:crypto";
import { startTestDb, resetDb, type TestDb } from "./helpers/db.js";
import { buildApp } from "../src/app.js";
import type { FastifyInstance } from "fastify";

const WALLET_A = "GWALLET_A";
const WALLET_B = "GWALLET_B";

describe("wallet auth and ownership", () => {
  let db: TestDb;
  let app: FastifyInstance;

  beforeAll(async () => {
    db = await startTestDb();
    app = buildApp({ prisma: db.prisma, internalSecret: "test-secret" });
  });
  afterAll(async () => { await app.close(); await db.stop(); });
  beforeEach(async () => { await resetDb(db.prisma); });

  async function createAction(wallet: string): Promise<string> {
    const res = await app.inject({
      method: "POST", url: "/actions",
      headers: { "idempotency-key": randomUUID(), "content-type": "application/json", "x-wallet-address": wallet },
      payload: { wallet_address: wallet, action_type: "deposit", action_payload: { vault_id: "1" } }
    });
    expect(res.statusCode).toBe(201);
    return res.json().data.id as string;
  }

  // --- Missing X-Wallet-Address header ---

  it("POST /actions → 401 without X-Wallet-Address", async () => {
    const res = await app.inject({
      method: "POST", url: "/actions",
      headers: { "idempotency-key": randomUUID(), "content-type": "application/json" },
      payload: { wallet_address: WALLET_A, action_type: "deposit", action_payload: {} }
    });
    expect(res.statusCode).toBe(401);
    expect(res.json().error.code).toBe("UNAUTHORIZED");
  });

  it("GET /actions → 401 without X-Wallet-Address", async () => {
    const res = await app.inject({ method: "GET", url: `/actions?wallet=${WALLET_A}` });
    expect(res.statusCode).toBe(401);
  });

  it("GET /actions/:id → 401 without X-Wallet-Address", async () => {
    const id = await createAction(WALLET_A);
    const res = await app.inject({ method: "GET", url: `/actions/${id}` });
    expect(res.statusCode).toBe(401);
  });

  it("DELETE /actions → 401 without X-Wallet-Address", async () => {
    const res = await app.inject({ method: "DELETE", url: `/actions?wallet=${WALLET_A}` });
    expect(res.statusCode).toBe(401);
  });

  it("GET /dashboard/summary → 401 without X-Wallet-Address", async () => {
    const res = await app.inject({ method: "GET", url: `/dashboard/summary?wallet=${WALLET_A}` });
    expect(res.statusCode).toBe(401);
  });

  // --- Wallet mismatch (403) ---

  it("POST /actions → 403 when header wallet ≠ body wallet", async () => {
    const res = await app.inject({
      method: "POST", url: "/actions",
      headers: { "idempotency-key": randomUUID(), "content-type": "application/json", "x-wallet-address": WALLET_B },
      payload: { wallet_address: WALLET_A, action_type: "deposit", action_payload: {} }
    });
    expect(res.statusCode).toBe(403);
    expect(res.json().error.code).toBe("FORBIDDEN");
  });

  it("GET /actions/:id → 403 when header wallet ≠ record wallet", async () => {
    const id = await createAction(WALLET_A);
    const res = await app.inject({
      method: "GET", url: `/actions/${id}`,
      headers: { "x-wallet-address": WALLET_B }
    });
    expect(res.statusCode).toBe(403);
  });

  it("PATCH /actions/:id/submitted → 403 when header wallet ≠ record wallet", async () => {
    const id = await createAction(WALLET_A);
    const res = await app.inject({
      method: "PATCH", url: `/actions/${id}/submitted`,
      headers: { "content-type": "application/json", "x-wallet-address": WALLET_B },
      payload: { tx_hash: "tx_evil" }
    });
    expect(res.statusCode).toBe(403);
  });

  it("POST /actions/:id/cancel → 403 when header wallet ≠ record wallet", async () => {
    const id = await createAction(WALLET_A);
    const res = await app.inject({
      method: "POST", url: `/actions/${id}/cancel`,
      headers: { "content-type": "application/json", "x-wallet-address": WALLET_B },
      payload: { error_code: "WALLET_REJECTED" }
    });
    expect(res.statusCode).toBe(403);
  });

  it("GET /actions → 403 when header wallet ≠ query wallet", async () => {
    const res = await app.inject({
      method: "GET", url: `/actions?wallet=${WALLET_A}`,
      headers: { "x-wallet-address": WALLET_B }
    });
    expect(res.statusCode).toBe(403);
  });

  it("DELETE /actions → 403 when header wallet ≠ query wallet", async () => {
    const res = await app.inject({
      method: "DELETE", url: `/actions?wallet=${WALLET_A}`,
      headers: { "x-wallet-address": WALLET_B }
    });
    expect(res.statusCode).toBe(403);
  });

  it("GET /dashboard/summary → 403 when header wallet ≠ query wallet", async () => {
    const res = await app.inject({
      method: "GET", url: `/dashboard/summary?wallet=${WALLET_A}`,
      headers: { "x-wallet-address": WALLET_B }
    });
    expect(res.statusCode).toBe(403);
  });
});

describe("rate limiting", () => {
  let db: TestDb;
  let app: FastifyInstance;

  beforeAll(async () => {
    db = await startTestDb();
    // Very low limit so we can trigger it in tests.
    app = buildApp({
      prisma: db.prisma,
      internalSecret: "test-secret",
      rateLimitMax: 3,
      rateLimitWindowMs: 60_000
    });
  });
  afterAll(async () => { await app.close(); await db.stop(); });

  it("returns 429 after exceeding the per-wallet limit", async () => {
    const wallet = "GRATELIMIT";
    let lastStatus = 0;
    for (let i = 0; i < 5; i++) {
      const res = await app.inject({
        method: "GET", url: `/actions?wallet=${wallet}`,
        headers: { "x-wallet-address": wallet }
      });
      lastStatus = res.statusCode;
      if (res.statusCode === 429) {
        expect(res.json().error.code).toBe("RATE_LIMITED");
        return;
      }
    }
    // If we never hit 429 the test should fail.
    expect(lastStatus).toBe(429);
  });
});
