/**
 * Quest Service (#26 backend engine)
 *
 * Automated logic engine that analyses the {@link ActionLedger} history to
 * evaluate and persist savings-quest milestone completions (e.g. "Save $100
 * for 3 months", "Participate in 5 draws").
 *
 * Design notes:
 *  - Historical scans are done with a single aggregating raw SQL query that
 *    rides the `(wallet_address, created_at)` index on `action_ledger`, so a
 *    per-wallet evaluation is a single index range scan (<100ms even with a
 *    large ledger — see tests/quest.spec.ts benchmark).
 *  - Progress is persisted into the `user_quests` table (one row per
 *    wallet/quest) and only written when it actually changes, keeping the
 *    incremental updates cheap.
 *  - `evaluateRecent()` is the cron entry point: it finds wallets whose
 *    confirmed ledger entries changed since the last sweep and re-evaluates
 *    only those, so new logs trigger incremental progress updates.
 */

import type { PrismaClient, Prisma } from "@prisma/client";

export type QuestMetricKey =
  | "totalDeposited"
  | "depositCount"
  | "distinctPools"
  | "distinctMonths"
  | "claimCount";

export interface QuestDefinition {
  /** Stable identifier persisted in `user_quests.quest_id`. */
  id: string;
  title: string;
  description: string;
  /** Aggregated ledger metric this quest is measured against. */
  metric: QuestMetricKey;
  /** Value of `metric` at which the quest is considered complete. */
  target: number;
}

/**
 * The five standard savings quests the engine tracks. Each maps to a metric
 * derived purely from confirmed `action_ledger` rows.
 */
export const STANDARD_QUESTS: readonly QuestDefinition[] = [
  {
    id: "first_deposit",
    title: "First Steps",
    description: "Make your first confirmed deposit.",
    metric: "depositCount",
    target: 1
  },
  {
    id: "save_100",
    title: "Save $100",
    description: "Accumulate $100 in total confirmed deposits.",
    metric: "totalDeposited",
    target: 100
  },
  {
    id: "save_100_three_months",
    title: "Save $100 for 3 Months",
    description: "Deposit in at least three distinct calendar months.",
    metric: "distinctMonths",
    target: 3
  },
  {
    id: "participate_5_draws",
    title: "Participate in 5 Draws",
    description: "Deposit into at least five distinct prize pools.",
    metric: "distinctPools",
    target: 5
  },
  {
    id: "first_win",
    title: "Lucky Saver",
    description: "Claim a reward from a prize draw.",
    metric: "claimCount",
    target: 1
  }
] as const;

export type QuestMetrics = Record<QuestMetricKey, number>;

export interface QuestProgress {
  questId: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  status: "in_progress" | "completed";
  completedAt: Date | null;
}

/** Raw shape returned by the aggregation query (Postgres returns text/bigint). */
type MetricsRow = {
  total_deposited: string | number | null;
  deposit_count: bigint | number | null;
  distinct_pools: bigint | number | null;
  distinct_months: bigint | number | null;
  claim_count: bigint | number | null;
};

function num(value: unknown): number {
  if (value === null || value === undefined) return 0;
  const n = typeof value === "bigint" ? Number(value) : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export class QuestService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly quests: readonly QuestDefinition[] = STANDARD_QUESTS
  ) {}

  /**
   * Computes all quest metrics for a wallet in a single index-backed scan over
   * confirmed ledger rows. The `amount` is read from the JSON payload; both
   * `vault_id` and `pool_id` are accepted as the pool identifier.
   */
  async computeMetrics(walletAddress: string): Promise<QuestMetrics> {
    const rows = await this.prisma.$queryRaw<MetricsRow[]>`
      SELECT
        COALESCE(SUM(
          CASE WHEN action_type = 'deposit'
            THEN COALESCE((action_payload->>'amount')::float8, 0)
            ELSE 0 END
        ), 0)::float8 AS total_deposited,
        COUNT(*) FILTER (WHERE action_type = 'deposit')::int AS deposit_count,
        COUNT(DISTINCT COALESCE(action_payload->>'vault_id', action_payload->>'pool_id'))
          FILTER (WHERE action_type = 'deposit')::int AS distinct_pools,
        COUNT(DISTINCT to_char(created_at, 'YYYY-MM'))
          FILTER (WHERE action_type = 'deposit')::int AS distinct_months,
        COUNT(*) FILTER (WHERE action_type = 'claim')::int AS claim_count
      FROM action_ledger
      WHERE wallet_address = ${walletAddress}
        AND status = 'confirmed'
        AND redacted_at IS NULL
    `;

    const row = rows[0];
    return {
      totalDeposited: num(row?.total_deposited),
      depositCount: num(row?.deposit_count),
      distinctPools: num(row?.distinct_pools),
      distinctMonths: num(row?.distinct_months),
      claimCount: num(row?.claim_count)
    };
  }

  /** Maps raw metrics onto the configured quest definitions. */
  projectProgress(metrics: QuestMetrics): QuestProgress[] {
    return this.quests.map((quest) => {
      const value = metrics[quest.metric];
      const progress = Math.min(value, quest.target);
      const completed = value >= quest.target;
      return {
        questId: quest.id,
        title: quest.title,
        description: quest.description,
        progress,
        target: quest.target,
        status: completed ? "completed" : "in_progress",
        completedAt: null
      };
    });
  }

  /**
   * Evaluates and persists quest progress for a single wallet. Only rows whose
   * progress or status actually changed are written. Returns the current
   * progress snapshot.
   */
  async evaluateWallet(walletAddress: string): Promise<QuestProgress[]> {
    const metrics = await this.computeMetrics(walletAddress);
    const projected = this.projectProgress(metrics);

    const existing = await this.prisma.userQuest.findMany({
      where: { walletAddress }
    });
    const byQuest = new Map(existing.map((q) => [q.questId, q]));

    const now = new Date();
    const results: QuestProgress[] = [];

    for (const p of projected) {
      const prev = byQuest.get(p.questId);
      const justCompleted = p.status === "completed";
      const completedAt =
        justCompleted ? prev?.completedAt ?? now : null;

      const changed =
        !prev ||
        prev.progress !== p.progress ||
        prev.status !== p.status;

      if (changed) {
        await this.prisma.userQuest.upsert({
          where: { walletAddress_questId: { walletAddress, questId: p.questId } },
          create: {
            walletAddress,
            questId: p.questId,
            progress: p.progress,
            target: p.target,
            status: p.status,
            completedAt,
            lastEvaluatedAt: now
          },
          update: {
            progress: p.progress,
            target: p.target,
            status: p.status,
            completedAt,
            lastEvaluatedAt: now
          }
        });
      } else {
        await this.prisma.userQuest.update({
          where: { walletAddress_questId: { walletAddress, questId: p.questId } },
          data: { lastEvaluatedAt: now }
        });
      }

      results.push({ ...p, completedAt });
    }

    return results;
  }

  /**
   * Cron entry point. Finds wallets with confirmed ledger entries updated since
   * `since` and re-evaluates each. Returns the number of wallets processed.
   */
  async evaluateRecent(since: Date, limit = 500): Promise<{ wallets: number }> {
    const rows = await this.prisma.actionLedger.findMany({
      where: { status: "confirmed", updatedAt: { gte: since } },
      select: { walletAddress: true },
      distinct: ["walletAddress"],
      take: limit
    });

    for (const { walletAddress } of rows) {
      await this.evaluateWallet(walletAddress);
    }

    return { wallets: rows.length };
  }

  /** Read model for the frontend quest-tracking UI (#26). */
  async getUserQuests(walletAddress: string): Promise<QuestProgress[]> {
    const rows = await this.prisma.userQuest.findMany({
      where: { walletAddress }
    });
    const byQuest = new Map(rows.map((r) => [r.questId, r]));

    return this.quests.map((quest) => {
      const row = byQuest.get(quest.id);
      return {
        questId: quest.id,
        title: quest.title,
        description: quest.description,
        progress: row?.progress ?? 0,
        target: quest.target,
        status: (row?.status as "in_progress" | "completed") ?? "in_progress",
        completedAt: row?.completedAt ?? null
      };
    });
  }
}

export type { Prisma };
