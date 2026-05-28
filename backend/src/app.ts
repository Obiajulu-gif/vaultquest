import Fastify, { type FastifyInstance } from "fastify";
import type { PrismaClient } from "@prisma/client";
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
};

export function buildApp(deps: AppDeps): FastifyInstance {
  const app = Fastify({ logger: false });
  app.register(correlation);

  const svc = new LedgerService(deps.prisma);

  app.get("/health", async () => ok({ ok: true }));
  app.register(actionsRoutes(svc));
  app.register(internalRoutes(svc, deps.internalSecret));

  app.setErrorHandler((err, _req, reply) => {
    if (err instanceof AppError) {
      reply.status(err.statusCode).send(apiError(err.code, err.message, err.detail));
      return;
    }
    if (err instanceof ZodError) {
      reply.status(400).send(apiError("INVALID_PAYLOAD", "validation failed", undefined, err.issues));
      return;
    }
    reply.status(500).send(apiError("INTERNAL", err.message));
  });

  return app;
}
