import type { PrismaClient } from "@prisma/client";

export interface SweepOrphansOptions {
  ttlMinutes?: number;
}

export interface SweepOrphansResult {
  swept: number;
  orphaned: number;
  prunedEvents: number;
}

export async function sweepOrphans(
  prisma: PrismaClient,
  options: SweepOrphansOptions = {}
): Promise<SweepOrphansResult> {
  const ttlMinutes = options.ttlMinutes ?? 10;
  const cutoff = new Date(Date.now() - ttlMinutes * 60 * 1000);

  const orphaned = await prisma.actionLedger.updateMany({
    where: {
      status: "submitted",
      updatedAt: { lt: cutoff }
    },
    data: {
      status: "orphaned" as any,
      errorCode: "ORPHAN_TTL_EXPIRED"
    }
  });

  const prunedEvents = await prisma.pendingEvent.deleteMany({
    where: {
      receivedAt: { lt: new Date(Date.now() - 60 * 60 * 1000) },
      consumedAt: null
    }
  });

  return {
    swept: orphaned.count + prunedEvents.count,
    orphaned: orphaned.count,
    prunedEvents: prunedEvents.count
  };
}
