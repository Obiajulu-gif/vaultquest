import { useState, type FC } from "react";
import { CheckCircle2, ChevronDown, ChevronUp, HelpCircle, Wallet } from "lucide-react";

export const ONBOARDING_STORAGE_KEY = "vaultquest.onboarding.dismissed";

const STEPS = [
  {
    title: "Connect a Stellar wallet",
    body: "VaultQuest uses your wallet to show your position and request signatures for pool actions."
  },
  {
    title: "Use the supported network",
    body: "Make sure your wallet is on the VaultQuest-supported Stellar network before joining a pool."
  },
  {
    title: "Join a pool",
    body: "Joining deposits the pool asset, records your shares, and keeps the action visible while it confirms."
  },
  {
    title: "Follow reward cycles",
    body: "Pools lock, draw, and settle on a schedule. Rewards appear after the cycle settles."
  },
  {
    title: "Expect signatures and confirmations",
    body: "Create, join, deposit, claim, and withdraw actions ask for a wallet signature and then wait for chain confirmation."
  }
];

function readDismissed(): boolean {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem(ONBOARDING_STORAGE_KEY) === "true";
}

function writeDismissed(value: boolean): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(ONBOARDING_STORAGE_KEY, value ? "true" : "false");
}

export interface OnboardingChecklistProps {
  className?: string;
}

export const OnboardingChecklist: FC<OnboardingChecklistProps> = ({ className = "" }) => {
  const [dismissed, setDismissed] = useState(() => readDismissed());
  const [expanded, setExpanded] = useState(() => !readDismissed());

  const dismiss = () => {
    writeDismissed(true);
    setDismissed(true);
    setExpanded(false);
  };

  const revisit = () => {
    writeDismissed(false);
    setDismissed(false);
    setExpanded(true);
  };

  if (dismissed) {
    return (
      <button
        type="button"
        onClick={revisit}
        className={`inline-flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-900/30 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-900/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1A0505] ${className}`}
      >
        <HelpCircle className="h-4 w-4" aria-hidden="true" />
        Onboarding checklist
      </button>
    );
  }

  return (
    <aside
      aria-label="Onboarding checklist"
      className={`rounded-2xl border border-red-900/30 bg-[#1A0505]/60 p-4 text-gray-200 sm:p-5 ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-900/30 text-red-300">
            <Wallet className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-white">First-time wallet checklist</h2>
            <p className="text-sm text-gray-400">A quick pass before using pool actions.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-500/30 text-gray-200 transition-colors hover:bg-red-900/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
        >
          {expanded ? <ChevronUp className="h-4 w-4" aria-hidden="true" /> : <ChevronDown className="h-4 w-4" aria-hidden="true" />}
          <span className="sr-only">{expanded ? "Collapse checklist" : "Expand checklist"}</span>
        </button>
      </div>

      {expanded && (
        <>
          <ol className="mt-4 grid gap-3 md:grid-cols-2">
            {STEPS.map((step) => (
              <li key={step.title} className="flex gap-3 rounded-xl border border-red-900/20 bg-black/20 p-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" aria-hidden="true" />
                <div>
                  <h3 className="text-sm font-semibold text-white">{step.title}</h3>
                  <p className="mt-1 text-sm leading-5 text-gray-400">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <button
            type="button"
            onClick={dismiss}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1A0505]"
          >
            Got it
          </button>
        </>
      )}
    </aside>
  );
};
