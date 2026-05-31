"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useAnimationFrame, useMotionValue } from "framer-motion";
import { Trophy, Gift } from "lucide-react";

const WINNERS = [
  {
    id: 1,
    name: "Obiajulu",
    address: "GBBD...LLFL",
    amount: 1250,
    asset: "USDC",
    poolName: "30-Day Savings Sprint",
    date: "2 hours ago",
    avatarGrad: "from-amber-400 to-yellow-600",
  },
  {
    id: 2,
    name: "Sarah K.",
    address: "GD72...3J5D",
    amount: 350,
    asset: "USDC",
    poolName: "USDC Yield Pool",
    date: "1 day ago",
    avatarGrad: "from-purple-500 to-indigo-500",
  },
  {
    id: 3,
    name: "David E.",
    address: "GC4A...K9Q2",
    amount: 1500,
    asset: "USDC",
    poolName: "30-Day Savings Sprint",
    date: "2 days ago",
    avatarGrad: "from-yellow-400 to-orange-500",
  },
  {
    id: 4,
    name: "Elena R.",
    address: "GAT5...F92A",
    amount: 720,
    asset: "USDC",
    poolName: "Student Saver Quest",
    date: "3 days ago",
    avatarGrad: "from-teal-400 to-emerald-600",
  },
  {
    id: 5,
    name: "Liam M.",
    address: "GDBK...W4XP",
    amount: 2100,
    asset: "USDC",
    poolName: "Grand Prize Pool",
    date: "4 days ago",
    avatarGrad: "from-amber-500 to-rose-600",
  },
  {
    id: 6,
    name: "Sakura S.",
    address: "GBR6...M32L",
    amount: 120,
    asset: "USDC",
    poolName: "Student Saver Quest",
    date: "5 days ago",
    avatarGrad: "from-pink-500 to-rose-400",
  },
  {
    id: 7,
    name: "Marcus V.",
    address: "GD5W...P67T",
    amount: 980,
    asset: "USDC",
    poolName: "USDC Yield Pool",
    date: "1 week ago",
    avatarGrad: "from-blue-500 to-cyan-500",
  },
];

// Duplicate the array to allow infinite seamless marquee looping
const DUPLICATED_WINNERS = [...WINNERS, ...WINNERS];

export default function RecentWinners() {
  const containerRef = useRef(null);
  const [width, setWidth] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const x = useMotionValue(0);

  useEffect(() => {
    if (containerRef.current) {
      // The scroll width represents two sets of cards, so one set is exactly half the scrollWidth
      setWidth(containerRef.current.scrollWidth / 2);
    }
  }, [containerRef.current?.scrollWidth]);

  useAnimationFrame((time, delta) => {
    if (!width || isPaused || isDragging) return;

    const currentX = x.get();
    // Normalize speed across different frame rates (approx 60px/second base)
    const baseSpeed = 1.0;
    const deltaFactor = delta / 16.67;
    let nextX = currentX - baseSpeed * deltaFactor;

    // Seamless loop wrap-around
    if (nextX <= -width) {
      nextX = 0;
    }
    x.set(nextX);
  });

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    // Keep translation within constraints
    const currentX = x.get();
    if (currentX > 0) {
      x.set(0);
    } else if (currentX < -width) {
      x.set(-width);
    }
  };

  return (
    <section className="space-y-4 py-4" aria-label="Recent winners carousel">
      <div className="flex items-center justify-between px-4 sm:px-0">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-vault-text flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500 animate-pulse" aria-hidden="true" />
            Recent Prize Winners
          </h2>
          <p className="text-sm text-vault-muted">Live payout records of savers in VaultQuest pools</p>
        </div>
      </div>

      <div 
        className="relative overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Left and Right Glass Overlays for smooth visual fading */}
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-12 bg-gradient-to-r from-vault-bg to-transparent sm:w-20" />
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-12 bg-gradient-to-l from-vault-bg to-transparent sm:w-20" />

        <motion.div
          ref={containerRef}
          className="flex gap-4 px-12 py-2 w-max"
          style={{ x }}
          drag="x"
          dragConstraints={{ left: -width, right: 0 }}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {DUPLICATED_WINNERS.map((winner, idx) => {
            const isLargeWin = winner.amount >= 1000;
            return (
              <article
                key={`${winner.id}-${idx}`}
                className={`w-64 shrink-0 rounded-2xl p-5 transition-transform duration-300 select-none ${
                  isLargeWin
                    ? "bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-amber-600/10 border border-amber-500/40 shadow-[0_4px_20px_rgba(245,158,11,0.12)] hover:border-amber-400 hover:scale-[1.02]"
                    : "vq-glass border border-vault-border bg-vault-surface/40 hover:border-red-400/30 hover:scale-[1.02]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* User profile avatar with initials and gradient */}
                    <span
                      className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${winner.avatarGrad} text-sm font-bold text-white shadow-md`}
                    >
                      {winner.name.charAt(0)}
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-vault-text leading-tight">{winner.name}</h3>
                      <p className="font-mono text-[10px] text-vault-muted mt-0.5">{winner.address}</p>
                    </div>
                  </div>
                  {isLargeWin && (
                    <Trophy className="h-5 w-5 text-amber-400 shrink-0" aria-hidden="true" />
                  )}
                </div>

                <div className="mt-4">
                  <div className="flex items-baseline gap-1.5">
                    <span
                      className={`text-2xl font-bold tracking-tight ${
                        isLargeWin ? "text-amber-500 dark:text-amber-400" : "text-vault-text"
                      }`}
                    >
                      +{winner.amount.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-vault-muted">{winner.asset}</span>
                  </div>
                  
                  {isLargeWin && (
                    <span className="mt-1 inline-flex items-center rounded-full bg-amber-500/20 px-2 py-0.5 text-[9px] font-bold text-amber-300 border border-amber-500/30">
                      GRAND PRIZE
                    </span>
                  )}
                </div>

                <div className="mt-4 border-t border-vault-border/40 pt-2 flex items-center justify-between text-xs text-vault-muted">
                  <span className="truncate max-w-[140px]" title={winner.poolName}>{winner.poolName}</span>
                  <span className="shrink-0">{winner.date}</span>
                </div>
              </article>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
