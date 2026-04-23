import cron from "node-cron";
import type { PrismaClient } from "@prisma/client";
import type { Logger } from "pino";
import { sweepOrphans } from "./services/reconciler.js";

export function startReconcilerCron(opts: {
  prisma: PrismaClient;
  ttlMinutes: number;
  logger: Logger;
  schedule?: string;
}): cron.ScheduledTask {
  const schedule = opts.schedule ?? "*/1 * * * *";
  const task = cron.schedule(schedule, async () => {
    try {
      const result = await sweepOrphans(opts.prisma, { ttlMinutes: opts.ttlMinutes });
      opts.logger.info({ result }, "reconciler sweep complete");
    } catch (err) {
      opts.logger.error({ err }, "reconciler sweep failed");
    }
  });
  return task;
}
