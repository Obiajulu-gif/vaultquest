'use client';
jsx
// app/app/account/page.jsx
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { formatUnits } from 'ethers';
import { logger } from '@/lib/logger';
import { glassmorphicCard, microCounter, gradientText, responsiveGrid } from '@/styles/designSystem';
import UserDepositsList from '@/components/app/UserDepositsList';
import MetricCard from '@/components/app/MetricCard';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { useIsMounted } from '@/hooks/useIsMounted';

/* =================================================================
 * Types (JSDoc)
 * ================================================================= */

/**
 * @typedef {Object} Deposit
 * @property {bigint} amount
 * @property {number} apy
 * @property {{ decimals: number, symbol?: string, address?: string }} token
 */

/**
 * @typedef {Object} YieldSummary
 * @property {bigint} totalDeposits
 * @property {number} totalYieldPerSecond
 * @property {number} cumulativeYield
 */

/* =================================================================
 * Utility: per‑second yield increment
 * ================================================================= */

/**
 * Calculate the per‑second yield increment given an annual yield rate.
 *
 * @param {number} annualRate – APY as a decimal (e.g., 0.08 for 8%).
 * @param {bigint | number} principal – deposit amount in wei (or smallest unit).
 * @param {number} [decimals=18] – token decimals.
 * @returns {number} Per‑second increment in human‑readable units.
 * @throws {TypeError} If annualRate is not a finite number or principal is invalid.
 * @throws {RangeError} If decimals is not an integer or out of range.
 */
const perSecondIncrement = (annualRate, principal, decimals = 18) => {
  // Validate annualRate
  if (typeof annualRate !== 'number' || !Number.isFinite(annualRate) || annualRate < 0) {
    throw new TypeError(`annualRate must be a non-negative finite number; got ${annualRate}`);
  }
  // Validate decimals
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 78) {
    throw new RangeError(`decimals must be an integer between 0 and 78; got ${decimals}`);
  }
  // Convert principal to number if bigint
  let principalHuman;
  if (typeof principal === 'bigint') {
    principalHuman = Number(formatUnits(principal, decimals));
  } else if (typeof principal === 'number' && Number.isFinite(principal) && principal >= 0) {
    principalHuman = principal;
  } else {
    throw new TypeError('principal must be a bigint or a non-negative finite number.');
  }
  const annualYieldHuman = principalHuman * annualRate;
  return annualYieldHuman / (365 * 24 * 60 * 60);
};

/* =================================================================
 * Utility: compute aggregated deposit & yield data
 * ================================================================= */

/**
 * Compute yield summary from an array of deposits.
 *
 * @param {Deposit[]} deposits – Array of deposit objects.
 * @returns {YieldSummary}
 * @throws {Error} If deposits is not an array or contains invalid entries.
 */
const computeYieldData = (deposits) => {
  if (!Array.isArray(deposits)) {
    throw new Error('deposits must be an array.');
  }
  let totalDeposits = 0n;
  let cumulativeYield = 0;
  let totalYieldPerSecond = 0;

  for (const d of deposits) {
    // Validate required fields
    if (typeof d.amount !== 'bigint') {
      logger.warn('Deposit missing "amount" (bigint). Skipping.', { deposit: d });
      continue;
    }
    if (typeof d.apy !== 'number' || !Number.isFinite(d.apy) || d.apy < 0) {
      logger.warn('Deposit has invalid "apy". Skipping.', { deposit: d });
      continue;
    }
    if (!d.token || typeof d.token.decimals !== 'number') {
      logger.warn('Deposit missing valid "token.decimals". Skipping.', { deposit: d });
      continue;
    }

    totalDeposits += d.amount;
    // Approximate cumulative yield (replace with on‑chain data if available)
    cumulativeYield += Number(formatUnits(d.amount, d.token.decimals)) * d.apy * 0.5;

    try {
      totalYieldPerSecond += perSecondIncrement(d.apy, d.amount, d.token.decimals);
    } catch (err) {
      logger.warn('Could not compute per‑second increment for a deposit.', {
        deposit: d,
        error: err.message,
      });
    }
  }

  return { totalDeposits, totalYieldPerSecond, cumulativeYield };
};

/* =================================================================
 * Utility: Ethereum address validation
 * ================================================================= */

/**
 * Validate an Ethereum address.
 * @param {string} address
 * @returns {boolean}
 */
const isValidEthereumAddress = (address) => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

/* =================================================================
 * Utility: safe parse of amount to human-readable with fallback
 * ================================================================= */

/**
 * Format a bigint amount to a human‑readable string with limited decimals.
 * @param {bigint | undefined | null} amount
 * @param {number} decimals
 * @param {number} [displayDecimals=2]
 * @returns {string}
 */
const formatAmount = (amount, decimals, displayDecimals = 2) => {
  if (amount === undefined || amount === null) return '0';
  try {
    const formatted = Number(formatUnits(amount, decimals));
    return formatted.toFixed(displayDecimals);
  } catch (e) {
    logger.error('Error formatting amount', { amount, decimals, error: e.message });
    return '0.00';
  }
};

/* =================================================================
 * Main Component
 * ================================================================= */

/**
 * AccountPage – Premium User Profile.
 * Displays deposit metrics, live yield counter, and transaction history.
 * @returns {JSX.Element}
 */
export default function AccountPage() {
  const { address, isConnected, isDisconnected, isConnecting } = useAccount();
  const isMounted = useIsMounted();

  // Balance from wagmi
  const {
    data: balance,
    isError: balanceError,
    isLoading: balanceLoading,
  } = useBalance({ address, enabled: !!address && isConnected });

  // Deposits state
  const [deposits, setDeposits] = useState(/** @type {Deposit[]} */ ([]));
  const [depositsError, setDepositsError] = useState(/** @type {string | null} */ (null));
  const [loadingDeposits, setLoadingDeposits] = useState(false);
  const abortControllerRef = useRef(/** @type {AbortController | null} */ (null));

  // Yield counter state
  const [yieldElapsedSeconds, setYieldElapsedSeconds] = useState(0);
  const lastTimestampRef = useRef(0);
  const [counterActive, setCounterActive] = useState(false);

  // ============================
  // Fetch deposits with abort
  // ============================
  const fetchDeposits = useCallback(async () => {
    // Validate connection and address
    if (!isConnected || !address || !isValidEthereumAddress(address)) {
      setDeposits([]);
      setDepositsError(null);
      setLoadingDeposits(false);
      setCounterActive(false);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoadingDeposits(true);
    setDepositsError(null);

    try {
      const response = await fetch(`/api/deposits?address=${address}&_t=${Date.now()}`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        let errorMessage = `API error: ${response.status}`;
        if (errorBody) errorMessage += ` – ${errorBody}`;
        throw new Error(errorMessage);
      }

      /** @type {unknown} */
      const data = await response.json();

      // Validate that data is an array