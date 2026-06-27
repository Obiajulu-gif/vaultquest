import { Redis } from "ioredis";
import type { PrismaClient, IndexerCheckpoint, PendingEvent } from "@prisma/client";
import type { Logger } from "pino";

export class CacheService {
  private redis: Redis | null = null;
  private isOnline = false;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly logger: Logger,
    redisUrl?: string
  ) {
    const url = redisUrl || process.env.REDIS_URL || "redis://127.0.0.1:6379";
    try {
      this.redis = new Redis(url, {
        maxRetriesPerRequest: 1,
        connectTimeout: 2000,
        reconnectOnError: () => true
      });

      this.redis.on("connect", () => {
        this.logger.info("Redis cache connection established");
        this.isOnline = true;
      });

      this.redis.on("error", (err: any) => {
        this.logger.error({ err }, "Redis connection error - running in PostgreSQL fallback mode");
        this.isOnline = false;
      });
    } catch (err: any) {
      this.logger.error({ err }, "Failed to initialize Redis client - running in PostgreSQL fallback mode");
      this.redis = null;
      this.isOnline = false;
    }
  }

  async getCheckpoint(): Promise<Partial<IndexerCheckpoint> | null> {
    if (this.redis && this.isOnline) {
      try {
        const data = await this.redis.get("indexer:checkpoint");
        if (data) {
          const parsed = JSON.parse(data);
          return {
            id: "singleton",
            latestLedger: parsed.latestLedger,
            lastSyncTime: new Date(parsed.lastSyncTime),
            lastSuccessSyncTime: new Date(parsed.lastSuccessSyncTime),
            lastError: parsed.lastError
          };
        }
      } catch (err) {
        this.logger.warn({ err }, "Redis getCheckpoint failed, falling back to database");
      }
    }
    // Fallback to PostgreSQL
    return this.prisma.indexerCheckpoint.findUnique({ where: { id: "singleton" } });
  }

  async setCheckpoint(checkpoint: {
    latestLedger: number;
    lastSyncTime: Date;
    lastSuccessSyncTime: Date;
    lastError: string | null;
  }): Promise<void> {
    if (this.redis && this.isOnline) {
      try {
        await this.redis.set(
          "indexer:checkpoint",
          JSON.stringify({
            latestLedger: checkpoint.latestLedger,
            lastSyncTime: checkpoint.lastSyncTime.toISOString(),
            lastSuccessSyncTime: checkpoint.lastSuccessSyncTime.toISOString(),
            lastError: checkpoint.lastError
          })
        );
        await this.redis.set("indexer:checkpoint:dirty", "true");
        return;
      } catch (err) {
        this.logger.warn({ err }, "Redis setCheckpoint failed, writing directly to database");
      }
    }

    // Fallback direct DB write
    await this.prisma.indexerCheckpoint.upsert({
      where: { id: "singleton" },
      create: {
        id: "singleton",
        latestLedger: checkpoint.latestLedger,
        lastSyncTime: checkpoint.lastSyncTime,
        lastError: checkpoint.lastError,
        lastSuccessSyncTime: checkpoint.lastSuccessSyncTime
      },
      update: {
        latestLedger: checkpoint.latestLedger,
        lastSyncTime: checkpoint.lastSyncTime,
        lastError: checkpoint.lastError,
        lastSuccessSyncTime: checkpoint.lastSuccessSyncTime
      }
    });
  }

  async syncCheckpointToDb(): Promise<void> {
    if (!this.redis || !this.isOnline) return;
    try {
      const isDirty = await this.redis.get("indexer:checkpoint:dirty");
      if (isDirty !== "true") return;

      const data = await this.redis.get("indexer:checkpoint");
      if (!data) return;

      const parsed = JSON.parse(data);
      await this.prisma.indexerCheckpoint.upsert({
        where: { id: "singleton" },
        create: {
          id: "singleton",
          latestLedger: parsed.latestLedger,
          lastSyncTime: new Date(parsed.lastSyncTime),
          lastError: parsed.lastError,
          lastSuccessSyncTime: new Date(parsed.lastSuccessSyncTime)
        },
        update: {
          latestLedger: parsed.latestLedger,
          lastSyncTime: new Date(parsed.lastSyncTime),
          lastError: parsed.lastError,
          lastSuccessSyncTime: new Date(parsed.lastSuccessSyncTime)
        }
      });
      await this.redis.del("indexer:checkpoint:dirty");
      this.logger.info("Synced indexer checkpoint from Redis to PostgreSQL");
    } catch (err) {
      this.logger.error({ err }, "Failed to sync checkpoint from Redis to PostgreSQL");
    }
  }

  async getPendingEvent(txHash: string): Promise<Partial<PendingEvent> | null> {
    if (this.redis && this.isOnline) {
      try {
        const data = await this.redis.get(`pending_event:${txHash}`);
        if (data) {
          const parsed = JSON.parse(data);
          return {
            txHash,
            sorobanEventId: parsed.sorobanEventId,
            eventPayload: parsed.eventPayload,
            statusHint: parsed.statusHint,
            receivedAt: new Date(parsed.receivedAt),
            consumedAt: parsed.consumedAt ? new Date(parsed.consumedAt) : null
          };
        }
      } catch (err) {
        this.logger.warn({ err }, "Redis getPendingEvent failed, falling back to database");
      }
    }
    // Fallback to PostgreSQL
    return this.prisma.pendingEvent.findUnique({ where: { txHash } });
  }

  async setPendingEvent(event: {
    txHash: string;
    sorobanEventId: string;
    eventPayload: unknown;
    statusHint: string;
    receivedAt?: Date;
    consumedAt?: Date | null;
  }): Promise<void> {
    // Write-through to PostgreSQL database
    await this.prisma.pendingEvent.upsert({
      where: { txHash: event.txHash },
      create: {
        txHash: event.txHash,
        sorobanEventId: event.sorobanEventId,
        eventPayload: event.eventPayload as object,
        statusHint: event.statusHint,
        receivedAt: event.receivedAt ?? new Date(),
        consumedAt: event.consumedAt ?? null
      },
      update: {
        sorobanEventId: event.sorobanEventId,
        eventPayload: event.eventPayload as object,
        statusHint: event.statusHint,
        consumedAt: event.consumedAt ?? undefined
      }
    });

    if (this.redis && this.isOnline) {
      try {
        if (!event.consumedAt) {
          // Cache active pending events with 1 hour TTL
          await this.redis.set(
            `pending_event:${event.txHash}`,
            JSON.stringify({
              sorobanEventId: event.sorobanEventId,
              eventPayload: event.eventPayload,
              statusHint: event.statusHint,
              receivedAt: (event.receivedAt ?? new Date()).toISOString(),
              consumedAt: null
            }),
            "EX",
            3600
          );
        } else {
          // Remove consumed pending events from cache
          await this.redis.del(`pending_event:${event.txHash}`);
        }
      } catch (err) {
        this.logger.warn({ err }, "Failed to write pending event to Redis cache");
      }
    }
  }

  async deletePendingEvent(txHash: string): Promise<void> {
    if (this.redis && this.isOnline) {
      try {
        await this.redis.del(`pending_event:${txHash}`);
      } catch (err) {
        this.logger.warn({ err }, "Failed to delete pending event from Redis cache");
      }
    }
  }

  async getOrSet<T>(key: string, ttlSeconds: number, fetch: () => Promise<T>): Promise<T> {
    if (this.redis && this.isOnline) {
      try {
        const cached = await this.redis.get(key);
        if (cached !== null) {
          return JSON.parse(cached) as T;
        }
      } catch (err: any) {
        this.logger.warn({ err, key }, 'Redis get failed — falling through to source');
      }
    }
    const value = await fetch();
    if (this.redis && this.isOnline) {
      try {
        await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
      } catch (err: any) {
        this.logger.warn({ err, key }, 'Redis set failed — response served uncached');
      }
    }
    return value;
  }

  async invalidate(key: string): Promise<void> {
    if (this.redis && this.isOnline) {
      try {
        await this.redis.del(key);
      } catch (err: any) {
        this.logger.warn({ err, key }, 'Redis invalidate failed');
      }
    }
  }

  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.isOnline = false;
    }
  }
}
