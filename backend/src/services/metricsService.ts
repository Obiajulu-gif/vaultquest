import type { PrismaClient } from "@prisma/client";

export class MetricsService {
  constructor(private prisma: PrismaClient) {}

  async getProtocolSummary() {
    // Total vault deposits and active participants can be aggregated from SavedPools
    const pools = await this.prisma.savedPool.findMany({
      where: { status: "active" }
    });

    let totalDeposits = 0;
    let activeParticipants = 0;

    for (const pool of pools) {
      totalDeposits += parseFloat(pool.tvl || "0");
      activeParticipants += pool.participantCount || 0;
    }

    return {
      totalVaultDeposits: totalDeposits,
      activeParticipants,
      totalVaults: pools.length
    };
  }

  async getCurrentRoundStatus() {
    // Mocked for now, depending on on-chain data
    return {
      roundNumber: 42,
      status: "active",
      drawDate: new Date(Date.now() + 86400 * 1000).toISOString(),
      prizePool: "5000.00"
    };
  }

  async getHistoricalSummary() {
    // Historical stats could be aggregated from ActionLedger
    const actionCount = await this.prisma.actionLedger.count();
    
    return {
      totalActions: actionCount,
      roundsCompleted: 41,
      totalPrizesDistributed: "150000.00"
    };
  }
}
