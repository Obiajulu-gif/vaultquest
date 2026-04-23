import type { FastifyPluginAsync } from "fastify";
import type { LedgerService } from "../services/ledger.js";
import { reconcileBody } from "../schemas/actions.js";
import { requireServiceAuth } from "../middleware/service-auth.js";

export const internalRoutes = (svc: LedgerService, secret: string): FastifyPluginAsync =>
  async (app) => {
    const guard = requireServiceAuth(secret);
    app.post("/internal/reconcile", { preHandler: guard }, async (req, reply) => {
      const body = reconcileBody.parse(req.body);
      const result = await svc.reconcileEvent({
        txHash: body.tx_hash,
        sorobanEventId: body.soroban_event_id,
        eventPayload: body.event_payload,
        statusHint: body.status_hint
      });
      if (!result.matched) {
        reply.status(202);
        return { parked: true };
      }
      return { matched: true };
    });
  };
