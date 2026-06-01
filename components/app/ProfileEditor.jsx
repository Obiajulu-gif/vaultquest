"use client";

import { useState, useEffect, useMemo } from "react";
import { useAccount } from "wagmi";
import { User, Save, Award, Sparkles, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Simple blockie generator using wallet address as seed
const generateBlockie = (address, size = 8) => {
  if (!address) return [];

  const hash = address.toLowerCase().slice(2);
  const colors = [
    "#ef4444",
    "#f97316",
    "#f59e0b",
    "#eab308",
    "#84cc16",
    "#22c55e",
    "#10b981",
    "#14b8a6",
    "#06b6d4",
    "#0ea5e9",
    "#3b82f6",
    "#6366f1",
    "#8b5cf6",
    "#a855f7",
    "#d946ef",
  ];

  const grid = [];
  for (let i = 0; i < size * size; i++) {
    const charIndex = i % hash.length;
    const charCode = hash.charCodeAt(charIndex);
    const shouldFill = charCode % 2 === 0;
    const colorIndex = charCode % colors.length;
    grid.push(shouldFill ? colors[colorIndex] : "transparent");
  }

  return grid;
};

const ACHIEVEMENT_BADGES = [
  {
    id: "early-adopter",
    name: "Early Adopter",
    icon: "🚀",
    unlocked: true,
    description: "Joined in beta",
  },
  {
    id: "first-deposit",
    name: "First Deposit",
    icon: "💰",
    unlocked: true,
    description: "Made your first deposit",
  },
  {
    id: "prize-winner",
    name: "Prize Winner",
    icon: "🏆",
    unlocked: true,
    description: "Won a prize draw",
  },
  {
    id: "whale",
    name: "Whale",
    icon: "🐋",
    unlocked: false,
    description: "Deposit over $10,000",
  },
  {
    id: "diamond-hands",
    name: "Diamond Hands",
    icon: "💎",
    unlocked: false,
    description: "Hold for 6 months",
  },
  {
    id: "referral-master",
    name: "Referral Master",
    icon: "🎯",
    unlocked: false,
    description: "Refer 10 users",
  },
];

export default function ProfileEditor() {
  const { address } = useAccount();
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showMobile, setShowMobile] = useState(false);

  const blockieGrid = useMemo(() => {
    return address ? generateBlockie(address) : [];
  }, [address]);

  const handleSave = async () => {
    setSaving(true);

    // Simulate API call to save profile settings
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // In production, save to backend:
    // await fetch('/api/profile', {
    //   method: 'POST',
    //   body: JSON.stringify({ address, selectedBadge }),
    // });

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  useEffect(() => {
    // Load saved profile settings from backend
    if (address) {
      // In production: fetch from API
      // const profile = await fetch(`/api/profile/${address}`);
      // setSelectedBadge(profile.selectedBadge);
    }
  }, [address]);

  if (!address) {
    return (
      <div className="vq-glass p-6 text-center">
        <User
          className="mx-auto h-12 w-12 text-vault-muted"
          aria-hidden="true"
        />
        <p className="mt-3 text-sm text-vault-muted">
          Connect your wallet to customize your profile
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Card Preview */}
      <section className="vq-glass p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-vault-text">
          <User className="h-5 w-5 text-red-500" aria-hidden="true" />
          Profile Card Preview
        </h2>

        <div className="vq-glass-hover relative overflow-hidden p-6">
          {/* Background badge if selected */}
          {selectedBadge && (
            <div className="absolute right-4 top-4 text-6xl opacity-10">
              {ACHIEVEMENT_BADGES.find((b) => b.id === selectedBadge)?.icon}
            </div>
          )}

          <div className="relative flex flex-col items-center gap-4 sm:flex-row">
            {/* Blockie Avatar */}
            <div className="relative">
              <div
                className="grid h-24 w-24 gap-0 overflow-hidden rounded-2xl border-4 border-vault-border shadow-glow"
                style={{
                  gridTemplateColumns: "repeat(8, 1fr)",
                  gridTemplateRows: "repeat(8, 1fr)",
                }}
              >
                {blockieGrid.map((color, i) => (
                  <div key={i} style={{ backgroundColor: color }} />
                ))}
              </div>
              {selectedBadge && (
                <div className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full border-2 border-vault-bg bg-vault-surface text-2xl shadow-lg">
                  {ACHIEVEMENT_BADGES.find((b) => b.id === selectedBadge)?.icon}
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-xl font-bold text-vault-text">
                {address.slice(0, 6)}...{address.slice(-4)}
              </h3>
              <p className="mt-1 text-sm text-vault-muted">VaultQuest Saver</p>
              {selectedBadge && (
                <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-red-500/15 px-3 py-1 text-xs font-medium text-red-600 dark:text-red-400">
                  <Award className="h-3 w-3" aria-hidden="true" />
                  {ACHIEVEMENT_BADGES.find((b) => b.id === selectedBadge)?.name}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Avatar Customization */}
      <section className="vq-glass p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-vault-text">
          <Sparkles className="h-5 w-5 text-red-500" aria-hidden="true" />
          Custom Avatar
        </h2>

        <div className="rounded-lg border border-vault-border bg-vault-surface/40 p-4">
          <p className="text-sm text-vault-muted">
            Your unique avatar is automatically generated from your wallet
            address using a blockie algorithm. Each address creates a distinct
            pattern that serves as your visual identity across VaultQuest.
          </p>
          <div className="mt-3 flex items-center gap-2 text-xs text-vault-muted">
            <Check className="h-4 w-4 text-emerald-500" aria-hidden="true" />
            High-resolution SVG format
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-vault-muted">
            <Check className="h-4 w-4 text-emerald-500" aria-hidden="true" />
            Deterministic generation (same address = same avatar)
          </div>
        </div>
      </section>

      {/* Achievement Badges */}
      <section className="vq-glass p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-vault-text">
          <Award className="h-5 w-5 text-red-500" aria-hidden="true" />
          Achievement Badges
        </h2>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ACHIEVEMENT_BADGES.map((badge) => (
            <button
              key={badge.id}
              type="button"
              disabled={!badge.unlocked}
              onClick={() =>
                setSelectedBadge(selectedBadge === badge.id ? null : badge.id)
              }
              className={`group relative overflow-hidden rounded-xl border p-4 text-left transition-all duration-300 ${
                !badge.unlocked
                  ? "cursor-not-allowed border-vault-border/30 bg-vault-surface/20 opacity-50"
                  : selectedBadge === badge.id
                    ? "border-red-400 bg-red-500/10 ring-2 ring-red-400/30"
                    : "border-vault-border bg-vault-surface/40 hover:border-red-400/40 hover:shadow-glow"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-3xl">{badge.icon}</span>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-vault-text">
                    {badge.name}
                  </h3>
                  <p className="mt-1 text-xs text-vault-muted">
                    {badge.description}
                  </p>
                  {!badge.unlocked && (
                    <span className="mt-2 inline-block rounded-full bg-vault-border/30 px-2 py-0.5 text-xs font-medium text-vault-muted">
                      Locked
                    </span>
                  )}
                </div>
              </div>
              {selectedBadge === badge.id && (
                <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white">
                  <Check className="h-4 w-4" aria-hidden="true" />
                </div>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || saved}
          className="vq-btn-primary disabled:opacity-60"
        >
          {saving ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Saving...
            </>
          ) : saved ? (
            <>
              <Check className="h-4 w-4" aria-hidden="true" />
              Saved!
            </>
          ) : (
            <>
              <Save className="h-4 w-4" aria-hidden="true" />
              Save Profile
            </>
          )}
        </button>
      </div>

      {/* Mobile Layout Toggle (for demo) */}
      <button
        type="button"
        onClick={() => setShowMobile(!showMobile)}
        className="vq-btn-ghost w-full text-xs sm:hidden"
      >
        {showMobile ? "Hide" : "Show"} Mobile Preview
      </button>

      <AnimatePresence>
        {showMobile && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="vq-glass overflow-hidden p-4 sm:hidden"
          >
            <p className="mb-3 text-center text-xs font-medium text-vault-muted">
              Mobile Layout
            </p>
            <div className="mx-auto max-w-xs space-y-4">
              <div className="vq-glass-hover p-4">
                <div className="flex flex-col items-center gap-3">
                  <div
                    className="grid h-20 w-20 gap-0 overflow-hidden rounded-xl border-2 border-vault-border"
                    style={{
                      gridTemplateColumns: "repeat(8, 1fr)",
                      gridTemplateRows: "repeat(8, 1fr)",
                    }}
                  >
                    {blockieGrid.map((color, i) => (
                      <div key={i} style={{ backgroundColor: color }} />
                    ))}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-vault-text">
                      {address.slice(0, 6)}...{address.slice(-4)}
                    </p>
                    {selectedBadge && (
                      <p className="mt-1 text-xs text-vault-muted">
                        {
                          ACHIEVEMENT_BADGES.find((b) => b.id === selectedBadge)
                            ?.name
                        }
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
