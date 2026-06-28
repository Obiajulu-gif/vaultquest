/**
 * Coordinates settlement flows between vaults, winners, and savers.
 *
 * Uses external signing/submission dependencies to broadcast transactions.
 */

export interface AssembleInput {
  to: string;
  from?: string;
  sequence?: string;
  amount: string;
  asset: string;
}

export interface PreparedTransaction {
  xdr: string;
  to: string;
  sequence: string;
}

export interface SubmitResult {
  hash: string;
  status?: string;
}

/**
 * Determines whether a settlement error is safely retryable.
 *
 * @param reason - Failure reason string
 * @returns True if the operation may be retried
 */
function isRetryable(reason: string | undefined): boolean {
  if (!reason) return false;
  const normalized = reason.toLowerCase();
  return (
    normalized.includes("timeout") ||
    normalized.includes("network") ||
    normalized.includes("try again")
  );
}

export interface EscrowServiceDeps {
  loadSequence(account: string): Promise<string>;
  sign(xdr: string, networkPassphrase: string): Promise<string>;
  assemble(input: AssembleInput): Promise<PreparedTransaction>;
  submit(signedXdr: string): Promise<SubmitResult>;
}

/**
 * Builds, signs, and submits vault settlement transactions.
 */
export class EscrowService {
  constructor(private deps: EscrowServiceDeps) {}

  /**
   * Executes a full settlement workflow for a vault, including prize payouts
   * and refunds where applicable.
   *
   * @param input - Settlement parameters
   * @returns Settlement outcome metadata
   */
  async settleVault(input: {
    vaultId: string;
    networkPassphrase: string;
    payouts: { to: string; amount: string; asset: string }[];
  }) {
    // Placeholder: orchestrate multiple assemble/sign/submit calls
    const sequence = await this.deps.loadSequence(input.vaultId);
    const results: SubmitResult[] = [];
    for (const payout of input.payouts) {
      const prepared = await this.deps.assemble({
        to: payout.to,
        amount: payout.amount,
        asset: payout.asset,
        sequence,
      });
      const signed = await this.deps.sign(prepared.xdr, input.networkPassphrase);
      const result = await this.deps.submit(signed);
      results.push(result);
    }
    return { vaultId: input.vaultId, results };
  }

  /**
   * Looks up the latest settlement state for a vault.
   *
   * @param vaultId - Target vault identifier
   * @returns Settlement record or undefined
   */
  async getSettlement(vaultId: string) {
    // TODO: return persisted settlement state from DB
    return { vaultId, settledAt: new Date() };
  }
}