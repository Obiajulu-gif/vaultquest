"use client";

import { useState } from "react";
import Link from "next/link";
import GasPrioritySelector from "@/components/app/GasPrioritySelector";
import DepositModal from "@/components/app/DepositModal";

export default function VaultsPage() {
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h1 className="text-3xl font-bold text-vault-text">Vaults</h1>
        <p className="max-w-2xl text-vault-muted">
          Manage your pool positions and drip deposits. Review live fee tiers before you submit a transaction.
        </p>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <GasPrioritySelector nativeBalance={0.0018} />

        <section className="vq-glass-hover flex flex-col justify-between p-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-vault-muted">
              Deposit review
            </p>
            <h2 className="mt-1 text-xl font-semibold text-vault-text">
              Open the guarded deposit flow
            </h2>
            <p className="mt-2 text-sm text-vault-muted">
              The modal shows the selected fee payload, live network estimates, and a balance warning when the native wallet buffer is too low.
            </p>
          </div>

          <div className="mt-6 rounded-2xl border border-vault-border/50 bg-vault-surface/30 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-vault-muted">
              Demo balance state
            </p>
            <p className="mt-1 text-lg font-semibold text-amber-500 dark:text-amber-400">
              Low gas balance
            </p>
            <p className="mt-1 text-sm text-vault-muted">
              This is intentionally configured for screenshot coverage of the warning banner state.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsDepositModalOpen(true)}
            className="vq-btn-primary mt-6 self-start"
          >
            Open deposit modal
          </button>
        </section>
      </div>

      <DepositModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
      />

      <Link href="/app" className="vq-btn-ghost inline-flex">
        ← Back to dashboard
      </Link>
    </div>
  );
}
