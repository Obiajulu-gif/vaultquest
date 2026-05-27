/**
 * Display helpers for VaultQuest pool UI (#73, #75).
 *
 * Privacy-aware address truncation, amount/date formatting, and Stellar
 * explorer links. Pure functions so they are trivially unit-testable.
 */

export type StellarNetwork = "testnet" | "public";

/**
 * Truncate a Stellar address for privacy-aware display, e.g.
 * `GBBD47IF…FLA5`. Short strings are returned unchanged.
 */
export function truncateAddress(address: string, lead = 6, tail = 4): string {
  if (!address) return "";
  if (address.length <= lead + tail + 1) return address;
  return `${address.slice(0, lead)}…${address.slice(-tail)}`;
}

/** Format an amount with its asset code, e.g. `1,250.00 USDC`. */
export function formatAmount(value: string | number, asset?: string): string {
  const num = typeof value === "number" ? value : Number(value);
  const formatted = Number.isFinite(num)
    ? num.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })
    : String(value);
  return asset ? `${formatted} ${asset}` : formatted;
}

/** Format an ISO timestamp as a short human date, e.g. `May 28, 2026`. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

/** Build a Stellar Expert explorer URL for a transaction hash. */
export function explorerTxUrl(txHash: string, network: StellarNetwork = "testnet"): string {
  return `https://stellar.expert/explorer/${network}/tx/${txHash}`;
}
