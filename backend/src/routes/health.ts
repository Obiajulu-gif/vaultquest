import type { FastifyPluginAsync } from "fastify";
import type { LedgerService } from "../services/ledger.js";
import { ok } from "../responses.js";

export const healthRoutes = (svc: LedgerService): FastifyPluginAsync =>
  async (app) => {
    app.get("/health", async (req) => {
      req.log.debug({ event: "health_check" }, "health check requested");
      return ok({
        status: "ok",
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        service: "vaultquest-backend"
      });
    });

    app.get("/health/indexer", async (req) => {
      const health = await svc.getIndexerHealth();
      req.log.debug(
        { event: "health_indexer_check", status: health.status },
        "indexer health checked"
      );
      return ok(health);
    });
  };
