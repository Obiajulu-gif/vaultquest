import { buildApp } from "./app.js";
import { env } from "./env.js";
import { getPrisma } from "./db.js";
import { createLogger } from "./logger.js";
import { startReconcilerCron } from "./cron.js";

const logger = createLogger(env.LOG_LEVEL);
const prisma = getPrisma(env.DATABASE_URL);
const app = buildApp({ prisma, internalSecret: env.INTERNAL_SERVICE_SECRET });

const cronTask = startReconcilerCron({
  prisma,
  ttlMinutes: env.ORPHAN_TTL_MINUTES,
  logger
});

async function shutdown(signal: string) {
  logger.info({ signal }, "shutting down");
  cronTask.stop();
  await app.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

app
  .listen({ port: env.PORT, host: "0.0.0.0" })
  .then((addr) => logger.info({ addr }, "listening"))
  .catch((err) => {
    logger.error({ err }, "failed to start");
    process.exit(1);
  });
