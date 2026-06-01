import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { startTestDb, resetDb, type TestDb } from "./helpers/db.js";
import { seedAction } from "./helpers/factory.js";
import { LedgerService } from "../src/services/ledger.js";
import { buildApp } from "../src/app.js";

describe("Backend Portfolio Summary Endpoint", () => {
  let db: TestDb;
  let svc: LedgerService;
  let app: any;

  beforeAll(async () => {
    db = await startTestDb();
    svc = new LedgerService(db.prisma);
    app = buildApp({ prisma: db.prisma, internalSecret: "test-secret" });
  });

  afterAll(async () => {
    await db.stop();
    await app.close();
  });

  beforeEach(async () => {
    await resetDb(db.prisma);
  });

  const validStellarAddress = "GABCDEF1234567890123456789012345678901234567890123456789";

  it("returns zero-state for empty wallet", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/portfolio/summary?wallet=${validStellarAddress}`
    });

    expect(res.statusCode).toBe(200);
    const json = JSON.parse(res.body);
    expect(json.ok).toBe(true);
    expect(json.data.wallet_address).toBe(validStellarAddress);
    expect(json.data.total_deposits).toBe(0);
    expect(json.data.active_positions).toEqual([]);
    expect(json.data.pending_rewards).toBe(0);
    expect(json.data.claimable_amount).toBe(0);
    expect(json.data.recent_activity).toEqual([]);
  });

  it("rejects invalid wallet address", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/portfolio/summary?wallet=invalidAddress"
    });

    expect(res.statusCode).toBe(400);
    const json = JSON.parse(res.body);
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe("INVALID_PAYLOAD");
  });

  it("aggregates deposits, active positions, and activity for active wallets", async () => {
    // 1. Confirmed deposit of 100 in vault 1
    await seedAction(db.prisma, {
      walletAddress: validStellarAddress,
      actionType: "deposit",
      status: "confirmed",
      actionPayload: { vault_id: "vault-1", amount: "100", token: "USDC" }
    });

    // 2. Confirmed deposit of 250 in vault 2
    await seedAction(db.prisma, {
      walletAddress: validStellarAddress,
      actionType: "deposit",
      status: "confirmed",
      actionPayload: { vault_id: "vault-2", amount: "250", token: "USDC" }
    });

    // 3. Confirmed withdrawal of 40 in vault 1 (net: 60)
    await seedAction(db.prisma, {
      walletAddress: validStellarAddress,
      actionType: "withdraw",
      status: "confirmed",
      actionPayload: { vault_id: "vault-1", amount: "40", token: "USDC" }
    });

    // 4. Confirmed claim of 15
    await seedAction(db.prisma, {
      walletAddress: validStellarAddress,
      actionType: "claim",
      status: "confirmed",
      actionPayload: { vault_id: "vault-1", amount: "15", token: "USDC" }
    });

    // 5. Pending deposit of 500 (should not affect active_positions, but should be in recent_activity)
    await seedAction(db.prisma, {
      walletAddress: validStellarAddress,
      actionType: "deposit",
      status: "pending",
      actionPayload: { vault_id: "vault-1", amount: "500", token: "USDC" }
    });

    const res = await app.inject({
      method: "GET",
      url: `/portfolio/summary?wallet=${validStellarAddress}`
    });

    expect(res.statusCode).toBe(200);
    const json = JSON.parse(res.body);
    expect(json.ok).toBe(true);

    const data = json.data;
    expect(data.wallet_address).toBe(validStellarAddress);
    expect(data.total_deposits).toBe(310); // 60 + 250
    expect(data.claimable_amount).toBe(15);
    expect(data.pending_rewards).toBe(0);

    expect(data.active_positions).toHaveLength(2);
    const pos1 = data.active_positions.find((p: any) => p.vault_id === "vault-1");
    const pos2 = data.active_positions.find((p: any) => p.vault_id === "vault-2");
    expect(pos1.balance).toBe(60);
    expect(pos2.balance).toBe(250);

    expect(data.recent_activity).toHaveLength(5);
    expect(data.recent_activity[0].status).toBe("pending");
    expect(data.recent_activity[0].action_type).toBe("deposit");
  });
});
