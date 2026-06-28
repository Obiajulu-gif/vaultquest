"use client";

import { CheckCircle2, Clock, Zap } from "lucide-react";
import { getRoundStatusMeta } from "@/lib/vault-status";

const TONE_CLASSES = {
  success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
  warning: "border-amber-500/20 bg-amber-500/10 text-amber-500",
  neutral: "border-vault-border bg-vault-surface text-vault-muted",
};

const TONE_ICONS = {
  success: Zap,
  warning: Clock,
  neutral: CheckCircle2,
};

export default function RoundStatusBadge({ status, className = "" }) {
  const { label, tone } = getRoundStatusMeta(status);
  const Icon = TONE_ICONS[tone];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${TONE_CLASSES[tone]} ${className}`}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </span>
  );
}
