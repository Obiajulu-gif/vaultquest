/**
 * Per-second yield accrual from principal and APY (simple interest model for UI).
 * @param {number} principal
 * @param {number} apyPercent e.g. 8.5 for 8.5%
 */
export function yieldPerSecond(principal, apyPercent) {
  if (!principal || !apyPercent) return 0;
  const annual = principal * (apyPercent / 100);
  return annual / (365 * 24 * 60 * 60);
}

/**
 * @param {number} value
 */
export function formatUsd(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(value);
}
