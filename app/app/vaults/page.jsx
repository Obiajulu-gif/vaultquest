"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import GasPrioritySelector from "@/components/app/GasPrioritySelector";
import DepositModal from "@/components/app/DepositModal";
import VaultFilters from "@/components/app/VaultFilters";
import VaultList, { MOCK_VAULTS } from "@/components/app/VaultList";

const INITIAL_FILTERS = {
  search: "",
  networks: [],
  minApy: 0,
  minTvl: 0,
  lockups: [],
};

export default function VaultsPage() {
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [filters, setFilters] = useState(INITIAL_FILTERS);

  const filteredVaults = useMemo(() => {
    return MOCK_VAULTS.filter((vault) => {
      // Search
      if (filters.search) {
        const search = filters.search.toLowerCase();
        if (
          !vault.name.toLowerCase().includes(search) &&
          !vault.asset.toLowerCase().includes(search)
        ) {
          return false;
        }
      }

      // Networks
      if (filters.networks.length > 0 && !filters.networks.includes(vault.network)) {
        return false;
      }

      // APY
      if (vault.apy < filters.minApy) {
        return false;
      }

      // TVL (in millions)
      if (vault.tvl / 1000000 < filters.minTvl) {
        return false;
      }

      // Lockups
      if (filters.lockups.length > 0) {
        const isMatch = filters.lockups.some((l) => {
          if (l === 0) return vault.lockup === 0;
          if (l === "short") return vault.lockup >= 1 && vault.lockup <= 14;
          if (l === "medium") return vault.lockup >= 15 && vault.lockup <= 30;
          if (l === "long") return vault.lockup > 30;
          return false;
        });
        if (!isMatch) return false;
      }

      return true;
    });
  }, [filters]);

  const clearFilters = () => setFilters(INITIAL_FILTERS);

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h1 className="text-3xl font-bold text-vault-text">Vaults</h1>
        <p className="max-w-2xl text-vault-muted">
          Manage your pool positions and drip deposits. Review live fee tiers before you submit a transaction.
        </p>
      </section>

      <div className="flex flex-col gap-8 lg:flex-row">
        <VaultFilters
          filters={filters}
          setFilters={setFilters}
          onClear={clearFilters}
        />

        <div className="flex-1 space-y-6">
          <div className="grid gap-6 xl:grid-cols-2">
            <GasPrioritySelector nativeBalance={0.0018} />

            <section className="vq-glass-hover flex flex-col justify-between p-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.24em] text-vault-muted">
                  Deposit review
                </p>
                <h2 className="mt-1 text-xl font-semibold text-vault-text">
                  Quick Deposit Flow
                </h2>
                <p className="mt-2 text-sm text-vault-muted">
                  Select a vault below to begin your deposit. Live network estimates will be calculated automatically.
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

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-vault-text">Available Pools</h3>
              <p className="text-sm text-vault-muted">
                Showing {filteredVaults.length} of {MOCK_VAULTS.length} vaults
              </p>
            </div>
            <VaultList vaults={filteredVaults} />
          </div>
        </div>
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
