import { describe, it, expect, afterAll } from "vitest";
import { buildApp } from "../src/app.js";

describe("smoke", () => {
  const app = buildApp();
  afterAll(async () => {
    await app.close();
  });

  it("GET /health returns ok", async () => {
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true });
  });
});
