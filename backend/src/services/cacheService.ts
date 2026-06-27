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