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
      if (!Array.isArray(data)) {
        throw new Error('API response is not an array.');
      }

      // Validate each deposit (partial – we rely on computeYieldData for deeper checks)
      for (const item of data) {
        if (typeof item.amount !== 'bigint' || typeof item.apy !== 'number' || !item.token || typeof item.token.decimals !== 'number') {
          logger.warn('Invalid deposit entry received from API.', { item });
        }
      }

      setDeposits(data);
      setCounterActive(true);
    } catch (err) {
      if (err.name === 'AbortError') {
        logger.info('Fetch deposits aborted.');
        return;
      }
      logger.error('Failed to fetch deposits.', { error: err.message });
      setDepositsError(err.message);
      setDeposits([]);
      setCounterActive(false);
    } finally {
      if (isMounted()) {
        setLoadingDeposits(false);
      }
    }
  }, [address, isConnected, isMounted]);


  // Fetch deposits on mount / address change
  useEffect(() => {
    fetchDeposits();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchDeposits]);

  // ============================
  // Computed yield data
  // ============================
  const {
    totalDeposits,
    totalYieldPerSecond,
    cumulativeYield,
  } = useMemo(() => {
    if (deposits.length === 0) {
      return { totalDeposits: 0n, totalYieldPerSecond: 0, cumulativeYield: 0 };
    }
    try {
      return computeYieldData(deposits);
    } catch (err) {
      logger.error('Error computing yield data.', { error: err.message });
      return { totalDeposits: 0n, totalYieldPerSecond: 0, cumulativeYield: 0 };
    }
  }, [deposits]);

  // Convert totalDeposits to human-readable for display
  const totalDepositsHuman = useMemo(() => {
    if (totalDeposits === 0n) return '0.00';
    // Use first deposit's token decimals as reference (assuming consistent)
    const decimals = deposits.length > 0 ? deposits[0].token.decimals : 18;
    return formatAmount(totalDeposits, decimals);
  }, [totalDeposits, deposits]);

  // ============================
  // Real-time yield counter (requestAnimationFrame)
  // ============================
  useEffect(() => {
    if (!counterActive || totalYieldPerSecond <= 0) {
      setYieldElapsedSeconds(0);
      return;
    }

    let animationFrameId;
    const startTime = performance.now();
    lastTimestampRef.current = startTime;

    const tick = (timestamp) => {
      if (!isMounted()) return;
      const delta = timestamp - lastTimestampRef.current;
      // Accumulate elapsed seconds (with sub-second precision)
      setYieldElapsedSeconds(prev => prev + delta / 1000);
      lastTimestampRef.current = timestamp;
      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [counterActive, totalYieldPerSecond, isMounted]);

  // Current yield earnings
  const currentYield = useMemo(() => {
    return totalYieldPerSecond * yieldElapsedSeconds;
  }, [totalYieldPerSecond, yieldElapsedSeconds]);

  // Format current yield for display
  const currentYieldDisplay = useMemo(() => {
    if (currentYield === 0) return '0.000000';
    return currentYield.toFixed(6);
  }, [currentYield]);

  // Cumulative yield (real + simulated)
  const totalYieldDisplay = useMemo(() => {
    const total = cumulativeYield + currentYield;
    if (total === 0) return '0.00';
    return total.toFixed(2);
  }, [cumulativeYield, currentYield]);

  // ============================
  // Render logic
  // ============================

  // Loading state for deposits
  const isDepositsLoading = loadingDeposits && isConnected;

  // Determine if wallet is connected
  const isWalletConnected = isConnected && !!address && isValidEthereumAddress(address);

  return (
    <ErrorBoundary>
      <div className="account-page container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className={`text-4xl font-bold ${gradientText}`}>
            Premium Profile
          </h1>
          {isWalletConnected && (
            <p className="text-gray-400 mt-2">
              Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
            </p>
          )}
        </header>

        {/* Metrics Cards */}
        <section className={`${responsiveGrid} gap-6 mb-8`}>
          <MetricCard
            title="Active Deposits"
            value={`$${totalDepositsHuman}`}
            loading={isDepositsLoading || balanceLoading}
            error={depositsError || (balanceError ? 'Balance error' : null)}
            className={glassmorphicCard}
          />
          <MetricCard
            title="Cumulative Winnings"
            value={`$${totalYieldDisplay}`}
            loading={isDepositsLoading}
            error={depositsError}
            className={glassmorphicCard}
          />
          <MetricCard
            title="Yield Earnings (Live)"
            value={`$${currentYieldDisplay}`}
            loading={!counterActive && isConnected}
            error={null}
            className={`${glassmorphicCard} ${microCounter}`}
          />
        </section>

        {/* Transaction History */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Transaction History</h2>
          {isWalletConnected ? (
            <UserDepositsList deposits={deposits} loading={isDepositsLoading} error={depositsError} />
          ) : (
            <div className={`${glassmorphicCard} p-8 text-center`}>
              <p className="text-gray-400 text-lg">No wallet connected.</p>
              <p className="text-gray-500 mt-2">Please connect your wallet to see your deposits and yield.</p>
            </div>
          )}
        </section>
      </div>
    </ErrorBoundary>
  );
}