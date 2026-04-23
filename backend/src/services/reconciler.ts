import type { PrismaClient } from "@prisma/client";
import { ERROR_CODES } from "../constants.js";

export type SweepResult = { orphaned: number; prunedEvents: number };

export async function sweepOrphans(
  prisma: PrismaClient,
  opts: { ttlMinutes: number }
): Promise<SweepResult> {
  const cutoff = new Date(Date.now() - opts.ttlMinutes * 60 * 1000);

  const stuck = await prisma.actionLedger.findMany({
    where: { status: "submitted", updatedAt: { lt: cutoff } },
    select: { id: true }
  });

  if (stuck.length > 0) {
    await prisma.actionLedger.updateMany({
      where: { id: { in: stuck.map((r) => r.id) } },
      data: { status: "orphaned", errorCode: ERROR_CODES.ORPHAN_TTL_EXPIRED }
    });
  }

  const pruneCutoff = new Date(Date.now() - 60 * 60 * 1000);
  const pruned = await prisma.pendingEvent.deleteMany({
    where: { receivedAt: { lt: pruneCutoff }, consumedAt: null }
  });

  return { orphaned: stuck.length, prunedEvents: pruned.count };
}
