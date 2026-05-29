import Fastify, { type FastifyInstance } from "fastify";
import rateLimit from "@fastify/rate-limit";
import type { PrismaClient } from "@prisma/client";
import type { Logger } from "pino";
import { ZodError } from "zod";
import correlation from "./middleware/correlation.js";
import { LedgerService } from "./services/ledger.js";
import { actionsRoutes } from "./routes/actions.js";
import { internalRoutes } from "./routes/internal.js";
import { AppError } from "./errors.js";
import { apiError, ok } from "./responses.js";

export type AppDeps = {
  prisma: PrismaClient;
  internalSecret: string;
  logger?: Logger;
  rateLimitMax?: number;
  rateLimitWindowMs?: number;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildApp(deps: AppDeps): FastifyInstance<any, any, any, any> {
  // Fastify v4 accepts a pino Logger instance directly as the `logger` option.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const app = Fastify({ logger: (deps.logger ?? false) as any });

  app.register(correlation);

  app.register(rateLimit, {
    max: deps.rateLimitMax ?? 100,
    timeWindow: deps.rateLimitWindowMs ?? 60_000,
    keyGenerator(req) {
      // Prefer wallet identity over IP so shared-IP clients aren't penalised together.
      const wallet = req.headers["x-wallet-address"];
      return (typeof wallet === "string" && wallet.length > 0)
        ? `wallet:${wallet}`
        : `ip:${req.ip}`;
    },
    errorResponseBuilder(_req, context) {
      const err = new Error(`too many requests — retry after ${context.after}`) as Error & { statusCode: number; body: unknown };
      err.statusCode = 429;
      err.body = apiError(
        "RATE_LIMITED",
        `too many requests — retry after ${context.after}`,
        { retry_after_ms: context.ttl }
      );
      return err;
    }
  });

  // Log every request with correlationId once the hook has run.
  app.addHook("onRequest", async (req) => {
    req.log.info({
      correlationId: req.correlationId,
      method: req.method,
      url: req.url,
      wallet: req.headers["x-wallet-address"] ?? undefined
    }, "request");
  });

  app.addHook("onResponse", async (req, reply) => {
    req.log.info({
      correlationId: req.correlationId,
      statusCode: reply.statusCode,
      responseTime: reply.elapsedTime
    }, "response");
  });

  const svc = new LedgerService(deps.prisma);

  app.get("/health", async () => ok({ ok: true }));
  app.register(actionsRoutes(svc));
  app.register(internalRoutes(svc, deps.internalSecret));

  app.setErrorHandler((err, req, reply) => {
    if (err instanceof AppError) {
      req.log.warn({ correlationId: req.correlationId, code: err.code }, err.message);
      reply.status(err.statusCode).send(apiError(err.code, err.message, err.detail));
      return;
    }
    if (err instanceof ZodError) {
      req.log.warn({ correlationId: req.correlationId, issues: err.issues }, "validation failed");
      reply.status(400).send(apiError("INVALID_PAYLOAD", "validation failed", undefined, err.issues));
      return;
    }
    // @fastify/rate-limit throws the return value of errorResponseBuilder with statusCode=429.
    const httpStatus = (err as { statusCode?: number }).statusCode;
    if (httpStatus === 429) {
      const body = (err as { body?: unknown }).body ?? apiError("RATE_LIMITED", err.message);
      reply.status(429).send(body);
      return;
    }
    req.log.error({ correlationId: req.correlationId, err }, "unhandled error");
    reply.status(500).send(apiError("INTERNAL", err.message));
  });

  return app;
}
