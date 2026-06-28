/**
 * Background batch jobs for ledger hygiene.
 *
 * `sweepOrphans` runs on a cron schedule (see `src/cron.ts`) and:
 *   1. Marks `submitted` actions whose `updatedAt` is older than `ttlMinutes`
 *      as `orphaned` (they have been broadcasting too long with no confirmation).
 *   2. Prunes unconsumed `pending_events` older than 1 hour (events that
 *      arrived from the indexer but whose matching intent was never attached).
 */

import type { PrismaClient } from "@prisma/client";
import { ERROR_CODES } from "../constants.js";

export interface SweepResult {
  /** Number of submitted actions promoted to orphaned. */
  orphaned: number;
  /** Number of stale pending_events rows deleted. */
  prunedEvents: number;
}

/**
 * Sweeps the action ledger and pending events table for stale records.
 *
 * @param prisma     - Prisma client
 * @param opts.ttlMinutes - Submitted actions older than this are orphaned.
 */
export async function sweepOrphans(
  prisma: PrismaClient,
  opts: { ttlMinutes: number }
): Promise<SweepResult> {
  const cutoff = new Date(Date.now() - opts.ttlMinutes * 60 * 1000);
  const eventCutoff = new Date(Date.now() - 60 * 60 * 1000); // 1 hour

  // ── 1. Orphan stale submitted actions ─────────────────────────────────────
  const staleActions = await prisma.actionLedger.findMany({
    where: {
      status: "submitted",
      updatedAt: { lt: cutoff }
    },
    select: { id: true }
  });

  let orphaned = 0;
  if (staleActions.length > 0) {
    const result = await prisma.actionLedger.updateMany({
      where: {
        id: { in: staleActions.map((a) => a.id) },
        status: "submitted" // guard against race
      },
      data: {
        status: "orphaned",
        errorCode: ERROR_CODES.ORPHAN_TTL_EXPIRED
      }
    });
    orphaned = result.count;
  }

  // ── 2. Prune stale unconsumed pending_events ───────────────────────────────
  const pruned = await prisma.pendingEvent.deleteMany({
    where: {
      consumedAt: null,
      receivedAt: { lt: eventCutoff }
    }
  });

  return { orphaned, prunedEvents: pruned.count };
}
