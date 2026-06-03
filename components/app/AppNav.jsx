"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Gift, Menu, User, Wallet, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ThemeToggle from "./ThemeToggle";
import BalanceAutoRefresh from "./BalanceAutoRefresh";

const LINKS = [
  { href: "/app/prizes", label: "Prizes", icon: Gift },
  { href: "/app/vaults", label: "Vaults", icon: Wallet },
  { href: "/app/account", label: "Account", icon: User },
  { href: "/app/admin/proposals", label: "Admin", icon: Menu },
];

export default function AppNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-vault-border bg-vault-surface/80 backdrop-blur-xl transition-all duration-300">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/app"
          className="text-lg font-bold tracking-tight text-vault-text transition-colors duration-300 hover:text-red-500"
        >
          VaultQuest
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {LINKS.map(({ href, label }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-all duration-300 ${
                  active
                    ? "bg-red-500/15 text-red-600 ring-1 ring-red-400/30 dark:text-red-400"
                    : "text-vault-muted hover:bg-vault-surface hover:text-vault-text"
                }`}
                aria-current={active ? "page" : undefined}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <BalanceAutoRefresh />
          <ThemeToggle className="hidden sm:flex" />
          <div className="hidden sm:block">
            <ConnectButton chainStatus="icon" showBalance={false} />
          </div>
          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-vault-border bg-vault-surface text-vault-text transition-all duration-300 hover:shadow-glow md:hidden"
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden border-t border-vault-border md:hidden"
          >
            <nav className="flex flex-col gap-1 px-4 py-4" aria-label="Mobile">
              {LINKS.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ${
                      active
                        ? "bg-red-500/15 text-red-600 dark:text-red-400"
                        : "text-vault-muted"
                    }`}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                    {label}
                  </Link>
                );
              })}
              <div className="mt-3 flex items-center justify-between border-t border-vault-border pt-4">
                <span className="text-sm text-vault-muted">Theme</span>
                <ThemeToggle />
              </div>
              <div className="mt-3">
                <ConnectButton chainStatus="full" showBalance={false} />
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
