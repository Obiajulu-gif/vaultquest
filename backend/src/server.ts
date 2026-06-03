import { buildApp } from "./app.js";
import { getEnv } from "./env.js";
import { getPrisma } from "./db.js";
import { createLogger } from "./logger.js";
import { startReconcilerCron, startQuestCron, startIndexerCron } from "./cron.js";
import { CacheService } from "./services/cacheService.js";
import { LedgerService } from "./services/ledger.js";
import {
  StellarIndexer,
  SorobanRpcEventSource,
  defaultXdrDecoder
} from "./services/stellarIndexer.js";
import type { ScheduledTask } from "node-cron";

const env = getEnv();
const logger = createLogger(env.LOG_LEVEL);
const prisma = getPrisma(env.DATABASE_URL);

// Initialize Cache Service (pointing to REDIS_URL if set, otherwise defaults to local Redis)
const cacheService = new CacheService(prisma, logger, process.env.REDIS_URL);

const app = buildApp({
  prisma,
  internalSecret: env.INTERNAL_SERVICE_SECRET,
  logger,
  cacheService
});

// Periodic write-behind sync task: sync checkpoint from cache to PostgreSQL database every 15 seconds
const cacheSyncInterval = setInterval(async () => {
  try {
    await cacheService.syncCheckpointToDb();
  } catch (err) {
    logger.error({ err }, "failed to sync indexer checkpoint from cache");
  }
}, 15000);
cacheSyncInterval.unref();

const cronTask = startReconcilerCron({
  prisma,
  ttlMinutes: env.ORPHAN_TTL_MINUTES,
  logger
});

const questCronTask = startQuestCron({ prisma, logger });

// Stellar indexer daemon (#indexer). Only started when a Soroban RPC endpoint
// and at least one contract id are configured.
let indexerCronTask: ScheduledTask | undefined;
if (env.SOROBAN_RPC_URL && env.INDEXER_CONTRACT_IDS) {
  const contractIds = env.INDEXER_CONTRACT_IDS.split(",").map((s) => s.trim()).filter(Boolean);
  const indexer = new StellarIndexer({
    ledger: new LedgerService(prisma, cacheService),
    source: new SorobanRpcEventSource({ rpcUrl: env.SOROBAN_RPC_URL, contractIds }),
    decoder: defaultXdrDecoder,
    logger
  });
  indexerCronTask = startIndexerCron({ prisma, indexer, logger });
  logger.info({ contractIds }, "stellar indexer daemon started");
}

async function shutdown(signal: string) {
  logger.info({ signal }, "shutting down");
  clearInterval(cacheSyncInterval);
  cronTask.stop();
  questCronTask.stop();
  indexerCronTask?.stop();
  await app.close();
  await cacheService.disconnect();
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
