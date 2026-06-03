/**
 * Savings Service (#settlement)
 *
 * Orchestrates the conclusion of savings periods. When a period or quest ends
 * it decides how each vault should settle (release winnings, distribute a
 * prize pool, or refund principal) and drives the on-chain payout through the
 * {@link EscrowService} pipeline.
 *
 * This layer is intentionally thin: all chain interaction, retry and rollback
 * logic lives in EscrowService. Here we only translate "the period concluded"
 * into a sequence of vault settlements and report aggregate results.
 */

import type { EscrowService, SettlementOutcome } from "./escrowService.js";
import type { SettlementType } from "../constants.js";

export interface VaultPayout {
  vaultId: string;
  settlementType: SettlementType;
  recipient?: string;
  amount?: string;
}

export interface SettlePeriodResult {
  total: number;
  resolved: number;
  refunded: number;
  unresolved: number;
  outcomes: SettlementOutcome[];
}

export class SavingsService {
  constructor(private readonly escrow: EscrowService) {}

  /**
   * Settles every vault for a concluded savings period. Each vault is settled
   * independently; a single failure rolls only that vault back to
   * `Unresolved` (handled inside EscrowService) and never aborts the batch.
   */
  async settleConcludedPeriod(payouts: VaultPayout[]): Promise<SettlePeriodResult> {
    const outcomes: SettlementOutcome[] = [];

    for (const payout of payouts) {
      const outcome = await this.escrow.settleVault(payout);
      outcomes.push(outcome);
    }

    return {
      total: outcomes.length,
      resolved: outcomes.filter((o) => o.state === "Resolved").length,
      refunded: outcomes.filter((o) => o.state === "Refunded").length,
      unresolved: outcomes.filter((o) => o.state === "Unresolved").length,
      outcomes
    };
  }

  /** Settles a single winning vault by releasing its balance to the winner. */
  async releaseToWinner(
    vaultId: string,
    winner: string,
    amount: string
  ): Promise<SettlementOutcome> {
    return this.escrow.settleVault({
      vaultId,
      settlementType: "release",
      recipient: winner,
      amount
    });
  }

  /** Refunds a vault's principal back to the saver when a quest is not met. */
  async refundSaver(vaultId: string, saver: string, amount: string): Promise<SettlementOutcome> {
    return this.escrow.settleVault({
      vaultId,
      settlementType: "refund",
      recipient: saver,
      amount
    });
  }
}
