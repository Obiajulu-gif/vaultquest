"use client";

import { useState } from "react";
import Link from "next/link";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { Sparkles } from "lucide-react";
import OnboardingCards from "@/components/app/OnboardingCards";
import PublicStatsBar from "@/components/app/PublicStatsBar";
import UnsupportedNetworkBanner from "@/components/app/UnsupportedNetworkBanner";
import RecentWinners from "@/components/app/RecentWinners";
import YieldCalculator from "@/components/app/YieldCalculator";

export default function AppDashboardPage() {
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const [onboardingStep, setOnboardingStep] = useState(0);

  const handleStartSaving = () => {
    if (!isConnected) {
      openConnectModal?.();
      setOnboardingStep(1);
      return;
    }
    setOnboardingStep(1);
  };

  return (
    <div className="space-y-8">
      <UnsupportedNetworkBanner />

      <section className="text-center sm:text-left">
        <div className="inline-flex items-center gap-2 rounded-full border border-vault-border bg-vault-surface px-3 py-1 text-xs font-medium text-vault-muted backdrop-blur-md transition-all duration-300">
          <Sparkles className="h-3.5 w-3.5 text-red-500" aria-hidden="true" />
          Prize-linked savings · Principal protected
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-vault-text sm:text-4xl">
          Save together. Win together.
        </h1>
        <p className="mt-3 max-w-2xl text-vault-muted">
          VaultQuest pools your deposits, routes yield to weekly prizes, and
          keeps every saver&apos;s principal withdrawable in full—no-loss by
          design.
        </p>
      </section>

      <PublicStatsBar />

      <YieldCalculator />

      <OnboardingCards />

      <RecentWinners />

      <section className="vq-glass mx-auto max-w-xl p-6 text-center sm:p-8">
        <h2 className="text-xl font-semibold text-vault-text">
          Ready to join a pool?
        </h2>
        <p className="mt-2 text-sm text-vault-muted">
          {isConnected
            ? "Explore prizes or manage your vault positions."
            : "Connect your wallet to deposit, or follow the steps above to get started."}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {onboardingStep === 0 ? (
            <button
              type="button"
              onClick={handleStartSaving}
              className="vq-btn-primary"
            >
              Start Saving
            </button>
          ) : (
            <>
              <Link href="/app/prizes" className="vq-btn-primary">
                View All Prizes
              </Link>
              <Link href="/app/vaults" className="vq-btn-ghost">
                Manage Vaults
              </Link>
            </>
          )}
          {!isConnected && onboardingStep === 0 && (
            <button
              type="button"
              onClick={() => openConnectModal?.()}
              className="vq-btn-ghost"
            >
              Connect wallet
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
