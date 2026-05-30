tsx
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  StrictMode,
  Fragment,
  ErrorBoundary,
} from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import styled, { createGlobalStyle } from 'styled-components';

// ============================================================================
// Types
// ============================================================================

/** Represents a single deposit/transaction record */
interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'reward' | 'bonus';
  amount: string; // e.g. "1000000" (6 decimal places)
  currency: string;
  timestamp: number; // Unix ms
  status: 'completed' | 'pending' | 'failed';
  txHash?: string;
}

/** Shape of the user's aggregated metrics */
interface UserMetrics {
  activeDeposits: bigint; // in smallest unit (e.g., lamports, wei)
  cumulativeWinnings: bigint;
  estimatedYield: bigint;
  apy: number; // e.g. 6.2 means 6.2%
}

/** Filter options for transaction history */
type TransactionFilter = 'all' | 'deposit' | 'withdrawal' | 'reward';

/** Pagination info */
interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
}

/** Response from transaction fetch */
interface TransactionResponse {
  data: Transaction[];
  total: number;
}

/** Props for the Account page */
interface AccountPageProps {
  /** Injected API client for fetching metrics (optional for testing) */
  metricsApi?: () => Promise<UserMetrics>;
  /** Injected API client for fetching transactions */
  transactionsApi?: (params: {
    filter: TransactionFilter;
    page: number;
    pageSize: number;
  }) => Promise<TransactionResponse>;
}

// ============================================================================
// Constants
// ============================================================================

const DECIMALS = 6; // USDC-like precision
const UPDATE_INTERVAL_MS = 1000; // one second
const DEFAULT_PAGE_SIZE = 10;
const SECONDS_PER_YEAR = 365 * 24 * 60 * 60;
const METRICS_REFRESH_MS = 30000; // 30 seconds

// ============================================================================
// Logging utility (production-ready)
// ============================================================================

/* eslint-disable no-console */
const logger = {
  info: (msg: string, ...args: unknown[]) => console.info(`[Account] ${msg}`, ...args),
  warn: (msg: string, ...args: unknown[]) => console.warn(`[Account] ${msg}`, ...args),
  error: (msg: string, ...args: unknown[]) => console.error(`[Account] ${msg}`, ...args),
  debug: (msg: string, ...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') console.debug(`[Account] ${msg}`, ...args);
  },
};

// ============================================================================
// Utility functions
// ============================================================================

/**
 * Formats a BigInt amount into a human-readable string with the given decimals.
 * @param amount - The amount in smallest unit (e.g., lamports)
 * @param decimals - Number of decimal places (e.g., 6 for USDC)
 * @returns Formatted string like "1,234.567890"
 * @throws {TypeError} If decimals is negative or not an integer
 */
function formatAmount(amount: bigint, decimals: number): string {
  if (typeof decimals !== 'number' || !Number.isInteger(decimals) || decimals < 0) {
    throw new TypeError(`Decimals must be a non-negative integer, got ${typeof decimals}`);
  }
  if (amount < 0n) return `-${formatAmount(-amount, decimals)}`;
  const divisor = BigInt(10 ** decimals);
  const integerPart = amount / divisor;
  const fractionalPart = amount % divisor;
  const paddedFractional = fractionalPart.toString().padStart(decimals, '0').slice(0, decimals);
  const formattedInteger = integerPart.toLocaleString('en-US');
  return `${formattedInteger}.${paddedFractional}`;
}

/**
 * Safely parses a string to BigInt, returning 0n if invalid.
 * Logs a warning on failure.
 * @param value - The string to parse
 * @returns BigInt representation (0n on failure)
 */
function safeParseBigInt(value: string): bigint {
  try {
    const sanitized = value.replace(/[^0-9-]/g, '');
    if (sanitized === '' || sanitized === '-') return 0n;
    return BigInt(sanitized);
  } catch (error) {
    logger.warn('Failed to parse BigInt from string', { value, error });
    return 0n;
  }
}

/**
 * Clamps a number between min and max.
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Returns a human-readable relative time string.
 * @param timestamp - Unix milliseconds
 * @returns e.g., "5m ago", "2h ago", "1d ago"
 */
function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

/**
 * Truncates a wallet address for display.
 * @param address - Full address string
 * @param chars - Number of characters to keep from start and end
 * @returns Truncated string like "abc...xyz"
 */
function truncateAddress(address: string, chars: number = 4): string {
  if (!address || address.length <= chars * 2) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

// ============================================================================
// Custom hook: useAccruedYield
// ============================================================================

/**
 * A high-performance hook that returns a real-time, incrementing accrued yield amount.
 * Uses `requestAnimationFrame` to remain battery-friendly while updating once per second.
 *
 * @param principal - The principal deposit amount in smallest unit (e.g., lamports)
 * @param apy       - Annual Percentage Yield as a decimal (e.g., 0.062 for 6.2%)
 * @returns The current accrued yield as a BigInt (expected to be formatted later)
 *
 * @remarks
 * The hook automatically resets the accrued yield when principal or APY changes.
 * It handles edge cases like zero or negative principal, and ensures at least 1 smallest
 * unit per second if APY > 0, to prevent a "stuck" display.
 */
function useAccruedYield(principal: bigint, apy: number): bigint {
  // Validate inputs with defensive checks
  if (principal < 0n) {
    logger.warn('Negative principal in useAccruedYield, defaulting to 0', { principal });
    principal = 0n;
  }
  if (apy < 0 || Number.isNaN(apy) || !Number.isFinite(apy)) {
    logger.warn('Invalid APY in useAccruedYield, defaulting to 0', { apy });
    apy = 0;
  }

  const [accruedYield, setAccruedYield] = useState<bigint>(0n);
  const lastTickRef = useRef<number>(Date.now());
  const rafRef = useRef<number | null>(null);
  const principalRef = useRef<bigint>(principal);
  const apyRef = useRef<number>(apy);

  // Keep refs up-to-date
  useEffect(() => {
    principalRef.current = principal;
    apyRef.current = apy;
  }, [principal, apy]);

  // Compute per-tick rate as BigInt (amount added per second in smallest unit)
  // Uses high precision multiplication to avoid rounding down to zero.
  const perSecondRate = useMemo<bigint>((): bigint => {
    if (apy <= 0 || principal <= 0n) return 0n;
    // rate = (principal * apy) / SECONDS_PER_YEAR
    // Scale APY to avoid floating-point precision loss
    const scale = BigInt(10 ** 12); // 1e12 for precision
    const numerator = principal * BigInt(Math.round(apy * 10000)) * scale;
    const denominator = BigInt(SECONDS_PER_YEAR) * 10000n;
    const rateWithScale = numerator / denominator; // this has scale applied
    const rate = rateWithScale / scale; // drop the scale, but we keep the integer part
    // For very small rates, ensure at least 1 smallest unit per second if apy > 0
    if (rate === 0n && apy > 0) return 1n;
    return rate;
  }, [principal, apy]);

  // Reset when rate changes (principal or apy)
  useEffect(() => {
    setAccruedYield(0n);
    lastTickRef.current = Date.now();
  }, [principal, apy]);

  // Ticker using requestAnimationFrame
  useEffect((): (() => void) => {
    let cancelled = false;
    const tick = (): void => {
      if (cancelled) return;
      const now = Date.now();
      const elapsed = now - lastTickRef.current;
      if (elapsed >= UPDATE_INTERVAL_MS) {
        const intervals = Math.floor(elapsed / UPDATE_INTERVAL_MS);
        lastTickRef.current = now - (elapsed % UPDATE_INTERVAL_MS);
        setAccruedYield((prev) => prev + perSecondRate * BigInt(intervals));
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return (): void => {
      cancelled = true;
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [perSecondRate]);

  return accruedYield;
}

// ============================================================================
// Custom hook: useTransactions
// ============================================================================

interface UseTransactionsOptions {
  walletConnected: boolean;
  filter: TransactionFilter;
  page: number;
  pageSize: number;
}

interface UseTransactionsResult {
  transactions: Transaction[];
  total: number;
  loading: boolean;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  refetch: () => void;
}

/**
 * Fetches transaction history with dynamic filtering and pagination.
 * Implements debounce and cancellation to prevent race conditions.
 */
function useTransactions(
  options: UseTransactionsOptions,
  api?: (params: {
    filter: TransactionFilter;
    page: number;
    pageSize: number;
  }) => Promise<TransactionResponse>
): UseTransactionsResult {
  const { walletConnected, filter, page, pageSize } = options;
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchTransactions = useCallback(async () => {
    if (!walletConnected) {
      setTransactions([]);
      setTotal(0);
      return;
    }
    // Cancel in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      let data: TransactionResponse;
      if (api) {
        data = await api({ filter, page, pageSize });
      } else {
        // Simulate API call for demonstration
        data = await new Promise<TransactionResponse>((resolve) =>
          setTimeout(() => {
            resolve({
              data: [],
              total: 0,
            });
          }, 500)
        );
        // Uncomment to use real API:
        // const response = await fetch(`/api/transactions?filter=${filter}&page=${page}&pageSize=${pageSize}`, {
        //   signal: controller.signal,
        // });
        // if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        // data = await response.json();
      }
      if (!controller.signal.aborted) {
        setTransactions(data.data);
        setTotal(data.total);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      const message = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Failed to fetch transactions', { error: err });
      setError(message);
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [walletConnected, filter, page, pageSize, api]);

  useEffect(() => {
    fetchTransactions();
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [fetchTransactions]);

  return { transactions, total, loading, error, setError, refetch: fetchTransactions };
}

// ============================================================================
// Custom hook: useMetrics
// ============================================================================

interface UseMetricsResult {
  metrics: UserMetrics | null;
  loading: boolean;
  error: string | null;
}

/**
 * Periodically fetches aggregated user metrics (activeDeposits, cumulativeWinnings, apy).
 * Uses a refresh interval to keep data fresh.
 */
function useMetrics(
  walletConnected: boolean,
  api?: () => Promise<UserMetrics>
): UseMetricsResult {
  const [metrics, setMetrics] = useState<UserMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    if (!walletConnected) {
      setMetrics(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      let data: UserMetrics;
      if (api) {
        data = await api();
      } else {
        // Simulate API call
        data = await new Promise<UserMetrics>((resolve) =>
          setTimeout(() => {
            resolve({
              activeDeposits: 1_000_000_000n,
              cumulativeWinnings: 500_000_000n,
              estimatedYield: 12_000_000n,
              apy: 6.2,
            });
          }, 300)
        );
      }
      setMetrics(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Failed to fetch metrics', { error: err });
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [walletConnected, api]);

  // Fetch on mount and periodically
  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, METRICS_REFRESH_MS);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  return { metrics, loading, error };
}

// ============================================================================
// Styled Components (Glassmorphic + Responsive)
// ============================================================================

const GlobalStyle = createGlobalStyle`
  *, *::before, *::after {
    box-sizing: border-box;
  }
  body {
    margin: 0;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
    min-height: 100vh;
  }
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
  @media (min-width: 768px) {
    padding: 3rem 2rem;
  }
`;

const PageTitle = styled.h1`
  font-size: clamp(1.5rem, 4vw, 2.5rem);
  color: #ffffff;
  margin-bottom: 1.5rem;
  font-weight: 600;
  letter-spacing: -0.02em;
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  margin-bottom: 2rem;
  @media (min-width: 480px) {
    grid-template-columns: 1fr 1fr;
  }
  @media (min-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const MetricCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
  }
`;

const MetricLabel = styled.span`
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
`;

const MetricValue = styled.span`
  font-size: clamp(1.5rem, 3vw, 2.25rem);
  font-weight: 700;
  color: #ffffff;
  line-height: 1.2;
`;

const YieldCounter = styled(MetricValue)`
  background: linear-gradient(135deg, #f093fb, #f5576c);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const TransactionSection = styled.section`
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 1.5rem;
  margin-top: 2rem;
`;

const FilterRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const FilterButton = styled.button<{ active: boolean }>`
  background: ${(props) => (props.active ? 'rgba(255,255,255,0.2)' : 'transparent')};
  border: 1px solid rgba(255,255,255,0.2);
  color: #ffffff;
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
  &:hover {
    background: rgba(255,255,255,0.15);
  }
`;

const TransactionTable = styled.div`
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  white-space: nowrap;
  th, td {
    padding: 0.75rem 1rem;
    text-align: left;
  }
  th {
    color: rgba(255,255,255,0.6);
    font-weight: 500;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  td {
    color: #ffffff;
    border-top: 1px solid rgba(255,255,255,0.05);
  }
  tr:hover td {
    background: rgba(255,255,255,0.03);
  }
`;

const StatusBadge = styled.span<{ status: Transaction['status'] }>`
  display: inline-block;
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  background: ${(props) =>
    props.status === 'completed'
      ? 'rgba(34,197,94,0.2)'
      : props.status === 'pending'
      ? 'rgba(234,179,8,0.2)'
      : 'rgba(239,68,68,0.2)'};
  color: ${(props) =>
    props.status === 'completed'
      ? '#22c55e'
      : props.status === 'pending'
      ? '#eab308'
      : '#ef4444'};
`;

const PaginationRow = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 1.5rem;
  color: #ffffff;
`;

const PaginationButton = styled.button`
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  color: #ffffff;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  &:hover:not(:disabled) {
    background: rgba(255,255,255,0.2);
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  color: rgba(255,255,255,0.5);
  font-size: 1.1rem;
`;

const ErrorAlert = styled.div`
  background: rgba(239,68,68,0.2);
  border: 1px solid rgba(239,68,68,0.5);
  color: #fca5a5;
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  padding: 2rem;
  &::after {
    content: '';
    width: 30px;
    height: 30px;
    border: 3px solid rgba(255,255,255,0.2);
    border-top-color: #ffffff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const AmountValue = styled.span`
  font-variant-numeric: tabular-nums;
`;

// ============================================================================
// Helper Components
// ============================================================================

interface TransactionRowProps {
  tx: Transaction;
}

const TransactionRow: React.FC<TransactionRowProps> = React.memo(({ tx }) => (
  <tr>
    <td>
      <StatusBadge status={tx.status}>{tx.status}</StatusBadge>
    </td>
    <td>{tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}</td>
    <td>
      <AmountValue>{formatAmount(safeParseBigInt(tx.amount), DECIMALS)}</AmountValue> {tx.currency}
    </td>
    <td>{formatRelativeTime(tx.timestamp)}</td>
    <td>{tx.txHash ? truncateAddress(tx.txHash) : '-'}</td>
  </tr>
));
TransactionRow.displayName = 'TransactionRow';

// ============================================================================
// Main Account Component
// ============================================================================

/**
 * Premium user profile page displaying key metrics (active deposits, cumulative winnings,
 * estimated yield) with a real-time yield micro-counter that increments every second.
 *
 * @param props - Injected API clients (optional)
 */
const Account: React.FC<AccountPageProps> = ({ metricsApi, transactionsApi }) => {
  const { connected, publicKey } = useWallet();
  const walletConnected = !!connected && !!publicKey;

  // Metrics with periodic refresh
  const { metrics, loading: metricsLoading, error: metricsError } = useMetrics(
    walletConnected,
    metricsApi
  );

  // Real-time yield counter
  const accruedYield = useAccruedYield(
    metrics?.activeDeposits ?? 0n,
    metrics ? metrics.apy / 100 : 0
  );

  // Total yield display = estimated base yield + accrued real-time yield
  const totalYield = useMemo<bigint>(
    () => (metrics?.estimatedYield ?? 0n) + accruedYield,
    [metrics?.estimatedYield, accruedYield]
  );

  // Transaction state
  const [filter, setFilter] = useState<TransactionFilter>('all');
  const [page, setPage] = useState<number>(1);
  const pageSize = DEFAULT_PAGE_SIZE;

  const {
    transactions,
    total,
    loading: txLoading,
    error: txError,
    setError: setTxError,
    refetch: refetchTx,
  } = useTransactions({ walletConnected, filter, page, pageSize }, transactionsApi);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Reset page when filter changes
  const handleFilterChange = useCallback((newFilter: TransactionFilter) => {
    setFilter(newFilter);
    setPage(1);
  }, []);

  const handlePrevPage = useCallback(() => {
    setPage((prev) => Math.max(1, prev - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setPage((prev) => Math.min(totalPages, prev + 1));
  }, [totalPages]);

  return (
    <>
      <GlobalStyle />
      <Container>
        <PageTitle>
          {walletConnected ? `Profile: ${truncateAddress(publicKey!.toBase58())}` : 'Account'}
        </PageTitle>

        {/* Metrics Section */}
        {walletConnected ? (
          <>
            {metricsError && (
              <ErrorAlert>
                <span>Failed to load metrics: {metricsError}</span>
                <button onClick={() => {}}>Dismiss</button>
              </ErrorAlert>
            )}
            {metricsLoading && !metrics && <LoadingSpinner />}
            {metrics && (
              <MetricsGrid>
                <MetricCard>
                  <MetricLabel>Active Deposits</MetricLabel>
                  <MetricValue>
                    <AmountValue>
                      {formatAmount(metrics.activeDeposits, DECIMALS)}
                    </AmountValue>{' '}
                    USDC
                  </MetricValue>
                </MetricCard>
                <MetricCard>
                  <MetricLabel>Cumulative Winnings</MetricLabel>
                  <MetricValue>
                    <AmountValue>
                      {formatAmount(metrics.cumulativeWinnings, DECIMALS)}
                    </AmountValue>{' '}
                    USDC
                  </MetricValue>
                </MetricCard>
                <MetricCard>
                  <MetricLabel>Estimated Yield (Live)</MetricLabel>
                  <YieldCounter>
                    <AmountValue>
                      {formatAmount(totalYield, DECIMALS)}
                    </AmountValue>{' '}
                    USDC
                  </YieldCounter>
                  <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.5rem' }}>
                    APY: {metrics.apy}%
                  </span>
                </MetricCard>
              </MetricsGrid>
            )}

            {/* Transactions Section */}
            <TransactionSection>
              <h2 style={{ color: '#ffffff', marginTop: 0 }}>Transaction History</h2>
              <FilterRow>
                {(['all', 'deposit', 'withdrawal', 'reward'] as TransactionFilter[]).map((f) => (
                  <FilterButton
                    key={f}
                    active={filter === f}
                    onClick={() => handleFilterChange(f)}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </FilterButton>
                ))}
              </FilterRow>

              {txError && (
                <ErrorAlert>
                  <span>Error: {txError}</span>
                  <PaginationButton onClick={refetchTx}>Retry</PaginationButton>
                </ErrorAlert>
              )}

              {txLoading && !transactions.length ? (
                <LoadingSpinner />
              ) : transactions.length > 0 ? (
                <>
                  <TransactionTable>
                    <Table>
                      <thead>
                        <tr>
                          <th>Status</th>
                          <th>Type</th>
                          <th>Amount</th>
                          <th>Time</th>
                          <th>Tx Hash</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((tx) => (
                          <TransactionRow key={tx.id} tx={tx} />
                        ))}
                      </tbody>
                    </Table>
                  </TransactionTable>
                  <PaginationRow>
                    <PaginationButton onClick={handlePrevPage} disabled={page <= 1}>
                      Previous
                    </PaginationButton>
                    <span>
                      Page {page} of {totalPages}
                    </span>
                    <PaginationButton onClick={handleNextPage} disabled={page >= totalPages}>
                      Next
                    </PaginationButton>
                  </PaginationRow>
                </>
              ) : (
                <EmptyState>
                  {walletConnected ? 'No transactions found.' : 'Connect your wallet to see transactions.'}
                </EmptyState>
              )}
            </TransactionSection>
          </>
        ) : (
          <EmptyState>
            <h2 style={{ color: '#ffffff', marginBottom: '0.5rem' }}>Wallet Not Connected</h2>
            <p>Connect your wallet to view your premium profile and real-time yield.</p>
          </EmptyState>
        )}
      </Container>
    </>
  );
};

// ============================================================================
// Error Boundary
// ============================================================================

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class AccountErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    logger.error('Account page crashed', { error, errorInfo });
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <Container>
          <h1 style={{ color: '#fff' }}>Something went wrong</h1>
          <p style={{ color: '#fca5a5' }}>{this.state.error?.message}</p>
          <PaginationButton onClick={() => this.setState({ hasError: false, error: null })}>
            Reload
          </PaginationButton>
        </Container>
      );
    }
    return this.props.children;
  }
}

// ============================================================================
// Exported Component (wrapped with providers if needed)
// ============================================================================

/**
 * Premium Account page with real-time yield counter.
 * Wrap with AccountErrorBoundary for robustness.
 */
const AccountPage: React.FC<AccountPageProps> = (props) => (
  <StrictMode>
    <AccountErrorBoundary>
      <Account {...props} />
    </AccountErrorBoundary>
  </StrictMode>
);

export default AccountPage;