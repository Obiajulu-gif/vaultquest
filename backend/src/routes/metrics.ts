import type { FastifyPluginAsync } from "fastify";
import type { MetricsService } from "../services/metricsService.js";

export const metricsRoutes = (svc: MetricsService): FastifyPluginAsync => {
  return async (app) => {
    app.get("/api/metrics", async (req, reply) => {
      const summary = await svc.getProtocolSummary();
      return reply.send({ ok: true, data: summary });
    });

    app.get("/api/metrics/round", async (req, reply) => {
      const roundData = await svc.getCurrentRoundStatus();
      return reply.send({ ok: true, data: roundData });
    });

    app.get("/api/metrics/history", async (req, reply) => {
      const history = await svc.getHistoricalSummary();
      return reply.send({ ok: true, data: history });
    });
  };
};
