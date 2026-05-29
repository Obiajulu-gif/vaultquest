import type { FastifyPluginAsync } from "fastify";
import type { LedgerService } from "../services/ledger.js";
import {
  createActionBody,
  attachTxBody,
  cancelBody,
  listQuery,
  dashboardQuery,
  idempotencyKeySchema
} from "../schemas/actions.js";
import { AppError } from "../errors.js";
import { ok, page } from "../responses.js";
import { assertWalletOwnership, getRequestWallet } from "../middleware/wallet-auth.js";

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
    // POST /actions — wallet in body must match X-Wallet-Address header.
    app.post("/actions", async (req, reply) => {
      const keyHeader = req.headers["idempotency-key"];
      const keyRaw = Array.isArray(keyHeader) ? keyHeader[0] : keyHeader;
      const keyParsed = idempotencyKeySchema.safeParse(keyRaw);
      if (!keyParsed.success) {
        return reply.status(400).send({
          error: {
            code: "INVALID_PAYLOAD",
            message: "Idempotency-Key header must be a UUID",
            issues: keyParsed.error.issues
          }
        });
      }
      const body = createActionBody.parse(req.body);
      assertWalletOwnership(req, body.wallet_address);

      const existing = await svc.findByIdempotencyKey(keyParsed.data);
      const result = await svc.createAction({
        idempotencyKey: keyParsed.data,
        walletAddress: body.wallet_address,
        actionType: body.action_type,
        actionPayload: body.action_payload
      });
      reply.status(existing ? 200 : 201);
      return ok(serialize(result));
    });

    // PATCH /actions/:id/submitted — caller must own the action.
    app.patch<{ Params: { id: string } }>("/actions/:id/submitted", async (req) => {
      const row = await svc.getAction(req.params.id);
      if (!row) throw AppError.notFound(`action ${req.params.id} not found`);
      assertWalletOwnership(req, row.walletAddress);
      const body = attachTxBody.parse(req.body);
      const result = await svc.attachTxHash(req.params.id, body.tx_hash);
      return ok(serialize(result));
    });

    // POST /actions/:id/cancel — caller must own the action.
    app.post<{ Params: { id: string } }>("/actions/:id/cancel", async (req) => {
      const row = await svc.getAction(req.params.id);
      if (!row) throw AppError.notFound(`action ${req.params.id} not found`);
      assertWalletOwnership(req, row.walletAddress);
      const body = cancelBody.parse(req.body);
      const result = await svc.cancelAction(req.params.id, body.error_code, body.error_detail);
      return ok(serialize(result));
    });

    // GET /actions/:id — caller must own the action.
    app.get<{ Params: { id: string } }>("/actions/:id", async (req) => {
      const row = await svc.getAction(req.params.id);
      if (!row) throw AppError.notFound(`action ${req.params.id} not found`);
      assertWalletOwnership(req, row.walletAddress);
      return ok(serialize(row));
    });

    // GET /actions — wallet query param must match X-Wallet-Address.
    app.get("/actions", async (req) => {
      const q = listQuery.parse(req.query);
      assertWalletOwnership(req, q.wallet);
      const result = await svc.listActions({
        walletAddress: q.wallet,
        status: q.status,
        cursor: q.cursor,
        limit: q.limit
      });
      return page(result.items.map(serialize), { nextCursor: result.nextCursor, limit: q.limit });
    });

    // DELETE /actions — wallet query param must match X-Wallet-Address.
    app.delete("/actions", async (req) => {
      const wallet = (req.query as Record<string, string | undefined>).wallet;
      if (!wallet || wallet.length === 0) {
        return ok({ scrubbed: 0 });
      }
      assertWalletOwnership(req, wallet);
      return ok(await svc.scrubWallet(wallet));
    });

    /**
     * GET /dashboard/summary?wallet=...&stale_after_ms=...
     * Wallet query param must match X-Wallet-Address.
     */
    app.get("/dashboard/summary", async (req) => {
      const q = dashboardQuery.parse(req.query);
      assertWalletOwnership(req, q.wallet);
      const summary = await svc.getDashboardSummary(q.wallet, {
        staleAfterMs: q.stale_after_ms
      });
      return ok({
        wallet_address: summary.walletAddress,
        total_actions: summary.totalActions,
        by_status: summary.byStatus,
        pending_tx_hashes: summary.pendingTxHashes,
        is_stale: summary.isStale,
        latest_activity_at: summary.latestActivityAt,
        latest_confirmed_at: summary.latestConfirmedAt
      });
    });
  };
