"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Wallet, Info, ArrowUpRight } from "lucide-react";
import RoundStatusBadge from "@/components/app/RoundStatusBadge";
import { ROUND_STATUS } from "@/lib/vault-status";

export const MOCK_VAULTS = [
  { id: 1, name: "USDC Stable Pool", network: "Avalanche", tvl: 1250000, lockup: 7, apy: 5.2, asset: "USDC", status: ROUND_STATUS.ACTIVE },
  { id: 2, name: "XLM Drip Vault", network: "Stellar", tvl: 450000, lockup: 0, apy: 3.8, asset: "XLM", status: ROUND_STATUS.PENDING },
  { id: 3, name: "ETH Growth Pool", network: "Avalanche", tvl: 8900000, lockup: 30, apy: 8.5, asset: "ETH", status: ROUND_STATUS.ACTIVE },
  { id: 4, name: "SOL Yield Max", network: "Solana", tvl: 2100000, lockup: 14, apy: 12.4, asset: "SOL", status: ROUND_STATUS.COMPLETED },
  { id: 5, name: "USDT Liquidity", network: "Avalanche", tvl: 3400000, lockup: 0, apy: 4.5, asset: "USDT", status: ROUND_STATUS.ACTIVE },
  { id: 6, name: "BTC Reserve", network: "Stellar", tvl: 15600000, lockup: 90, apy: 10.1, asset: "BTC", status: ROUND_STATUS.PENDING },
];

export default function VaultList({ vaults = [] }) {
  if (vaults.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-vault-surface text-vault-muted border border-vault-border">
          <Info size={32} />
        </div>
        <h3 className="text-xl font-semibold text-vault-text">No vaults found</h3>
        <p className="text-vault-muted">Try adjusting your filters to find more opportunities.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
      <AnimatePresence mode="popLayout">
        {vaults.map((vault) => (
          <motion.div
            key={vault.id}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="vq-glass-hover group flex flex-col justify-between p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-vault-accent/10 text-vault-accent border border-vault-accent/20">
                  <Wallet size={20} />
                </div>
                <div>
                  <h4 className="font-semibold text-vault-text">{vault.name}</h4>
                  <p className="text-xs text-vault-muted">{vault.network} • {vault.asset}</p>
                </div>
              </div>
              <RoundStatusBadge status={vault.status} className="shrink-0" />
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3 border-t border-vault-border pt-4">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-vault-muted font-bold">Est. APY</p>
                <p className="font-bold text-emerald-500">{vault.apy}%</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-vault-muted font-bold">TVL</p>
                <p className="font-medium text-vault-text">
                  ${(vault.tvl / 1000000).toFixed(1)}M
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-vault-muted font-bold">Lockup</p>
                <p className="font-medium text-vault-text">
                  {vault.lockup === 0 ? "Flexible" : `${vault.lockup} Days`}
                </p>
              </div>
            </div>

            <Link href={`/app/vaults/${vault.id}`} className="vq-btn-primary mt-6 w-full text-center">
              View Vault
              <ArrowUpRight size={16} className="ml-1 inline" />
            </Link>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
