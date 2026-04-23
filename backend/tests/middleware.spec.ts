import { describe, it, expect } from "vitest";
import Fastify from "fastify";
import correlation from "../src/middleware/correlation.js";
import { requireServiceAuth } from "../src/middleware/service-auth.js";

describe("correlation middleware", () => {
  it("generates a correlation id when none provided", async () => {
    const app = Fastify();
    await app.register(correlation);
    app.get("/echo", async (req) => ({ id: req.correlationId }));
    const res = await app.inject({ method: "GET", url: "/echo" });
    expect(res.statusCode).toBe(200);
    expect(res.headers["correlation-id"]).toBeDefined();
    expect(res.json().id).toBe(res.headers["correlation-id"]);
    await app.close();
  });

  it("echoes an incoming correlation id", async () => {
    const app = Fastify();
    await app.register(correlation);
    app.get("/echo", async (req) => ({ id: req.correlationId }));
    const res = await app.inject({
      method: "GET",
      url: "/echo",
      headers: { "correlation-id": "abc-123" }
    });
    expect(res.headers["correlation-id"]).toBe("abc-123");
    await app.close();
  });
});

describe("service-auth middleware", () => {
  it("rejects missing secret", async () => {
    const app = Fastify();
    const guard = requireServiceAuth("top-secret");
    app.post("/internal", { preHandler: guard }, async () => ({ ok: true }));
    app.setErrorHandler((err, _req, reply) => {
      if (err.name === "AppError") {
        reply.status((err as unknown as { statusCode: number }).statusCode).send({ error: err.message });
        return;
      }
      reply.status(500).send({ error: "x" });
    });
    const res = await app.inject({ method: "POST", url: "/internal" });
    expect(res.statusCode).toBe(401);
    await app.close();
  });

  it("accepts correct secret", async () => {
    const app = Fastify();
    const guard = requireServiceAuth("top-secret");
    app.post("/internal", { preHandler: guard }, async () => ({ ok: true }));
    const res = await app.inject({
      method: "POST",
      url: "/internal",
      headers: { "x-internal-secret": "top-secret" }
    });
    expect(res.statusCode).toBe(200);
    await app.close();
  });
});
