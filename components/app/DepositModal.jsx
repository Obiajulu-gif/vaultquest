"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import GasPrioritySelector from "@/components/app/GasPrioritySelector";

function formatToken(value, token) {
  return `${Number(value || 0).toFixed(token === "XLM" ? 6 : 4)} ${token}`;
}

export default function DepositModal({ isOpen, onClose }) {
  const [amount, setAmount] = useState("250");
  const [feeState, setFeeState] = useState(null);
  const walletBalance = 0.0018;
  const gasBudget = useMemo(() => feeState?.estimatedNative ?? 0, [feeState]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const isGasShort = walletBalance < gasBudget;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm sm:items-center">
      <div className="vq-glass w-full max-w-5xl overflow-hidden border border-vault-border/60 shadow-2xl">
        <div className="flex items-center justify-between border-b border-vault-border/40 px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-vault-muted">
              Deposit flow
            </p>
            <h2 className="mt-1 text-xl font-semibold text-vault-text">
              Review gas before signing
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="vq-btn-ghost h-10 w-10 rounded-full p-0"
            aria-label="Close deposit modal"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="grid gap-6 p-5 lg:grid-cols-[0.9fr_1.1fr] lg:p-6">
          <section className="space-y-4 rounded-3xl border border-vault-border/40 bg-vault-surface/30 p-5">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-vault-muted">
                Deposit amount
              </p>
              <label htmlFor="deposit-amount" className="sr-only">
                Deposit amount
              </label>
              <input
                id="deposit-amount"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                inputMode="decimal"
                className="mt-2 w-full rounded-2xl border border-vault-border bg-vault-surface px-4 py-3 text-lg font-semibold text-vault-text outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-400/25"
                placeholder="0.00"
              />
              <p className="mt-2 text-sm text-vault-muted">
                Demo wallet balance: {formatToken(walletBalance, "AVAX")}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-vault-border/40 bg-vault-surface/35 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-vault-muted">
                  Deposit preview
                </p>
                <p className="mt-1 text-lg font-semibold text-vault-text">
                  {amount || "0.00"} USDC
                </p>
              </div>
              <div className="rounded-2xl border border-vault-border/40 bg-vault-surface/35 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-vault-muted">
                  Native balance
                </p>
                <p className="mt-1 text-lg font-semibold text-vault-text">
                  {formatToken(walletBalance, "AVAX")}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-vault-border/40 bg-slate-950/75 p-4 text-sm text-slate-200">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Transaction payload
              </p>
              <pre className="mt-2 overflow-auto text-xs leading-relaxed text-slate-200">
                {JSON.stringify(
                  {
                    amount,
                    gasBudget: formatToken(gasBudget, "AVAX"),
                    balance: formatToken(walletBalance, "AVAX"),
                  },
                  null,
                  2,
                )}
              </pre>
            </div>

            {isGasShort && (
              <div
                role="alert"
                aria-live="assertive"
                className="rounded-2xl border border-amber-400/35 bg-amber-500/10 p-4 text-sm text-amber-100"
              >
                <p className="font-semibold text-vault-text">Network warning</p>
                <p className="mt-1 text-vault-muted">
                  The connected wallet does not have enough native token to cover the selected gas fee.
                </p>
              </div>
            )}
          </section>

          <GasPrioritySelector nativeBalance={walletBalance} onChange={setFeeState} />
        </div>

        <div className="flex flex-col gap-3 border-t border-vault-border/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="text-sm text-vault-muted">
            Selected gas cost is applied to the transaction execution payload before submission.
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="vq-btn-ghost">
              Cancel
            </button>
            <button type="button" className="vq-btn-primary">
              Confirm deposit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}