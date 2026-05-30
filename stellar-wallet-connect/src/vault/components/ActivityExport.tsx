import type { FC } from "react";
import { useState } from "react";
import { AlertCircle, CheckCircle2, Download, Loader2 } from "lucide-react";
import { WalletDisconnectedState } from "../../components/FallbackStates";
import { useActivityExport, type ExportFormat } from "../hooks";

/**
 * Activity export controls (#92).
 *
 * Lets connected users download their VaultQuest action history as JSON or
 * CSV. Pairs with `useActivityExport` for the fetch/download side-effect.
 * Presentational props keep the component testable in isolation.
 *
 * Responsive: stacks on mobile, single row on desktop.
 */

export interface ActivityExportProps {
  walletAddress: string | null;
  walletConnected?: boolean;
  onConnect?: () => void;
  /** Base URL of the backend API. Defaults to "/api". */
  apiBaseUrl?: string;
}

const FORMAT_OPTIONS: { value: ExportFormat; label: string }[] = [
  { value: "json", label: "JSON" },
  { value: "csv", label: "CSV" },
];

export const ActivityExport: FC<ActivityExportProps> = ({
  walletAddress,
  walletConnected = true,
  onConnect,
  apiBaseUrl = "/api",
}) => {
  const { state, trigger, reset } = useActivityExport();
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  if (!walletConnected || !walletAddress) {
    return <WalletDisconnectedState onConnect={onConnect} />;
  }

  const loading = state.status === "loading";

  const handleExport = () => {
    trigger({
      wallet: walletAddress,
      format,
      from: from || undefined,
      to: to || undefined,
      baseUrl: apiBaseUrl,
    });
  };

  return (
    <section aria-label="Export activity" className="rounded-2xl border border-red-900/30 bg-[#1A0505]/60 p-5">
      <h2 className="text-base font-semibold text-white">Export activity</h2>
      <p className="mt-1 text-sm text-gray-400">
        Download your VaultQuest transaction history for personal records or support.
      </p>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        {/* Date range */}
        <div className="flex flex-col gap-1">
          <label htmlFor="export-from" className="text-xs font-medium text-gray-400">
            From
          </label>
          <input
            id="export-from"
            type="date"
            value={from}
            onChange={(e) => { reset(); setFrom(e.target.value); }}
            className="rounded-lg border border-red-900/30 bg-[#0D0101] px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="export-to" className="text-xs font-medium text-gray-400">
            To
          </label>
          <input
            id="export-to"
            type="date"
            value={to}
            onChange={(e) => { reset(); setTo(e.target.value); }}
            className="rounded-lg border border-red-900/30 bg-[#0D0101] px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        {/* Format picker */}
        <div className="flex flex-col gap-1">
          <label htmlFor="export-format" className="text-xs font-medium text-gray-400">
            Format
          </label>
          <select
            id="export-format"
            value={format}
            onChange={(e) => { reset(); setFormat(e.target.value as ExportFormat); }}
            className="rounded-lg border border-red-900/30 bg-[#0D0101] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            {FORMAT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Export button */}
        <button
          type="button"
          onClick={handleExport}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1A0505]"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Download className="h-4 w-4" aria-hidden="true" />
          )}
          {loading ? "Exporting…" : "Export"}
        </button>
      </div>

      {/* Feedback */}
      {state.status === "success" && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            Downloaded <span className="font-mono">{state.filename}</span>
          </span>
        </div>
      )}

      {state.status === "error" && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-700/20 px-3 py-2 text-sm text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{state.message}</span>
        </div>
      )}
    </section>
  );
};

export default ActivityExport;
