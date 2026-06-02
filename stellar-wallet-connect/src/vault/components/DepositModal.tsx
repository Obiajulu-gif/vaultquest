import type { FC } from "react";
import { useState, useCallback } from "react";
import { AlertTriangle, Check, Loader2 } from "lucide-react";
import Modal from "../../components/Modal";
import type { PoolSummary } from "../contract/types";
import { formatAmount } from "../lib/format";

type Step = "input" | "review" | "broadcasting";

export interface DepositModalProps {
  pool: PoolSummary;
  walletBalance: string;
  onDeposit: (amount: string) => Promise<void>;
  onClose: () => void;
}

const QUICK_AMOUNTS = [25, 50, 75] as const;
const GAS_BUFFER = 0.5;

function estimateWinChanceChange(currentTvl: bigint, depositAmount: bigint, participantCount: number): string {
  if (currentTvl === 0n) return "50%";
  const currentShare = BigInt(participantCount) * 10000n / (currentTvl / 10000n + 1n);
  const newShare = BigInt(participantCount + 1) * 10000n / ((currentTvl + depositAmount) / 10000n + 1n);
  const change = newShare > currentShare ? newShare - currentShare : currentShare - newShare;
  return `${(Number(change) / 100).toFixed(2)}%`;
}

export const DepositModal: FC<DepositModalProps> = ({ pool, walletBalance, onDeposit, onClose }) => {
  const [step, setStep] = useState<Step>("input");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  const balanceNum = parseFloat(walletBalance);
  const amountNum = parseFloat(amount) || 0;
  const exceedsBalance = amountNum > balanceNum - GAS_BUFFER;
  const isValid = amountNum > 0 && !exceedsBalance;

  const handleQuickAmount = useCallback((pct: number) => {
    const raw = (balanceNum - GAS_BUFFER) * (pct / 100);
    setAmount(raw.toFixed(2));
    setError(null);
  }, [balanceNum]);

  const handleMax = useCallback(() => {
    const max = Math.max(0, balanceNum - GAS_BUFFER);
    setAmount(max.toFixed(2));
    setError(null);
  }, [balanceNum]);

  const handleContinue = useCallback(() => {
    if (!isValid) {
      setError(amountNum === 0 ? "Enter an amount" : "Insufficient balance (leave buffer for gas)");
      return;
    }
    setStep("review");
    setError(null);
  }, [isValid, amountNum]);

  const handleConfirm = useCallback(async () => {
    setStep("broadcasting");
    setError(null);
    try {
      await onDeposit(amount);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transaction failed");
      setStep("review");
    }
  }, [amount, onDeposit]);

  return (
    <Modal
      onClose={step === "broadcasting" ? () => {} : onClose}
      ariaLabelledBy="deposit-modal-title"
      ariaDescribedBy="deposit-modal-desc"
    >
      <div className="space-y-5">
        <h2 id="deposit-modal-title" className="text-xl font-bold text-white">Deposit</h2>
        <p id="deposit-modal-desc" className="sr-only">
          Enter the amount of assets you wish to deposit into the prize pool.
        </p>

        {step === "input" && (
          <div className="space-y-4">
            <div>
              <label htmlFor="deposit-amount" className="block text-sm font-medium text-gray-300">
                Amount
              </label>
              <div className="relative mt-1">
                <input
                  id="deposit-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => { setAmount(e.target.value); setError(null); }}
                  className="w-full rounded-xl border border-red-900/40 bg-[#1A0505] px-4 py-3 pr-16 text-lg text-white placeholder-gray-600 outline-none transition-colors focus:border-red-500/60 focus:ring-1 focus:ring-red-500/30"
                  placeholder="0.00"
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                  {pool.asset}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Balance: {formatAmount(walletBalance, pool.asset)}
              </p>
            </div>

            {exceedsBalance && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-900/40 bg-amber-900/10 p-3 text-sm text-amber-300">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>Amount exceeds available balance (leave ~{GAS_BUFFER} {pool.asset} for gas)</span>
              </div>
            )}

            <div className="flex gap-2">
              {QUICK_AMOUNTS.map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => handleQuickAmount(pct)}
                  className="flex-1 rounded-lg border border-red-900/30 px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-red-900/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1A0505]"
                >
                  {pct}%
                </button>
              ))}
              <button
                type="button"
                onClick={handleMax}
                className="flex-1 rounded-lg border border-red-600/40 px-3 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-900/20 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1A0505]"
              >
                Max
              </button>
            </div>

            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}

            <button
              type="button"
              onClick={handleContinue}
              disabled={!isValid}
              className="w-full rounded-xl bg-red-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1A0505]"
            >
              Continue
            </button>
          </div>
        )}

        {step === "review" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-red-900/30 bg-[#1A0505]/60 p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Amount</span>
                <span className="text-white font-semibold">{formatAmount(amount, pool.asset)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Pool</span>
                <span className="text-white">{pool.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Lock period</span>
                <span className="text-white">Until {pool.locksAt ? new Date(pool.locksAt).toLocaleDateString() : "N/A"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Est. gas</span>
                <span className="text-white">~0.001 XLM</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Win chance change</span>
                <span className="text-emerald-400 font-semibold">
                  +{estimateWinChanceChange(BigInt(pool.tvl || "0"), BigInt(Math.round(amountNum * 1e7)), pool.participantCount)}
                </span>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep("input")}
                className="flex-1 rounded-xl border border-red-900/30 py-3 text-sm font-semibold text-gray-300 transition-colors hover:bg-red-900/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1A0505]"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1A0505]"
              >
                Confirm deposit
              </button>
            </div>
          </div>
        )}

        {step === "broadcasting" && (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-red-500/30">
              {error ? (
                <AlertTriangle className="h-8 w-8 text-red-400" />
              ) : (
                <Loader2 className="h-8 w-8 animate-spin text-red-400" />
              )}
            </div>
            <p className="text-base font-semibold text-white">
              {error ? "Transaction failed" : "Broadcasting deposit..."}
            </p>
            <p className="text-sm text-gray-400 text-center max-w-xs">
              {error
                ? error
                : "Please check your wallet to approve the transaction."}
            </p>
            {error && (
              <button
                type="button"
                onClick={() => { setStep("review"); setError(null); }}
                className="rounded-xl bg-red-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1A0505]"
              >
                Try again
              </button>
            )}
            {!error && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Check className="h-4 w-4 text-emerald-400" />
                <span>Waiting for wallet confirmation</span>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default DepositModal;
