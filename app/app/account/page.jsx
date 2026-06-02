"use client";

import { useState, useEffect } from "react";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { PiggyBank, Trophy, TrendingUp, Wallet } from "lucide-react";
import UserDepositsList from "@/components/app/UserDepositsList";
import ProfileEditor from "@/components/app/ProfileEditor";
import LevelOnboarding from "@/components/app/LevelOnboarding";
import BadgesGallery from "@/components/app/BadgesGallery";
import PrizeChart from "@/components/app/PrizeChart";
import { useYieldCounter } from "@/components/hooks/useYieldCounter";
import { formatUsd } from "@/lib/yield-counter";
import { DEMO_PORTFOLIO, DEMO_TRANSACTIONS } from "@/lib/demo-portfolio";

function MetricCard({ icon: Icon, label, value, sub, highlight }) {
  return (
    <article
      className={`vq-glass-hover p-5 ${highlight ? "ring-2 ring-red-400/25 shadow-glow" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-vault-border bg-vault-surface text-red-500 dark:text-red-400">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-4 text-xs font-medium uppercase tracking-wide text-vault-muted">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-vault-text sm:text-3xl">
        {value}
      </p>
      {sub && <p className="mt-1 text-sm text-vault-muted">{sub}</p>}
    </article>
  );
}

function ConnectedDashboard() {
  const [selectedAsset, setSelectedAsset] = useState("all");

  const accrued = useYieldCounter(
    DEMO_PORTFOLIO.activeDeposits,
    DEMO_PORTFOLIO.apyPercent,
    DEMO_PORTFOLIO.accruedYieldBase,
    true,
  );

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          icon={PiggyBank}
          label="Active deposits"
          value={formatUsd(DEMO_PORTFOLIO.activeDeposits)}
          sub="Across all pools"
        />
        <MetricCard
          icon={Trophy}
          label="Cumulative winnings"
          value={formatUsd(DEMO_PORTFOLIO.cumulativeWinnings)}
          sub="Lifetime prizes"
        />
        <MetricCard
          icon={TrendingUp}
          label="Accrued yield"
          value={formatUsd(accrued)}
          sub={`${DEMO_PORTFOLIO.apyPercent}% APY · live estimate`}
          highlight
        />
      </div>

      <BadgesGallery />

      <LevelOnboarding activeBalance={DEMO_PORTFOLIO.activeDeposits} />

      <ProfileEditor />

      <PrizeChart />

      <UserDepositsList
        transactions={DEMO_TRANSACTIONS}
        selectedAsset={selectedAsset}
        onClearAsset={() => setSelectedAsset("all")}
      />
    </>
  );
}

function EmptyAccount() {
  const { openConnectModal } = useConnectModal();

  return (
    <div className="vq-glass flex flex-col items-center px-6 py-16 text-center sm:px-10">
      <span className="flex h-16 w-16 items-center justify-center rounded-full border border-vault-border bg-red-500/10 text-red-500 ring-2 ring-red-400/20 dark:text-red-400">
        <Wallet className="h-8 w-8" aria-hidden="true" />
      </span>
      <h2 className="mt-6 text-xl font-semibold text-vault-text">
        Wallet not connected
      </h2>
      <p className="mt-2 max-w-md text-sm text-vault-muted">
        Connect your wallet to view deposits, live yield accrual, and your
        transaction history.
      </p>
      <button
        type="button"
        onClick={() => openConnectModal?.()}
        className="vq-btn-primary mt-8"
      >
        <Wallet className="h-4 w-4" aria-hidden="true" />
        Connect wallet
      </button>
    </div>
  );
}

export default function AccountPage() {
  const { isConnected: wagmiConnected } = useAccount();
  const [isMockConnected, setIsMockConnected] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("mockConnected") === "true") {
        setIsMockConnected(true);
      }
    }
  }, []);

  const isConnected = wagmiConnected || isMockConnected;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-vault-text">Your profile</h1>
        <p className="mt-2 text-vault-muted">
          Track savings, live yield, and pool activity in one place.
        </p>
      </header>
      {isConnected ? <ConnectedDashboard /> : <EmptyAccount />}
    </div>
  );
}
