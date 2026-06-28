/**
 * In-memory caching layer for frequently requested on-chain and indexer data.
 *
 * Stores pending events, indexer checkpoints, and protocol config with LRU eviction.
 */

export interface IndexerCheckpoint {
  id?: string;
  latestLedger: number;
  lastSyncTime: Date;
  lastSuccessSyncTime?: Date;
  lastError?: string | null;
}

export interface PendingEvent {
  txHash: string;
  sorobanEventId: string;
  eventPayload: unknown;
  statusHint: "confirmed" | "reverted";
  receivedAt: Date;
  consumedAt?: Date | null;
}

export interface AssetMetadata {
  asset: string;
  decimals: number;
  lastUpdated: Date;
}

export interface ProtocolConfigRecord {
  key: string;
  value: unknown;
  updatedAt: Date;
}

type CacheEntry<T> = { value: T; accessedAt: Date };

/**
 * Minimal in-memory LRU cache service for hot data.
 */
export class CacheService {
  private readonly pendingMap = new Map<string, CacheEntry<PendingEvent>>();
  private readonly assetMap = new Map<string, CacheEntry<AssetMetadata>>();
  private readonly configMap = new Map<string, CacheEntry<ProtocolConfigRecord>>();
  private checkpoint: CacheEntry<IndexerCheckpoint | null> = { value: null, accessedAt: new Date() };
  private readonly maxEntries: number;

  /**
   * @param maxEntries - Maximum number of entries per cache map before eviction
   */
  constructor(maxEntries = 500) {
    this.maxEntries = maxEntries;
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
            lastProcessedEventId: parsed.lastProcessedEventId ?? null,
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
    lastProcessedEventId: string | null;
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
            lastProcessedEventId: checkpoint.lastProcessedEventId,
            lastSyncTime: checkpoint.lastSyncTime.toISOString(),
            lastSuccessSyncTime: checkpoint.lastSuccessSyncTime.toISOString(),
            lastError: checkpoint.lastError
          })
        );
        await this.redis.set("indexer:checkpoint:dirty", "true");
        return;
      } catch (err) {
        this.logger.warn({ err }, "Redis setCheckpoint failed, writing directly to database");
  // --- helpers ---

  private touch<K, V>(map: Map<K, CacheEntry<V>>, key: K, value: V): void {
    const now = new Date();
    map.set(key, { value, accessedAt: now });
    this.evictIfNeeded(map);
  }

  private evictIfNeeded<K, V>(map: Map<K, CacheEntry<V>>): void {
    if (map.size <= this.maxEntries) return;
    let oldestKey: K | undefined;
    let oldest = new Date(map.size ? Infinity : 0);
    for (const [k, entry] of map.entries()) {
      if (entry.accessedAt < oldest) {
        oldest = entry.accessedAt;
        oldestKey = k;
      }
    }
    if (oldestKey !== undefined) map.delete(oldestKey);
  }

    // Fallback direct DB write
    await this.prisma.indexerCheckpoint.upsert({
      where: { id: "singleton" },
        create: {
          id: "singleton",
          latestLedger: checkpoint.latestLedger,
          lastProcessedEventId: checkpoint.lastProcessedEventId,
          lastSyncTime: checkpoint.lastSyncTime,
          lastError: checkpoint.lastError,
          lastSuccessSyncTime: checkpoint.lastSuccessSyncTime
        },
        update: {
          latestLedger: checkpoint.latestLedger,
          lastProcessedEventId: checkpoint.lastProcessedEventId,
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
            lastProcessedEventId: parsed.lastProcessedEventId ?? null,
            lastSyncTime: new Date(parsed.lastSyncTime),
            lastError: parsed.lastError,
            lastSuccessSyncTime: new Date(parsed.lastSuccessSyncTime)
          },
          update: {
            latestLedger: parsed.latestLedger,
            lastProcessedEventId: parsed.lastProcessedEventId ?? null,
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
  // --- pending events ---

  /**
   * Retrieves a pending event by transaction hash.
   *
   * @param txHash - On-chain transaction hash
   * @returns Pending event or null if absent
   */
  async getPendingEvent(txHash: string): Promise<PendingEvent | null> {
    const entry = this.pendingMap.get(txHash);
    if (!entry) return null;
    entry.accessedAt = new Date();
    return entry.value;
  }

  /**
   * Stores or updates a pending event.
   *
   * @param event - Pending event payload
   */
  async setPendingEvent(event: PendingEvent): Promise<void> {
    this.touch(this.pendingMap, event.txHash, event);
  }

  /**
   * Removes a pending event from cache after reconciliation.
   *
   * @param txHash - Transaction hash to remove
   */
  async deletePendingEvent(txHash: string): Promise<void> {
    this.pendingMap.delete(txHash);
  }

  // --- indexer checkpoint ---

  /**
   * Gets the cached indexer checkpoint.
   *
   * @returns Checkpoint or null if none cached
   */
  async getCheckpoint(): Promise<IndexerCheckpoint | null> {
    this.checkpoint.accessedAt = new Date();
    return this.checkpoint.value;
  }

  /**
   * Updates the cached indexer checkpoint.
   *
   * @param checkpoint - New checkpoint state
   */
  async setCheckpoint(checkpoint: IndexerCheckpoint): Promise<void> {
    this.checkpoint = { value: checkpoint, accessedAt: new Date() };
  }

  // --- asset metadata ---

  /**
   * Retrieves cached asset metadata by asset code.
   *
   * @param asset - Asset code or `native` for XLM
   * @returns Cached metadata or null
   */
  async getAssetMetadata(asset: string): Promise<AssetMetadata | null> {
    const entry = this.assetMap.get(asset);
    if (!entry) return null;
    entry.accessedAt = new Date();
    return entry.value;
  }

  /**
   * Caches asset metadata.
   *
   * @param metadata - Asset metadata record
   */
  async setAssetMetadata(metadata: AssetMetadata): Promise<void> {
    this.touch(this.assetMap, metadata.asset, metadata);
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

  // --- protocol config ---

  /**
   * Reads a cached protocol config value by key.
   *
   * @param key - Config key
   * @returns Cached config record or null
   */
  async getProtocolConfig(key: string): Promise<ProtocolConfigRecord | null> {
    const entry = this.configMap.get(key);
    if (!entry) return null;
    entry.accessedAt = new Date();
    return entry.value;
  }

  /**
   * Writes a protocol config record to cache.
   *
   * @param record - Config record
   */
  async setProtocolConfig(record: ProtocolConfigRecord): Promise<void> {
    this.touch(this.configMap, record.key, record);
  }

  /**
   * Invalidates protocol config by key when underlying config changes.
   *
   * @param key - Config key to evict
   */
  async invalidateProtocolConfig(key: string): Promise<void> {
    this.configMap.delete(key);
  }

  /**
   * Resets all caches (context: config refresh/restart).
   */
  async reset(): Promise<void> {
    this.pendingMap.clear();
    this.assetMap.clear();
    this.configMap.clear();
    this.checkpoint = { value: null, accessedAt: new Date() };
  }

  /**
   * Placeholder disconnect hook if future implementation adds external connections.
   */
  async disconnect(): Promise<void> {
    this.reset();
  }
}