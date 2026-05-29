import type { PrismaClient } from "@prisma/client";

export type SavedPoolRecord = {
  id: string;
  walletAddress: string;
  poolId: string;
  poolName: string;
  status: string;
  tvl: string;
  asset: string;
  participantCount: number;
  expectedYield: string;
  prize: string | null;
  opensAt: Date | null;
  locksAt: Date | null;
  drawsAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type SavedPoolInput = {
  walletAddress: string;
  pool: {
    poolId: string;
    poolName: string;
    status: string;
    tvl: string;
    asset: string;
    participantCount: number;
    expectedYield: string;
    prize?: string | null;
    opensAt?: Date | null;
    locksAt?: Date | null;
    drawsAt?: Date | null;
  };
};

export class SavedPoolsService {
  constructor(private readonly prisma: PrismaClient) {}

  async savePool(input: SavedPoolInput): Promise<{ record: SavedPoolRecord; created: boolean }> {
    const where = {
      walletAddress_poolId: {
        walletAddress: input.walletAddress,
        poolId: input.pool.poolId
      }
    };
    const existing = await this.prisma.savedPool.findUnique({ where });
    const record = existing
      ? await this.prisma.savedPool.update({
          where,
          data: {
            poolName: input.pool.poolName,
            status: input.pool.status,
            tvl: input.pool.tvl,
            asset: input.pool.asset,
            participantCount: input.pool.participantCount,
            expectedYield: input.pool.expectedYield,
            prize: input.pool.prize ?? null,
            opensAt: input.pool.opensAt ?? null,
            locksAt: input.pool.locksAt ?? null,
            drawsAt: input.pool.drawsAt ?? null
          }
        })
      : await this.prisma.savedPool.create({
          data: {
            walletAddress: input.walletAddress,
            poolId: input.pool.poolId,
            poolName: input.pool.poolName,
            status: input.pool.status,
            tvl: input.pool.tvl,
            asset: input.pool.asset,
            participantCount: input.pool.participantCount,
            expectedYield: input.pool.expectedYield,
            prize: input.pool.prize ?? null,
            opensAt: input.pool.opensAt ?? null,
            locksAt: input.pool.locksAt ?? null,
            drawsAt: input.pool.drawsAt ?? null
          }
        });

    return { record: record as SavedPoolRecord, created: !existing };
  }

  async unsavePool(walletAddress: string, poolId: string): Promise<number> {
    const result = await this.prisma.savedPool.deleteMany({
      where: { walletAddress, poolId }
    });
    return result.count;
  }

  async listSavedPools(walletAddress: string): Promise<SavedPoolRecord[]> {
    const rows = await this.prisma.savedPool.findMany({
      where: { walletAddress },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }]
    });
    return rows as SavedPoolRecord[];
  }
}
