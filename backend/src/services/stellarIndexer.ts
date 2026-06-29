import type { Logger } from "pino";
import type { LedgerService } from "./ledger.js";

export interface RawHorizonEvent {
  id: string;
  ledger: number;
  txHash: string;
  contractId: string;
  topicXdr: string[];
  valueXdr: string;
  successful: boolean;
}

export interface DecodedHorizonEvent {
  type?: string;
  [key: string]: unknown;
}

export interface HorizonEventSource {
  fetchEvents(input: { cursor: string | null; limit: number }): Promise<RawHorizonEvent[]>;
}

export interface SorobanRpcEventSourceOptions {
  rpcUrl: string;
  contractIds: string[];
}

export interface StellarIndexerOptions {
  ledger: LedgerService;
  source: HorizonEventSource;
  decoder?: (event: RawHorizonEvent) => DecodedHorizonEvent;
  logger?: Logger;
  pageSize?: number;
}

/**
 * Minimal event source wrapper for the server's indexer wiring.
 *
 * The production RPC integration can be expanded later; for now the class
 * satisfies the server bootstrap and returns no events when asked to fetch.
 */
export class SorobanRpcEventSource implements HorizonEventSource {
  constructor(private readonly _options: SorobanRpcEventSourceOptions) {}

  async fetchEvents(): Promise<RawHorizonEvent[]> {
    return [];
  }
}

export interface StellarIndexerTickResult {
  processed: number;
  imported: number;
  duplicates: number;
  cursor: string | null;
}

export function defaultXdrDecoder(event: RawHorizonEvent): DecodedHorizonEvent {
  const decodedTopic = decodeBase64(event.topicXdr[0]);
  const decodedValue = decodeBase64(event.valueXdr);
  const payload = parseMaybeJson(decodedValue);

  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    return {
      type: decodedTopic,
      ...payload
    };
  }

  return {
    type: decodedTopic,
    value: payload
  };
}

function decodeBase64(value: string | undefined): string {
  if (!value) return "";
  return Buffer.from(value, "base64").toString("utf8");
}

function parseMaybeJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export class StellarIndexer {
  private cursor: string | null = null;
  private readonly pageSize: number;

  constructor(private readonly opts: StellarIndexerOptions) {
    this.pageSize = opts.pageSize ?? 200;
  }

  setCursor(cursor: string | null): void {
    this.cursor = cursor;
  }

  private async resolveCursor(): Promise<string | null> {
    if (this.cursor !== null) return this.cursor;

    const checkpoint = await this.opts.ledger.getIndexerCheckpoint();
    this.cursor = checkpoint?.lastProcessedEventId ?? null;
    return this.cursor;
  }

  async tick(): Promise<StellarIndexerTickResult> {
    const cursor = await this.resolveCursor();
    const events = await this.opts.source.fetchEvents({
      cursor,
      limit: this.pageSize
    });

    let processed = 0;
    let imported = 0;
    let duplicates = 0;
    let latestLedger = 0;
    let lastCursor = cursor;
    const seenTxHashes = new Set<string>();

    for (const event of events) {
      processed += 1;
      latestLedger = Math.max(latestLedger, event.ledger);
      lastCursor = event.id;

      if (seenTxHashes.has(event.txHash)) {
        duplicates += 1;
        continue;
      }
      seenTxHashes.add(event.txHash);

      const decoded = this.opts.decoder?.(event) ?? defaultXdrDecoder(event);
      const statusHint = event.successful ? "confirmed" : "reverted";
      const result = await this.opts.ledger.reconcileEvent({
        txHash: event.txHash,
        sorobanEventId: event.id,
        eventPayload: decoded,
        statusHint
      });

      if (!result.matched) {
        imported += 1;
      }
    }

    if (processed > 0) {
      await this.opts.ledger.updateIndexerCheckpoint({
        latestLedger: latestLedger || events[events.length - 1]?.ledger || 0,
        lastProcessedEventId: lastCursor,
        success: true
      });
      this.cursor = lastCursor;
    }

    return {
      processed,
      imported,
      duplicates,
      cursor: lastCursor
    };
  }
}
