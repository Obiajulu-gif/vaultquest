import type { PrismaClient } from "@prisma/client";

/**
 * Persists user-saved vault/pool references for quick access and watchlists.
 */

export interface SavedPoolInput {
  walletAddress: string;
  poolId: string;
}

export interface SavedPoolRecord {
  walletAddress: string;
  poolId: string;
  createdAt: Date;
}

/**
 * Manages saved pool records linked to user wallets.
 */
export class SavedPoolsService {
  /**
   * @param prisma - Prisma client for database access
   */
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Saves a pool reference for a wallet if not already saved.
   *
   * @param input - Wallet and pool identifiers
   * @returns The saved record and whether it was newly created
   */
  async savePool(input: SavedPoolInput): Promise<{ record: SavedPoolRecord; created: boolean }> {
    const existing = await this.prisma.savedPool.findUnique({
      where: {
        walletAddress_poolId: {
          walletAddress: input.walletAddress,
          poolId: input.poolId,
        },
      },
    });

    if (existing) {
      return { record: existing as unknown as SavedPoolRecord, created: false };
    }

    const created = await this.prisma.savedPool.create({
      data: {
        walletAddress: input.walletAddress,
        poolId: input.poolId,
      },
    });

    return { record: created as unknown as SavedPoolRecord, created: true };
  }

  /**
   * Removes a saved pool reference for a wallet.
   *
   * @param walletAddress - Wallet identifier
   * @param poolId - Pool identifier
   * @returns Number of records removed
   */
  async unsavePool(walletAddress: string, poolId: string): Promise<number> {
    const result = await this.prisma.savedPool.deleteMany({
      where: { walletAddress, poolId },
    });
    return result.count;
  }

  /**
   * Lists all saved pools for a wallet.
   *
   * @param walletAddress - Wallet identifier
   * @returns Saved pool records
   */
  async listSavedPools(walletAddress: string): Promise<SavedPoolRecord[]> {
    const rows = await this.prisma.savedPool.findMany({
      where: { walletAddress },
      orderBy: { createdAt: "desc" },
    });

    return rows as unknown as SavedPoolRecord[];
  }
}