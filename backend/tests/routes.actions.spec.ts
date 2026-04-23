import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { randomUUID } from "node:crypto";
import { startTestDb, resetDb, type TestDb } from "./helpers/db.js";
import { buildApp } from "../src/app.js";
import type { FastifyInstance } from "fastify";

describe("public /actions routes", () => {
  let db: TestDb;
  let app: FastifyInstance;

  beforeAll(async () => {
    db = await startTestDb();
    app = buildApp({ prisma: db.prisma, internalSecret: "test-secret" });
  });
  afterAll(async () => {
    await app.close();
    await db.stop();
  });
  beforeEach(async () => {
    await resetDb(db.prisma);
  });

  it("POST /actions requires Idempotency-Key", async () => {
    const res = await app.inject({
      method: "POST", url: "/actions",
      payload: { wallet_address: "GABC", action_type: "deposit", action_payload: { vault_id: "1" } }
    });
    expect(res.statusCode).toBe(400);
  });

  it("POST /actions creates a pending action", async () => {
    const key = randomUUID();
    const res = await app.inject({
      method: "POST", url: "/actions",
      headers: { "idempotency-key": key, "content-type": "application/json" },
      payload: { wallet_address: "GABC", action_type: "deposit", action_payload: { vault_id: "1" } }
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.status).toBe("pending");
    expect(body.correlation_id).toBeDefined();
  });

  it("POST /actions returns 200 on idempotent replay", async () => {
    const key = randomUUID();
    const payload = { wallet_address: "GABC", action_type: "deposit", action_payload: { vault_id: "1" } };
    const first = await app.inject({
      method: "POST", url: "/actions",
      headers: { "idempotency-key": key, "content-type": "application/json" },
      payload
    });
    const second = await app.inject({
      method: "POST", url: "/actions",
      headers: { "idempotency-key": key, "content-type": "application/json" },
      payload
    });
    expect(first.statusCode).toBe(201);
    expect(second.statusCode).toBe(200);
    expect(second.json().id).toBe(first.json().id);
  });

  it("POST /actions returns 409 on key reuse with different payload", async () => {
    const key = randomUUID();
    const first = await app.inject({
      method: "POST", url: "/actions",
      headers: { "idempotency-key": key, "content-type": "application/json" },
      payload: { wallet_address: "GABC", action_type: "deposit", action_payload: { vault_id: "1" } }
    });
    const second = await app.inject({
      method: "POST", url: "/actions",
      headers: { "idempotency-key": key, "content-type": "application/json" },
      payload: { wallet_address: "GABC", action_type: "deposit", action_payload: { vault_id: "999" } }
    });
    expect(first.statusCode).toBe(201);
    expect(second.statusCode).toBe(409);
    expect(second.json().code).toBe("IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD");
  });

  it("PATCH /actions/:id/submitted transitions to submitted", async () => {
    const key = randomUUID();
    const create = await app.inject({
      method: "POST", url: "/actions",
      headers: { "idempotency-key": key, "content-type": "application/json" },
      payload: { wallet_address: "GABC", action_type: "deposit", action_payload: { vault_id: "1" } }
    });
    const id = create.json().id;
    const patch = await app.inject({
      method: "PATCH", url: `/actions/${id}/submitted`,
      headers: { "content-type": "application/json" },
      payload: { tx_hash: "tx_1" }
    });
    expect(patch.statusCode).toBe(200);
    expect(patch.json().status).toBe("submitted");
    expect(patch.json().tx_hash).toBe("tx_1");
  });

  it("POST /actions/:id/cancel transitions to failed", async () => {
    const key = randomUUID();
    const create = await app.inject({
      method: "POST", url: "/actions",
      headers: { "idempotency-key": key, "content-type": "application/json" },
      payload: { wallet_address: "GABC", action_type: "deposit", action_payload: { vault_id: "1" } }
    });
    const id = create.json().id;
    const cancel = await app.inject({
      method: "POST", url: `/actions/${id}/cancel`,
      headers: { "content-type": "application/json" },
      payload: { error_code: "WALLET_REJECTED", error_detail: "user denied" }
    });
    expect(cancel.statusCode).toBe(200);
    expect(cancel.json().status).toBe("failed");
    expect(cancel.json().error_code).toBe("WALLET_REJECTED");
  });

  it("GET /actions/:id returns record", async () => {
    const key = randomUUID();
    const create = await app.inject({
      method: "POST", url: "/actions",
      headers: { "idempotency-key": key, "content-type": "application/json" },
      payload: { wallet_address: "GABC", action_type: "deposit", action_payload: { vault_id: "1" } }
    });
    const id = create.json().id;
    const get = await app.inject({ method: "GET", url: `/actions/${id}` });
    expect(get.statusCode).toBe(200);
    expect(get.json().id).toBe(id);
  });

  it("GET /actions lists by wallet", async () => {
    for (let i = 0; i < 2; i++) {
      await app.inject({
        method: "POST", url: "/actions",
        headers: { "idempotency-key": randomUUID(), "content-type": "application/json" },
        payload: { wallet_address: "GWALLET", action_type: "deposit", action_payload: { i } }
      });
    }
    const list = await app.inject({ method: "GET", url: "/actions?wallet=GWALLET&limit=10" });
    expect(list.statusCode).toBe(200);
    expect(list.json().items).toHaveLength(2);
  });

  it("DELETE /actions?wallet=G... scrubs payload", async () => {
    const key = randomUUID();
    const create = await app.inject({
      method: "POST", url: "/actions",
      headers: { "idempotency-key": key, "content-type": "application/json" },
      payload: { wallet_address: "GSCRUB", action_type: "deposit", action_payload: { secret: "hidden" } }
    });
    const id = create.json().id;
    const del = await app.inject({ method: "DELETE", url: "/actions?wallet=GSCRUB" });
    expect(del.statusCode).toBe(200);
    expect(del.json().scrubbed).toBe(1);

    const get = await app.inject({ method: "GET", url: `/actions/${id}` });
    expect(get.json().action_payload).toBeNull();
    expect(get.json().redacted_at).not.toBeNull();
  });
});
