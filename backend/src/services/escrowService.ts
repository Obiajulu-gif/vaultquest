/**
 * Escrow Service (#settlement)
 *
 * Secure settlement pipeline for concluding savings periods / quests. It
 * assembles, signs (with admin keys) and submits Stellar Horizon transactions
 * that release, distribute or refund a vault's balance.
 *
 * The heavy on-chain primitives (XDR assembly, signing, Horizon submission)
 * are injected via the {@link TransactionAssembler}, {@link AdminSigner} and
 * {@link HorizonGateway} interfaces. The real implementations are backed by
 * `@stellar/stellar-sdk`; this module owns the *pipeline* concerns that the SDK
 * does not: idempotency, retries with backoff on transient RPC errors, and
 * safe rollback of vault state when submission ultimately fails.
 */

import type { PrismaClient } from "@prisma/client";
import {
  RETRYABLE_RESULT_CODES,
  SETTLEMENT_RETRY,
  ERROR_CODES,
  type SettlementType,
  type VaultState
} from "../constants.js";

export interface AssembleInput {
  vaultId: string;
  settlementType: SettlementType;
  /** Single recipient for `release`; payout map handled by the assembler for `distribute`. */
  recipient?: string;
  amount?: string;
  /** Source account sequence number, reloaded on each attempt. */
  sequence: string;
}

export interface PreparedTransaction {
  /** Base64 transaction envelope ready to be signed. */
  xdr: string;
  sourceAccount: string;
  sequence: string;
}

export interface SubmitResult {
  hash: string;
  successful: boolean;
  /** Horizon `result_codes.transaction`, e.g. `tx_success`, `tx_bad_seq`. */
  resultCode?: string;
}

/** Reads chain state needed to build & submit transactions. */
export interface HorizonGateway {
  /** Current sequence number of the settlement source (admin) account. */
  loadSequence(account: string): Promise<string>;
  /** Submits a signed envelope and resolves with the canonical result. */
  submit(signedXdr: string): Promise<SubmitResult>;
}

/** Admin keypair wrapper. The secret never leaves this boundary. */
export interface AdminSigner {
  readonly publicKey: string;
  sign(xdr: string, networkPassphrase: string): Promise<string>;
}

/** Turns settlement intent into an unsigned transaction envelope. */
export interface TransactionAssembler {
  assemble(input: AssembleInput): Promise<PreparedTransaction>;
}

export interface EscrowServiceDeps {
  prisma: PrismaClient;
  horizon: HorizonGateway;
  signer: AdminSigner;
  assembler: TransactionAssembler;
  networkPassphrase: string;
  /** Override for tests; defaults to a real delay. */
  sleep?: (ms: number) => Promise<void>;
}

export interface SettlementOutcome {
  vaultId: string;
  state: VaultState;
  txHash: string | null;
  attempts: number;
  alreadySettled: boolean;
}

const RETRYABLE = new Set(RETRYABLE_RESULT_CODES.map((c) => c.toLowerCase()));

function isRetryable(reason: string | undefined): boolean {
  if (!reason) return false;
  const r = reason.toLowerCase();
  return [...RETRYABLE].some((code) => r.includes(code));
}

export class EscrowService {
  private readonly prisma: PrismaClient;
  private readonly horizon: HorizonGateway;
  private readonly signer: AdminSigner;
  private readonly assembler: TransactionAssembler;
  private readonly networkPassphrase: string;
  private readonly sleep: (ms: number) => Promise<void>;

  constructor(deps: EscrowServiceDeps) {
    this.prisma = deps.prisma;
    this.horizon = deps.horizon;
    this.signer = deps.signer;
    this.assembler = deps.assembler;
    this.networkPassphrase = deps.networkPassphrase;
    this.sleep =
      deps.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  }

  /**
   * Settles a single vault. Idempotent: if the vault is already `Resolved`
   * (with a saved tx hash) the saved outcome is returned without resubmitting.
   * On submission failure the vault is rolled back to `Unresolved`.
   */
  async settleVault(input: {
    vaultId: string;
    settlementType: SettlementType;
    recipient?: string;
    amount?: string;
  }): Promise<SettlementOutcome> {
    const { vaultId, settlementType, recipient, amount } = input;

    // Ensure a settlement row exists and short-circuit if already resolved.
    const existing = await this.prisma.vaultSettlement.findUnique({
      where: { vaultId }
    });

    if (existing && existing.state === "Resolved" && existing.txHash) {
      return {
        vaultId,
        state: "Resolved",
        txHash: existing.txHash,
        attempts: existing.attempts,
        alreadySettled: true
      };
    }

    const settlement = existing
      ? await this.prisma.vaultSettlement.update({
          where: { vaultId },
          data: { state: "Resolving", settlementType, recipient, amount }
        })
      : await this.prisma.vaultSettlement.create({
          data: {
            vaultId,
            state: "Resolving",
            settlementType,
            recipient,
            amount
          }
        });

    const terminalState: VaultState =
      settlementType === "refund" ? "Refunded" : "Resolved";

    let attempts = settlement.attempts;
    let lastReason: string | undefined;

    for (let i = 0; i < SETTLEMENT_RETRY.maxAttempts; i++) {
      attempts += 1;
      try {
        // Sequence is reloaded every attempt so a `tx_bad_seq` self-heals.
        const sequence = await this.horizon.loadSequence(this.signer.publicKey);
        const prepared = await this.assembler.assemble({
          vaultId,
          settlementType,
          recipient,
          amount,
          sequence
        });
        const signedXdr = await this.signer.sign(prepared.xdr, this.networkPassphrase);
        const result = await this.horizon.submit(signedXdr);

        if (result.successful) {
          const resolved = await this.prisma.vaultSettlement.update({
            where: { vaultId },
            data: {
              state: terminalState,
              txHash: result.hash,
              resultCode: result.resultCode ?? "tx_success",
              errorCode: null,
              errorDetail: null,
              attempts,
              resolvedAt: new Date()
            }
          });
          return {
            vaultId,
            state: resolved.state as VaultState,
            txHash: resolved.txHash,
            attempts,
            alreadySettled: false
          };
        }

        lastReason = result.resultCode ?? "submit_failed";
        if (!isRetryable(lastReason)) break;
      } catch (err) {
        lastReason = err instanceof Error ? err.message : String(err);
        if (!isRetryable(lastReason)) break;
      }

      // Exponential backoff with a hard ceiling before the next attempt.
      if (i < SETTLEMENT_RETRY.maxAttempts - 1) {
        const delay = Math.min(
          SETTLEMENT_RETRY.baseDelayMs * 2 ** i,
          SETTLEMENT_RETRY.maxDelayMs
        );
        await this.sleep(delay);
      }
    }

    // Safe rollback: submission never succeeded — return the vault to
    // `Unresolved` so a later run can retry without risk of a double payout.
    const exhausted = attempts >= SETTLEMENT_RETRY.maxAttempts;
    await this.prisma.vaultSettlement.update({
      where: { vaultId },
      data: {
        state: "Unresolved",
        attempts,
        resultCode: lastReason ?? null,
        errorCode: exhausted
          ? ERROR_CODES.SETTLEMENT_RETRIES_EXHAUSTED
          : ERROR_CODES.SETTLEMENT_SUBMIT_FAILED,
        errorDetail: lastReason ?? null
      }
    });

    return { vaultId, state: "Unresolved", txHash: null, attempts, alreadySettled: false };
  }

  async getSettlement(vaultId: string) {
    return this.prisma.vaultSettlement.findUnique({ where: { vaultId } });
  }
}
