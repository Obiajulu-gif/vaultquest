import Fastify, { type FastifyInstance } from "fastify";
import type { PrismaClient } from "@prisma/client";
import { ZodError } from "zod";
import correlation from "./middleware/correlation.js";
import { LedgerService } from "./services/ledger.js";
import { actionsRoutes } from "./routes/actions.js";
import { AppError } from "./errors.js";

export type AppDeps = {
  prisma: PrismaClient;
  internalSecret: string;
};

export function buildApp(deps: AppDeps): FastifyInstance {
  const app = Fastify({ logger: false });
  app.register(correlation);

  const svc = new LedgerService(deps.prisma);

  app.get("/health", async () => ({ ok: true }));
  app.register(actionsRoutes(svc));

  app.setErrorHandler((err, _req, reply) => {
    if (err instanceof AppError) {
      reply.status(err.statusCode).send({ code: err.code, message: err.message, detail: err.detail });
      return;
    }
    if (err instanceof ZodError) {
      reply.status(400).send({ code: "INVALID_PAYLOAD", message: "validation failed", issues: err.issues });
      return;
    }
    reply.status(500).send({ code: "INTERNAL", message: err.message });
  });

  return app;
}
