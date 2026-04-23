import type { FastifyPluginAsync } from "fastify";
import type { LedgerService } from "../services/ledger.js";
import {
  createActionBody,
  attachTxBody,
  cancelBody,
  listQuery,
  idempotencyKeySchema
} from "../schemas/actions.js";
import { AppError } from "../errors.js";

function serialize(row: Awaited<ReturnType<LedgerService["getAction"]>>) {
  if (!row) return null;
  return {
    id: row.id,
    idempotency_key: row.idempotencyKey,
    wallet_address: row.walletAddress,
    action_type: row.actionType,
    action_payload: row.actionPayload,
    status: row.status,
    tx_hash: row.txHash,
    soroban_event_id: row.sorobanEventId,
    correlation_id: row.correlationId,
    error_code: row.errorCode,
    error_detail: row.errorDetail,
    retry_count: row.retryCount,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
    submitted_at: row.submittedAt,
    confirmed_at: row.confirmedAt,
    redacted_at: row.redactedAt
  };
}

export const actionsRoutes = (svc: LedgerService): FastifyPluginAsync =>
  async (app) => {
    app.post("/actions", async (req, reply) => {
      const keyHeader = req.headers["idempotency-key"];
      const keyRaw = Array.isArray(keyHeader) ? keyHeader[0] : keyHeader;
      const keyParsed = idempotencyKeySchema.safeParse(keyRaw);
      if (!keyParsed.success) {
        return reply.status(400).send({
          code: "INVALID_PAYLOAD",
          message: "Idempotency-Key header must be a UUID"
        });
      }
      const body = createActionBody.parse(req.body);

      const existing = await svc.findByIdempotencyKey(keyParsed.data);
      const result = await svc.createAction({
        idempotencyKey: keyParsed.data,
        walletAddress: body.wallet_address,
        actionType: body.action_type,
        actionPayload: body.action_payload
      });
      reply.status(existing ? 200 : 201);
      return serialize(result);
    });

    app.patch<{ Params: { id: string } }>("/actions/:id/submitted", async (req) => {
      const body = attachTxBody.parse(req.body);
      const result = await svc.attachTxHash(req.params.id, body.tx_hash);
      return serialize(result);
    });

    app.post<{ Params: { id: string } }>("/actions/:id/cancel", async (req) => {
      const body = cancelBody.parse(req.body);
      const result = await svc.cancelAction(req.params.id, body.error_code, body.error_detail);
      return serialize(result);
    });

    app.get<{ Params: { id: string } }>("/actions/:id", async (req) => {
      const row = await svc.getAction(req.params.id);
      if (!row) throw AppError.notFound(`action ${req.params.id} not found`);
      return serialize(row);
    });

    app.get("/actions", async (req) => {
      const q = listQuery.parse(req.query);
      const result = await svc.listActions({
        walletAddress: q.wallet,
        status: q.status,
        cursor: q.cursor,
        limit: q.limit
      });
      return {
        items: result.items.map(serialize),
        next_cursor: result.nextCursor
      };
    });
  };
