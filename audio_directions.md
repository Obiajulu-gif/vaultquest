jsx
// app/app/account/page.jsx
'use client';

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useWallet } from '@solana/wallet-adapter-react';

// -------------------------------------------------------------------------
// Internal Components & Utilities (assumed to exist in project)
// -------------------------------------------------------------------------
import {
  UserDepositsList,
  ConnectionStatus,
} from './components/UserDepositsList';
import { log, validatePagination } from './utils';

// -------------------------------------------------------------------------
// Constants
// -------------------------------------------------------------------------
const SECONDS_PER_YEAR = 365 * 24 * 60 * 60;
const DEFAULT_APY = 0.05;
const ITEMS_PER_PAGE = 5;
const ALLOWED_FILTERS = ['all', 'deposit', 'withdrawal', 'yield'];

// -------------------------------------------------------------------------
// Custom Hooks
// -------------------------------------------------------------------------

/**
 * Simulates real-time yield accrual using requestAnimationFrame.
 * The counter updates smoothly each second based on the elapsed time
 * between frames, ensuring accuracy even when the tab is in background.
 *
 * @param {number} deposit - Total active deposit amount (must be >= 0).
 * @param {number} apy - Annual Percentage Yield as a decimal (e.g., 0.05 for 5%).
 * @returns {number} The accumulated yield amount, updated every second.
 */
function useYieldCounter(deposit, apy) {
  const [yieldAccrued, setYieldAccrued] = useState(0);
  const accumulatedRef = useRef(0);
  const lastTimestampRef = useRef(Date.now());
  const isRunningRef = useRef(true);

  useEffect(() => {
    if (!Number.isFinite(deposit) || deposit <= 0 || !Number.isFinite(apy) || apy <= 0) {
      // Reset counter when values are invalid
      setYieldAccrued(0);
      accumulatedRef.current = 0;
      return;
    }

    const annualYield = deposit * apy;
    const perSecond = annualYield / SECONDS_PER_YEAR;

    accumulatedRef.current = 0;
    lastTimestampRef.current = Date.now();
    isRunningRef.current = true;

    /** @type {number} */
    let animationFrameId;

    /**
     * Core tick function called by requestAnimationFrame.
     * Accumulates yield every second based on elapsed time.
     */
    const tick = () => {
      if (!isRunningRef.current) return;

      const now = Date.now();
      const elapsed = (now - lastTimestampRef.current) / 1000;

      if (elapsed >= 1) {
        const increments = Math.floor(elapsed);
        accumulatedRef.current += perSecond * increments;
        const clamped = Math.round(accumulatedRef.current * 100) / 100;
        lastTimestampRef.current = now;
        setYieldAccrued(clamped);
      }

      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);

    return () => {
      isRunningRef.current = false;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [deposit, apy]);

  return yieldAccrued;
}

// -------------------------------------------------------------------------
// Validation Helpers
// -------------------------------------------------------------------------

/**
 * Ensures the value is a non-negative finite number.
 * Logs a warning if invalid.
 *
 * @param {*} value - Value to check.
 * @param {string} fieldName - Context name for logging.
 * @returns {boolean} True if valid.
 */
function isValidNonNegativeFinite(value, fieldName) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    log.warn(`Validation failed: ${fieldName} must be a non-negative finite number, received ${value}`);
    return false;
  }
  return true;
}

/**
 * Validates the structure of an array of deposit objects.
 *
 * @param {*} data - Parsed JSON from API.
 * @returns {boolean} True if data is an array of objects with required fields.
 */
function isValidDepositsResponse(data) {
  if (!Array.isArray(data)) {
    log.error('Deposits API response must be an array');
    return false;
  }

  return data.every((item, index) => {
    if (!item || typeof item !== 'object') {
      log.error(`Deposit item at index ${index} is not an object`, item);
      return false;
    }
    if (!isValidNonNegativeFinite(item.amount, `deposits[${index}].amount`)) {
      return false;
    }
    return true;
  });
}

/**
 * Validates the structure of the user stats response.
 *
 * @param {*} data - Parsed JSON from API.
 * @returns {boolean} True if required numeric fields exist.
 */
function isValidStatsResponse(data) {
  if (!data || typeof data !== 'object') {
    log.error('Stats API response must be an object');
    return false;
  }

  const required = ['cumulativeWinnings', 'apy'];
  return required.every((key) => {
    if (typeof data[key] !== 'number') {
      log.error(`Stats API response missing or invalid field: ${key}`);
      return false;
    }
    return true;
  });
}

// -------------------------------------------------------------------------
// Fallback UI for Error Boundary
// -------------------------------------------------------------------------

/**
 * Error boundary fallback component.
 *
 * @param {{ error: Error }} props - Error boundary fallback props.
 * @returns {JSX.Element}
 */
function ErrorFallback({ error }) {
  log.error('Unhandled error in AccountPage:', error.message);
  return (
    <div className="error-container" role="alert">
      <h2>Something went wrong</h2>
      <pre>{error.message}</pre>
      <button onClick={() => window.location.reload()}>Reload page</button>
    </div>
  );
}

// -------------------------------------------------------------------------
// Loading Spinner Component
// -------------------------------------------------------------------------

/**
 * Simple loading spinner displayed during data fetching.
 *
 * @returns {JSX.Element}
 */
function LoadingSpinner() {
  return (
    <div className="loading-spinner" role="status" aria-label="Loading">
      <div className="spinner"></div>
      <p>Loading your account data...</p>
    </div>
  );
}

// -------------------------------------------------------------------------
// Metrics Card Component
// -------------------------------------------------------------------------

/**
 * Glassmorphic card displaying a metric with a label and value.
 *
 * @param {{ label: string, value: string | number, icon?: string, testId?: string }} props
 * @returns {JSX.Element}
 */
function MetricCard({ label, value, icon, testId }) {
  return (
    <article className="metric-card glassmorphic" data-testid={testId} aria-label={`${label}: ${value}`}>
      {icon && <span className="metric-icon" aria-hidden="true">{icon}</span>}
      <div className="metric-content">
        <p className="metric-label">{label}</p>
        <p className="metric-value">{value}</p>
      </div>
    </article>
  );
}

// -------------------------------------------------------------------------
// Filter Buttons Component
// -------------------------------------------------------------------------

/**
 * Renders filter buttons for the transaction list.
 *
 * @param {{ currentFilter: string, onFilterChange: (filter: string) => void }} props
 * @returns {JSX.Element}
 */
function TransactionFilters({ currentFilter, onFilterChange }) {
  return (
    <div className="transaction-filters" role="group" aria-label="Filter transactions">
      {ALLOWED_FILTERS.map((f) => (
        <button
          key={f}
          className={`filter-btn ${currentFilter === f ? 'active' : ''}`}
          onClick={() => onFilterChange(f)}
          aria-pressed={currentFilter === f}
        >
          {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
        </button>
      ))}
    </div>
  );
}

// -------------------------------------------------------------------------
// Pagination Component
// -------------------------------------------------------------------------

/**
 * Pagination controls for transaction list.
 *
 * @param {{ currentPage: number, totalPages: number, onPageChange: (page: number) => void }} props
 * @returns {JSX.Element}
 */
function Pagination({ currentPage, totalPages, onPageChange }) {
  return (
    <nav className="pagination" aria-label="Transaction pagination">
      <button
        className="page-btn"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        aria-label="Previous page"
      >
        &laquo; Prev
      </button>
      <span className="page-info" aria-current="page">
        Page {currentPage} of {totalPages}
      </span>
      <button
        className="page-btn"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        aria-label="Next page"
      >
        Next &raquo;
      </button>
    </nav>
  );
}

// -------------------------------------------------------------------------
// Empty State Component
// -------------------------------------------------------------------------

/**
 * Displays when no wallet is connected.
 *
 * @returns {JSX.Element}
 */
function EmptyState() {
  return (
    <div className="empty-state" role="status">
      <h3>No wallet connected</h3>
      <p>Please connect your wallet to view your account details and start earning yield.</p>
    </div>
  );
}

// -------------------------------------------------------------------------
// Main Account Page Component
// -------------------------------------------------------------------------

/**
 * Account page displaying user profile, metrics, and transaction history.
 * Handles loading, empty, and error states.
 *
 * @returns {JSX.Element}
 */
function AccountPage() {
  const { publicKey, connected } = useWallet();

  // State for data fetching
  const [stats, setStats] = useState(null);
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter and pagination state
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Track previous wallet address to detect changes
  const previousWalletRef = useRef(null);

  // -----------------------------------------------------------------------
  // Data Fetching
  // -----------------------------------------------------------------------

  /**
   * Fetches user stats and deposits from API.
   * Validates responses and handles errors gracefully.
   *
   * @returns {Promise<void>}
   */
  const fetchAccountData = useCallback(async () => {
    if (!connected || !publicKey) {
      setStats(null);
      setDeposits([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const walletAddress = publicKey.toBase58();

      // Fetch user stats
      const statsResponse = await fetch(`/api/users/${walletAddress}/stats`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!statsResponse.ok) {
        throw new Error(`Stats API returned status ${statsResponse.status}`);
      }

      const statsData = await statsResponse.json();

      if (!isValidStatsResponse(statsData)) {
        throw new Error('Invalid stats response structure');
      }

      setStats(statsData);

      // Fetch deposits/transactions
      const depositsResponse = await fetch(`/api/users/${walletAddress}/deposits`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!depositsResponse.ok) {
        throw new Error(`Deposits API returned status ${depositsResponse.status}`);
      }

      const depositsData = await depositsResponse.json();

      if (!isValidDepositsResponse(depositsData)) {
        throw new Error('Invalid deposits response structure');
      }

      setDeposits(depositsData);
      log.info('Account data fetched successfully', { walletAddress });
    } catch (err) {
      log.error('Failed to fetch account data:', err.message);
      setError(err.message);
      setStats(null);
      setDeposits([]);
    } finally {
      setLoading(false);
    }
  }, [publicKey, connected]);

  // Fetch data on wallet connection change
  useEffect(() => {
    const currentWallet = publicKey?.toBase58();
    if (currentWallet !== previousWalletRef.current) {
      previousWalletRef.current = currentWallet;
      setCurrentPage(1);
      setFilter('all');
      fetchAccountData();
    }
  }, [fetchAccountData, publicKey]);

  // -----------------------------------------------------------------------
  // Derived data
  // -----------------------------------------------------------------------

  const apy = stats?.apy ?? DEFAULT_APY;
  const cumulativeWinnings = stats?.cumulativeWinnings ?? 0;

  // Calculate total active deposits (sum of all deposit amounts)
  const totalDeposits = useMemo(() => {
    if (!Array.isArray(deposits) || deposits.length === 0) return 0;
    return deposits.reduce((sum, d) => {
      if (d.type === 'deposit') {
        return sum + (Number.isFinite(d.amount) ? d.amount : 0);
      }
      return sum;
    }, 0);
  }, [deposits]);

  // Real-time yield counter
  const liveYield = useYieldCounter(totalDeposits, apy);

  // Format cumulative winnings
  const formattedWinnings = useMemo(() => {
    if (!Number.isFinite(cumulativeWinnings)) return 'N/A';
    return cumulativeWinnings.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, [cumulativeWinnings]);

  // Format total deposits
  const formattedDeposits = useMemo(() => {
    if (!Number.isFinite(totalDeposits)) return 'N/A';
    return totalDeposits.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, [totalDeposits]);

  // Filter deposits by type
  const filteredDeposits = useMemo(() => {
    if (filter === 'all') return deposits;
    return deposits.filter((d) => d.type === filter);
  }, [deposits, filter]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredDeposits.length / ITEMS_PER_PAGE));
  const paginatedDeposits = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredDeposits.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredDeposits, currentPage]);

  // -----------------------------------------------------------------------
  // Event Handlers
  // -----------------------------------------------------------------------

  const handleFilterChange = useCallback((newFilter) => {
    setFilter(newFilter);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  }, [totalPages]);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  // If not connected, show empty state
  if (!connected) {
    return (
      <div className="account-page" role="main">
        <EmptyState />
      </div>
    );
  }

  // Show loading spinner
  if (loading) {
    return (
      <div className="account-page" role="main">
        <LoadingSpinner />
      </div>
    );
  }

  // Show error with retry
  if (error) {
    return (
      <div className="account-page error" role="alert">
        <h2>Error loading account</h2>
        <p>{error}</p>
        <button onClick={fetchAccountData}>Retry</button>
      </div>
    );
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className="account-page" role="main">
        {/* Header */}
        <header className="account-header">
          <h1>Your VaultQuest Profile</h1>
          <ConnectionStatus />
        </header>

        {/* Metrics Cards */}
        <section className="metrics-grid" aria-label="Account metrics">
          <MetricCard
            label="Active Deposits"
            value={`$${formattedDeposits}`}
            icon="💰"
            testId="metric-active-deposits"
          />
          <MetricCard
            label="Cumulative Winnings"
            value={`$${formattedWinnings}`}
            icon="🏆"
            testId="metric-cumulative-winnings"
          />
          <MetricCard
            label="Yield Earnings (Live)"
            value={`$${liveYield.toFixed(2)}`}
            icon="⚡"
            testId="metric-yield-earnings"
          />
        </section>

        {/* Transactions Section */}
        <section className="transactions-section" aria-label="Transaction history">
          <h2>Transaction History</h2>
          <TransactionFilters
            currentFilter={filter}
            onFilterChange={handleFilterChange}
          />
          {paginatedDeposits.length > 0 ? (
            <>
              <UserDepositsList deposits={paginatedDeposits} />
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </>
          ) : (
            <div className="no-transactions" role="status">
              <p>No transactions found for this filter.</p>
            </div>
          )}
        </section>
      </div>
    </ErrorBoundary>
  );
}

export default AccountPage;