tsx
// app/app/account/page.tsx
import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { getAccountMetrics, getTransactionHistory } from '../../lib/api';
import logger from '../../lib/logger';
import type { AccountMetrics, Transaction } from '../../types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const APY_BASIS = 0.05; // 5% annual percentage yield (example)
const WALLET_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/; // Ethereum address pattern
const ITEMS_PER_PAGE = 10;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface AccountPageProps {
  walletAddress?: string;
}

interface MetricsState {
  activeDeposits: number;
  cumulativeWinnings: number;
  estimatedYield: number;
}

interface TransactionFilter {
  type: 'all' | 'deposit' | 'withdraw' | 'reward';
  minAmount?: number;
  maxAmount?: number;
}

interface PaginationState {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
}

// ---------------------------------------------------------------------------
// Custom hook: Real-time yield counter
// ---------------------------------------------------------------------------

/**
 * Accumulates yield continuously using requestAnimationFrame for smooth display.
 *
 * @param activeDeposits - Total deposits currently earning yield.
 * @param apy - Annual percentage yield as a decimal (e.g., 0.05 for 5%).
 * @returns Accumulated yield in the same unit as deposits (e.g., USD).
 */
function useYieldCounter(activeDeposits: number, apy: number): number {
  const [yieldAccumulator, setYieldAccumulator] = useState<number>(0);
  const accumulatorRef = useRef<number>(0);
  const lastTimestampRef = useRef<number>(performance.now());

  useEffect(() => {
    if (activeDeposits <= 0 || apy <= 0) {
      setYieldAccumulator(0);
      return;
    }

    const yieldPerSecond = (activeDeposits * apy) / (365 * 24 * 60 * 60);
    lastTimestampRef.current = performance.now();
    accumulatorRef.current = 0;

    let animationFrameId: number;

    const tick = (currentTime: number) => {
      const elapsed = currentTime - lastTimestampRef.current;
      // Accumulate continuously to avoid losing fractional units
      accumulatorRef.current += yieldPerSecond * (elapsed / 1000);
      setYieldAccumulator(accumulatorRef.current);
      lastTimestampRef.current = currentTime;
      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [activeDeposits, apy]);

  return yieldAccumulator;
}

// ---------------------------------------------------------------------------
// Helper: Format currency
// ---------------------------------------------------------------------------

/**
 * Formats a number as USD currency string.
 *
 * @param amount - Numeric amount.
 * @returns Formatted currency string.
 */
function formatCurrency(amount: number): string {
  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

/**
 * Account page – premium user profile with real-time yield micro-counter.
 *
 * @param props - Component properties.
 * @param props.walletAddress - Connected wallet address (optional).
 * @returns JSX element.
 */
export default function AccountPage({ walletAddress }: AccountPageProps): JSX.Element {
  // -----------------------------------------------------------------------
  // State
  // -----------------------------------------------------------------------
  const [metrics, setMetrics] = useState<MetricsState>({
    activeDeposits: 0,
    cumulativeWinnings: 0,
    estimatedYield: 0,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<TransactionFilter>({ type: 'all' });
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    totalPages: 1,
    itemsPerPage: ITEMS_PER_PAGE,
  });

  // Real-time accumulated yield from custom hook
  const accruedYield = useYieldCounter(metrics.activeDeposits, APY_BASIS);

  // -----------------------------------------------------------------------
  // Data fetching
  // -----------------------------------------------------------------------

  /**
   * Fetches account metrics and transaction history from the API.
   */
  const fetchData = useCallback(async () => {
    // Validate wallet address format
    if (!walletAddress || !WALLET_ADDRESS_REGEX.test(walletAddress)) {
      setMetrics({ activeDeposits: 0, cumulativeWinnings: 0, estimatedYield: 0 });
      setTransactions([]);
      setError(null);
      setLoading(false);
      logger.warn('Invalid or missing wallet address', { wallet: walletAddress });
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [metricsData, transactionHistory] = await Promise.all([
        getAccountMetrics(walletAddress),
        getTransactionHistory(walletAddress),
      ]);

      setMetrics({
        activeDeposits: metricsData.activeDeposits ?? 0,
        cumulativeWinnings: metricsData.cumulativeWinnings ?? 0,
        estimatedYield: metricsData.estimatedYield ?? 0,
      });

      // Use the fetched data to compute totalPages, not stale state
      const fetchedTransactions = Array.isArray(transactionHistory) ? transactionHistory : [];
      setTransactions(fetchedTransactions);
      setPagination((prev) => ({
        ...prev,
        currentPage: 1,
        totalPages: Math.max(1, Math.ceil(fetchedTransactions.length / prev.itemsPerPage)),
      }));
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Unknown error while fetching account data.';
      logger.error('Failed to fetch account data', {
        wallet: walletAddress,
        error: message,
      });
      setError(message || 'Unable to load account data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // -----------------------------------------------------------------------
  // Filtered and paginated transactions
  // -----------------------------------------------------------------------

  const filteredTransactions = useMemo(() => {
    if (!transactions.length) return [];

    return transactions.filter((tx) => {
      if (filter.type !== 'all' && tx.type !== filter.type) return false;
      if (filter.minAmount !== undefined && tx.amount < filter.minAmount) return false;
      if (filter.maxAmount !== undefined && tx.amount > filter.maxAmount) return false;
      return true;
    });
  }, [transactions, filter]);

  const paginatedTransactions = useMemo(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
    return filteredTransactions.slice(startIndex, startIndex + pagination.itemsPerPage);
  }, [filteredTransactions, pagination.currentPage, pagination.itemsPerPage]);

  // Reset to first page when filter changes
  useEffect(() => {
    setPagination((prev) => ({
      ...prev,
      currentPage: 1,
      totalPages: Math.max(1, Math.ceil(filteredTransactions.length / prev.itemsPerPage)),
    }));
  }, [filteredTransactions.length]);

  // -----------------------------------------------------------------------
  // Event handlers
  // -----------------------------------------------------------------------

  const handleFilterChange = useCallback(
    (newFilter: Partial<TransactionFilter>) => {
      setFilter((prev) => ({ ...prev, ...newFilter }));
    },
    []
  );

  const handlePageChange = useCallback((page: number) => {
    setPagination((prev) => ({
      ...prev,
      currentPage: Math.max(1, Math.min(page, prev.totalPages)),
    }));
  }, []);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  if (loading) {
    return (
      <div className="account-page account-page--loading">
        <p aria-live="polite">Loading your account data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="account-page account-page--error" role="alert">
        <p>Error: {error}</p>
        <button onClick={fetchData} type="button">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="account-page">
      <section className="account-page__metrics" aria-label="Account metrics">
        <h2>Account Overview</h2>
        <p>
          Active Deposits: <strong>{formatCurrency(metrics.activeDeposits)}</strong>
        </p>
        <p>
          Cumulative Winnings: <strong>{formatCurrency(metrics.cumulativeWinnings)}</strong>
        </p>
        <p>
          Estimated Yield: <strong>{formatCurrency(metrics.estimatedYield)}</strong>
        </p>
        <p>
          Real-Time Accrued Yield:{' '}
          <strong>{formatCurrency(accruedYield)}</strong>
        </p>
      </section>

      <section className="account-page__filters" aria-label="Transaction filters">
        <label htmlFor="filter-type">Type:</label>
        <select
          id="filter-type"
          value={filter.type}
          onChange={(e) => handleFilterChange({ type: e.target.value as TransactionFilter['type'] })}
        >
          <option value="all">All</option>
          <option value="deposit">Deposit</option>
          <option value="withdraw">Withdraw</option>
          <option value="reward">Reward</option>
        </select>
      </section>

      <section className="account-page__transactions" aria-label="Transaction history">
        <h3>Transaction History</h3>
        {paginatedTransactions.length === 0 ? (
          <p>No transactions found.</p>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTransactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>{new Date(tx.timestamp).toLocaleDateString()}</td>
                    <td>{tx.type}</td>
                    <td>{formatCurrency(tx.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <nav aria-label="Pagination">
              <button
                disabled={pagination.currentPage <= 1}
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                type="button"
              >
                Previous
              </button>
              <span>
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                disabled={pagination.currentPage >= pagination.totalPages}
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                type="button"
              >
                Next
              </button>
            </nav>
          </>
        )}
      </section>
    </div>
  );
}