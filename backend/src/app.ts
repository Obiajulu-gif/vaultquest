import Fastify, { type FastifyInstance } from "fastify";
import type { PrismaClient } from "@prisma/client";
import correlation from "./middleware/correlation.js";
import { LedgerService } from "./services/ledger.js";
import { SavedPoolsService } from "./services/savedPools.js";
import { actionsRoutes } from "./routes/actions.js";
import { savedPoolsRoutes } from "./routes/savedPools.js";
import { internalRoutes } from "./routes/internal.js";
import { metricsRoutes } from "./routes/metrics.js";
import { MetricsService } from "./services/metricsService.js";
import { ok } from "./responses.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { rateLimiter } from "./middleware/rateLimiter.js";
import { createLogger } from "./logger.js";
import type { Logger } from "pino";
import type { CacheService } from "./services/cacheService.js";

export type AppDeps = {
  prisma: PrismaClient;
  internalSecret: string;
  logger?: Logger;
  cacheService?: CacheService;
};

export function buildApp(deps: AppDeps): FastifyInstance {
  const loggerInstance = deps.logger || createLogger("silent");
  const app = Fastify({
    logger: loggerInstance as any,
    disableRequestLogging: true
  });

  // Register rate limiting and CSRF protection
  app.register(rateLimiter);

  // Register correlation ID middleware
  app.register(correlation);

  // Structured Logging for incoming requests and performance duration
  app.addHook("onRequest", async (req, reply) => {
    (req.raw as any).tempStartTime = performance.now();
    req.log.info({
      event: "request_incoming",
      method: req.method,
      url: req.url,
      correlation_id: req.correlationId,
      ip: req.ip
    }, `Incoming request: ${req.method} ${req.url}`);
  });

  app.addHook("onResponse", async (req, reply) => {
    const startTime = (req.raw as any).tempStartTime || performance.now();
    const duration = performance.now() - startTime;
    req.log.info({
      event: "request_completed",
      method: req.method,
      url: req.url,
      correlation_id: req.correlationId,
      status_code: reply.statusCode,
      duration_ms: Math.round(duration * 100) / 100
    }, `Request completed: ${req.method} ${req.url} -> ${reply.statusCode} (${duration.toFixed(2)}ms)`);
  });

  // Inject CacheService into LedgerService
  const svc = new LedgerService(deps.prisma, deps.cacheService);
  const savedPoolsSvc = new SavedPoolsService(deps.prisma);
  const metricsSvc = new MetricsService(deps.prisma);

  app.get("/health", async () => ok({ ok: true }));
  app.get("/health/indexer", async () => {
    const health = await svc.getIndexerHealth();
    return ok(health);
  });

  app.register(actionsRoutes(svc));
  app.register(savedPoolsRoutes(savedPoolsSvc));
  app.register(internalRoutes(svc, deps.internalSecret));
  app.register(metricsRoutes(metricsSvc));

  // Central Error Handler Middleware
  app.setErrorHandler(errorHandler);

  return app;
}
