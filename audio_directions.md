tsx
// ============================================================================
// File: components/app/MetricCard.tsx
// ============================================================================
// Glassmorphic metric card with shimmer loading, accessible design, and
// fully typed props with validation and error boundaries.
// ============================================================================

import React, { memo, type ReactNode, useCallback, useRef } from "react";
import { logger } from "../../utils/logging";
import { validateNonEmptyString, validateStringLength } from "../../utils/validation";

// ---------------------------------------------------------------------------
// Types & Constants
// ---------------------------------------------------------------------------

export interface MetricCardProps {
  /** Formatted value to display (e.g. "$12,345.67") */
  readonly value: string;
  /** Label describing the metric (e.g. "Active Deposits") */
  readonly label: string;
  /** Optional icon element rendered next to the label */
  readonly icon?: ReactNode;
  /** Accent colour key from the gradient palette */
  readonly accentColor?: keyof typeof GRADIENTS;
  /** Shows shimmer placeholder when true */
  readonly isLoading?: boolean;
  /** Additional CSS classes to merge */
  readonly className?: string;
  /** Optional error fallback text */
  readonly errorFallback?: string;
  /** Whether the value should be treated as sensitive (e.g., not logged) */
  readonly isSensitive?: boolean;
}

/** Pre‑defined glassmorphic gradients mapped to accent colours. */
const GRADIENTS = {
  blue: "linear-gradient(135deg, rgba(59, 130, 246, 0.10), rgba(37, 99, 235, 0.05))",
  green: "linear-gradient(135deg, rgba(16, 185, 129, 0.10), rgba(5, 150, 105, 0.05))",
  purple: "linear-gradient(135deg, rgba(139, 92, 246, 0.10), rgba(124, 58, 237, 0.05))",
  amber: "linear-gradient(135deg, rgba(245, 158, 11, 0.10), rgba(217, 119, 6, 0.05))",
} as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * MetricCardComponent
 *
 * Renders a glassmorphic card with a value, label, optional icon, and
 * shimmer loading state. Handles error states gracefully and logs warnings.
 * Optimized via memoisation and callback hooks.
 *
 * @component
 * @example
 * <MetricCard value="$12,345" label="Active Deposits" accentColor="green" />
 */
const MetricCardComponent: React.FC<MetricCardProps> = ({
  value,
  label,
  icon,
  accentColor = "blue",
  isLoading = false,
  className = "",
  errorFallback = "—",
  isSensitive = false,
}) => {
  // Input validation (dev‑only)
  if (process.env.NODE_ENV === "development") {
    try {
      validateNonEmptyString(value, "MetricCard.value");
      validateNonEmptyString(label, "MetricCard.label");
      validateStringLength(label, 1, 100, "MetricCard.label");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.warn(
        "MetricCard: invalid props",
        { value: isSensitive ? "***" : value, label },
        errorMessage
      );
    }
  }

  // Derived gradient with fallback
  const gradient =
    GRADIENTS[accentColor] ??
    `linear-gradient(135deg, rgba(100, 100, 100, 0.10), rgba(100, 100, 100, 0.05))`;

  // Style definitions – memoised using useRef to avoid re‑creation
  const cardStyle = useRef<React.CSSProperties>({
    background: gradient,
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    borderRadius: "16px",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    cursor: "default",
  }).current;

  const valueStyle: React.CSSProperties = {
    fontSize: "clamp(1.5rem, 5vw, 2.25rem)",
    fontWeight: 700,
    letterSpacing: "-0.02em",
    color: "var(--color-text-primary, #111827)",
    lineHeight: 1.2,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "0.875rem",
    fontWeight: 500,
    color: "var(--color-text-secondary, #6B7280)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  };

  const shimmerStyle: React.CSSProperties = {
    display: "inline-block",
    width: "60%",
    height: "1.2em",
    borderRadius: "4px",
    background: "linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.5s infinite",
  };

  // Hover handlers – memoised with useCallback
  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    el.style.transform = "translateY(-2px)";
    el.style.boxShadow = "0 12px 40px rgba(0, 0, 0, 0.12)";
  }, []);

  const handleMouseLeave = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    el.style.transform = "translateY(0)";
    el.style.boxShadow = "0 8px 32px rgba(0, 0, 0, 0.08)";
  }, []);

  return (
    <div
      style={cardStyle}
      className={`metric-card ${className}`}
      role="region"
      aria-label={label}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {icon && (
          <span
            style={{
              display: "flex",
              alignItems: "center",
              opacity: 0.7,
              fontSize: "1.25rem",
            }}
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
        <span style={labelStyle}>{label}</span>
      </div>
      {isLoading ? (
        <div style={shimmerStyle} aria-busy="true" />
      ) : (
        <span style={valueStyle} aria-valuetext={value}>
          {value || errorFallback}
        </span>
      )}
    </div>
  );
};

/** Memoised to prevent unnecessary re‑renders. */
export const MetricCard = memo(MetricCardComponent);

// ============================================================================
// File: components/app/UserDepositsList.tsx
// ============================================================================
// Filterable, paginated transaction history list with empty/error states.
// Fully typed, validated, and optimised.
// ============================================================================

import React, {
  useState,
  useMemo,
  useCallback,
  memo,
  useEffect,
  useRef,
  type ChangeEvent,
  type KeyboardEvent,
  type FC,
} from "react";
import { logger } from "../../utils/logging";
import { sanitizeSearchInput, validateDepositRecord, isDepositStatus } from "../../utils/validation";
import type { DepositRecord, DepositStatus } from "../../types";

// ---------------------------------------------------------------------------
// Types & Constants
// ---------------------------------------------------------------------------

export interface TransactionFilters {
  search: string;
  status: DepositStatus | "ALL";
  dateFrom: string;
  dateTo: string;
}

export interface PaginationState {
  currentPage: number;
  pageSize: number;
}

export interface UserDepositsListProps {
  /** Array of deposit records to display */
  readonly deposits: readonly DepositRecord[];
  /** Whether data is still loading */
  readonly isLoading?: boolean;
  /** Optional error object to display */
  readonly error?: Error | null;
  /** Called when pagination changes */
  readonly onPageChange?: (page: number) => void;
  /** Called when filters change */
  readonly onFilterChange?: (filters: TransactionFilters) => void;
}

const DEFAULT_PAGE_SIZE = 10;
const DEBOUNCE_DELAY_MS = 300;
const MAX_SEARCH_LENGTH = 200;

const STATUS_OPTIONS: readonly (DepositStatus | "ALL")[] = [
  "ALL",
  "active",
  "pending",
  "completed",
  "failed",
  "cancelled",
] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Formats a numeric amount with locale‑aware currency formatting.
 * Falls back to raw amount + asset symbol on error.
 */
function formatAmount(amount: number, asset?: string): string {
  try {
    if (asset) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: asset,
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
      }).format(amount);
    }
    // Default formatting
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(amount);
  } catch (err: unknown) {
    logger.warn("formatAmount fallback", { amount, asset, error: (err as Error).message });
    return `${amount} ${asset ?? ""}`.trim();
  }
}

/**
 * Formats an ISO date string into a human‑readable format.
 */
function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) {
      throw new Error("Invalid date");
    }
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch (err: unknown) {
    logger.warn("formatDate fallback", { isoString, error: (err as Error).message });
    return isoString;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * UserDepositsList
 *
 * Displays a filterable, paginated list of deposit records with search,
 * status filter, date range, and pagination controls. Handles loading,
 * error, and empty states gracefully. Fully accessible.
 *
 * @component
 * @example
 * <UserDepositsList deposits={deposits} isLoading={false} />
 */
const UserDepositsListComponent: FC<UserDepositsListProps> = ({
  deposits,
  isLoading = false,
  error = null,
  onPageChange,
  onFilterChange,
}) => {
  // -------------------------------------------------------------------------
  // State
  // -------------------------------------------------------------------------
  const [filters, setFilters] = useState<TransactionFilters>({
    search: "",
    status: "ALL",
    dateFrom: "",
    dateTo: "",
  });

  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // -------------------------------------------------------------------------
  // Debounce search input
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearch(filters.search);
      setPagination(prev => ({ ...prev, currentPage: 1 }));
      onFilterChange?.(filters);
    }, DEBOUNCE_DELAY_MS);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [filters.search, filters.status, filters.dateFrom, filters.dateTo]); // eslint-disable-line react-hooks/exhaustive-deps

  // -------------------------------------------------------------------------
  // Memoised filtering & pagination
  // -------------------------------------------------------------------------
  const filteredDeposits = useMemo(() => {
    try {
      if (!deposits || deposits.length === 0) return [];

      return deposits.filter((deposit) => {
        // Validate deposit record (dev only)
        if (process.env.NODE_ENV === "development") {
          try {
            validateDepositRecord(deposit);
          } catch (err) {
            logger.warn("UserDepositsList: invalid deposit record", deposit, err);
            return false; // exclude invalid records
          }
        }

        // Status filter
        if (filters.status !== "ALL" && deposit.status !== filters.status) {
          return false;
        }

        // Date range filter
        const depositDate = new Date(deposit.createdAt ?? deposit.timestamp);
        if (filters.dateFrom && depositDate < new Date(filters.dateFrom)) return false;
        if (filters.dateTo) {
          const endDate = new Date(filters.dateTo);
          endDate.setHours(23, 59, 59, 999);
          if (depositDate > endDate) return false;
        }

        // Search filter (sanitized)
        const searchTerm = sanitizeSearchInput(debouncedSearch).toLowerCase();
        if (searchTerm) {
          const matchesSearch =
            (deposit.asset ?? "").toLowerCase().includes(searchTerm) ||
            (deposit.id ?? "").toLowerCase().includes(searchTerm) ||
            (deposit.status ?? "").toLowerCase().includes(searchTerm) ||
            (deposit.description ?? "").toLowerCase().includes(searchTerm);
          if (!matchesSearch) return false;
        }

        return true;
      });
    } catch (err: unknown) {
      logger.error("UserDepositsList: filtering error", err);
      return [];
    }
  }, [deposits, filters.status, filters.dateFrom, filters.dateTo, debouncedSearch]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredDeposits.length / pagination.pageSize)),
    [filteredDeposits.length, pagination.pageSize]
  );

  const paginatedDeposits = useMemo(() => {
    const start = (pagination.currentPage - 1) * pagination.pageSize;
    return filteredDeposits.slice(start, start + pagination.pageSize);
  }, [filteredDeposits, pagination.currentPage, pagination.pageSize]);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------
  const handleSearchChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    // Sanitise and truncate
    const sanitised = sanitizeSearchInput(rawValue).slice(0, MAX_SEARCH_LENGTH);
    setFilters(prev => ({ ...prev, search: sanitised }));
  }, []);

  const handleStatusChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "ALL" || isDepositStatus(value)) {
      setFilters(prev => ({ ...prev, status: value as DepositStatus | "ALL" }));
      setPagination(prev => ({ ...prev, currentPage: 1 }));
    } else {
      logger.warn("Invalid status filter value", value);
    }
  }, []);

  const handleDateChange = useCallback((field: "dateFrom" | "dateTo") => (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Basic date validation
    if (value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      setFilters(prev => ({ ...prev, [field]: value }));
      setPagination(prev => ({ ...prev, currentPage: 1 }));
    }
  }, []);

  const goToPage = useCallback(
    (page: number) => {
      const safePage = Math.max(1, Math.min(page, totalPages));
      setPagination(prev => ({ ...prev, currentPage: safePage }));
      onPageChange?.(safePage);
    },
    [totalPages, onPageChange]
  );

  // -------------------------------------------------------------------------
  // Render helpers
  // -------------------------------------------------------------------------
  const renderRow = useCallback(
    (deposit: DepositRecord, index: number) => {
      const amount = typeof deposit.amount === "number" ? deposit.amount : parseFloat(deposit.amount as string);
      return (
        <tr
          key={deposit.id ?? index}
          style={{
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <td style={cellStyle}>{formatAmount(amount, deposit.asset)}</td>
          <td style={cellStyle}>{deposit.asset ?? "—"}</td>
          <td style={cellStyle}>
            <span
              style={{
                padding: "2px 8px",
                borderRadius: "6px",
                fontSize: "0.75rem",
                fontWeight: 600,
                textTransform: "capitalize",
                background:
                  deposit.status === "active"
                    ? "rgba(16, 185, 129, 0.15)"
                    : deposit.status === "pending"
                    ? "rgba(245, 158, 11, 0.15)"
                    : deposit.status === "completed"
                    ? "rgba(59, 130, 246, 0.15)"
                    : deposit.status === "failed"
                    ? "rgba(239, 68, 68, 0.15)"
                    : "rgba(156, 163, 175, 0.15)",
                color:
                  deposit.status === "active"
                    ? "#10b981"
                    : deposit.status === "pending"
                    ? "#f59e0b"
                    : deposit.status === "completed"
                    ? "#3b82f6"
                    : deposit.status === "failed"
                    ? "#ef4444"
                    : "#9ca3af",
              }}
            >
              {deposit.status}
            </span>
          </td>
          <td style={cellStyle}>{formatDate(deposit.createdAt ?? deposit.timestamp)}</td>
        </tr>
      );
    },
    []
  );

  const cellStyle: React.CSSProperties = {
    padding: "12px 16px",
    whiteSpace: "nowrap",
    fontSize: "0.875rem",
  };

  // -------------------------------------------------------------------------
  // Error state
  // -------------------------------------------------------------------------
  if (error) {
    return (
      <div
        style={{
          padding: "24px",
          textAlign: "center",
          background: "rgba(239, 68, 68, 0.08)",
          borderRadius: "12px",
          border: "1px solid rgba(239, 68, 68, 0.2)",
        }}
        role="alert"
      >
        <p style={{ color: "#ef4444", fontWeight: 600, margin: "0 0 8px" }}>
          Failed to load transactions
        </p>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem", margin: 0 }}>
          {error.message || "An unexpected error occurred. Please try again later."}
        </p>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Loading skeleton
  // -------------------------------------------------------------------------
  if (isLoading) {
    return (
      <div aria-busy="true" style={{ padding: "16px 0" }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            style={{
              height: "48px",
              marginBottom: "8px",
              borderRadius: "8px",
              background: "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.5s infinite",
            }}
          />
        ))}
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Empty state
  // -------------------------------------------------------------------------
  if (!deposits || deposits.length === 0) {
    return (
      <div
        style={{
          padding: "40px 24px",
          textAlign: "center",
          background: "rgba(255,255,255,0.03)",
          borderRadius: "12px",
          border: "1px dashed rgba(255,255,255,0.15)",
        }}
      >
        <p style={{ fontSize: "1.25rem", fontWeight: 600, margin: "0 0 8px", color: "var(--color-text-primary)" }}>
          No transactions yet
        </p>
        <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", margin: 0 }}>
          Deposit funds to start earning yield. Your history will appear here.
        </p>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Filter controls
  // -------------------------------------------------------------------------
  const filterBarStyle: React.CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    marginBottom: "20px",
    alignItems: "center",
  };

  const inputStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    padding: "10px 14px",
    color: "var(--color-text-primary)",
    fontSize: "0.875rem",
    outline: "none",
    transition: "border-color 0.2s",
  };

  const paginationStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "8px",
    marginTop: "20px",
    flexWrap: "wrap",
  };

  return (
    <div>
      {/* Filters */}
      <div style={filterBarStyle}>
        <input
          type="text"
          placeholder="Search transactions..."
          value={filters.search}
          onChange={handleSearchChange}
          style={{ ...inputStyle, flex: "1 1 200px", minWidth: "140px" }}
          aria-label="Search transactions"
          maxLength={MAX_SEARCH_LENGTH}
        />
        <select
          value={filters.status}
          onChange={handleStatusChange}
          style={{ ...inputStyle, flex: "0 1 auto" }}
          aria-label="Filter by status"
        >
          {STATUS_OPTIONS.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
        <input
          type="date"
          value={filters.dateFrom}
          onChange={handleDateChange("dateFrom")}
          style={inputStyle}
          aria-label="Date from"
        />
        <input
          type="date"
          value={filters.dateTo}
          onChange={handleDateChange("dateTo")}
          style={inputStyle}
          aria-label="Date to"
        />
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
              <th style={cellStyle}>Amount</th>
              <th style={cellStyle}>Asset</th>
              <th style={cellStyle}>Status</th>
              <th style={cellStyle}>Date</th>
            </tr>
          </thead>
          <tbody>
            {paginatedDeposits.length > 0 ? (
              paginatedDeposits.map((deposit, index) => renderRow(deposit, index))
            ) : (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", padding: "20px", color: "var(--color-text-secondary)" }}>
                  No transactions match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={paginationStyle}>
          <button
            onClick={() => goToPage(pagination.currentPage - 1)}
            disabled={pagination.currentPage <= 1}
            style={pageButtonStyle}
            aria-label="Previous page"
          >
            ← Prev
          </button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            const page = i + 1;
            return (
              <button
                key={page}
                onClick={() => goToPage(page)}
                style={{
                  ...pageButtonStyle,
                  background:
                    page === pagination.currentPage
                      ? "rgba(59, 130, 246, 0.2)"
                      : "transparent",
                  fontWeight: page === pagination.currentPage ? 700 : 400,
                }}
                aria-label={`Page ${page}`}
                aria-current={page === pagination.currentPage ? "page" : undefined}
              >
                {page}
              </button>
            );
          })}
          {totalPages > 5 && <span style={{ color: "var(--color-text-secondary)" }}>...</span>}
          <button
            onClick={() => goToPage(pagination.currentPage + 1)}
            disabled={pagination.currentPage >= totalPages}
            style={pageButtonStyle}
            aria-label="Next page"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

const pageButtonStyle: React.CSSProperties = {
  padding: "6px 12px",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "6px",
  background: "transparent",
  color: "var(--color-text-primary)",
  cursor: "pointer",
  fontSize: "0.875rem",
  transition: "background 0.2s",
};

/** Memoised export */
export const UserDepositsList = memo(UserDepositsListComponent);

// ============================================================================
// File: app/app/account/page.tsx
// ============================================================================
// Premium user profile page with real-time yield micro-counter,
// glassmorphic metric cards, and transaction history.
// ============================================================================

"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  type FC,
} from "react";
import { logger } from "../../../utils/logging";
import { MetricCard, type MetricCardProps } from "../../../components/app/MetricCard";
import { UserDepositsList } from "../../../components/app/UserDepositsList";
import type { DepositRecord } from "../../../types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const UPDATE_INTERVAL_MS = 1000; // 1 second
const APY_RATE = 0.075; // 7.5% APY as example
const SECONDS_PER_YEAR = 365.25 * 24 * 60 * 60;

// ---------------------------------------------------------------------------
// Yield calculation helpers
// ---------------------------------------------------------------------------

/**
 * Calculates the yield earned over a given number of seconds based on a
 * principal amount and APY.
 */
function calculateYieldEarned(
  principal: number,
  apy: number,
  elapsedSeconds: number
): number {
  if (principal <= 0 || apy <= 0) return 0;
  return principal * (Math.pow(1 + apy, elapsedSeconds / SECONDS_PER_YEAR) - 1);
}

/**
 * Formats a number as a currency string with up to 8 decimal places for yield.
 */
function formatYield(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
  }).format(value);
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

/**
 * AccountPage
 *
 * Premium user profile dashboard displaying:
 * - Active deposits
 * - Cumulative winnings
 * - Real-time yield micro-counter
 * - Filterable/paginated transaction history
 * - Responsive glassmorphic cards
 *
 * @component
 */
const AccountPage: FC = () => {
  // -------------------------------------------------------------------------
  // Simulated state (replace with real data fetching)
  // -------------------------------------------------------------------------
  const [walletConnected, setWalletConnected] = useState(false);
  const [activeDeposits, setActiveDeposits] = useState<number>(0);
  const [totalWinnings, setTotalWinnings] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [deposits, setDeposits] = useState<DepositRecord[]>([]);

  // Yield counter state
  const [yieldEarned, setYieldEarned] = useState<number>(0);
  const lastUpdateRef = useRef<number>(Date.now() / 1000);

  // -------------------------------------------------------------------------
  // Data fetching simulation (replace with real API call)
  // -------------------------------------------------------------------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Simulate network request
        await new Promise(resolve => setTimeout(resolve, 1200));

        // Mock data
        setWalletConnected(true);
        setActiveDeposits(24500);
        setTotalWinnings(1875.42);
        setDeposits([
          {
            id: "dep_001",
            amount: 10000,
            asset: "USDC",
            status: "active",
            createdAt: new Date("2025-01-15T10:30:00Z").toISOString(),
            description: "Initial deposit",
          },
          {
            id: "dep_002",
            amount: 5000,
            asset: "ETH",
            status: "active",
            createdAt: new Date("2025-02-20T14:15:00Z").toISOString(),
            description: "Yield booster deposit",
          },
          {
            id: "dep_003",
            amount: 2500,
            asset: "USDC",
            status: "completed",
            createdAt: new Date("2024-12-01T08:00:00Z").toISOString(),
            description: "Withdrawn deposit",
          },
          {
            id: "dep_004",
            amount: 3000,
            asset: "BTC",
            status: "pending",
            createdAt: new Date("2025-03-10T16:45:00Z").toISOString(),
            description: "Pending deposit",
          },
          {
            id: "dep_005",
            amount: 1500,
            asset: "USDT",
            status: "active",
            createdAt: new Date("2025-04-05T09:20:00Z").toISOString(),
            description: "Rewards reinvested",
          },
        ]);
        setIsLoading(false);
        setError(null);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        logger.error("Account page data fetch failed", errorMessage);
        setError(err instanceof Error ? err : new Error(errorMessage));
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // -------------------------------------------------------------------------
  // Real-time yield micro-counter using requestAnimationFrame
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!walletConnected || activeDeposits <= 0) return;

    let animationFrameId: number;
    let lastTick = Date.now();

    const tick = () => {
      const now = Date.now();
      const deltaMs = now - lastTick;
      lastTick = now;

      // Accumulate elapsed seconds (precise)
      const elapsedSeconds = deltaMs / 1000;
      const newYield = calculateYieldEarned(activeDeposits, APY_RATE, elapsedSeconds);
      setYieldEarned(prev => prev + newYield);

      // Check if we should update the "last update" reference (once per second)
      if (deltaMs >= UPDATE_INTERVAL_MS) {
        lastUpdateRef.current = now / 1000;
      }

      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [walletConnected, activeDeposits]);

  // -------------------------------------------------------------------------
  // Memoised metric card props
  // -------------------------------------------------------------------------
  const metricCards: MetricCardProps[] = useMemo(
    () => [
      {
        value: activeDeposits.toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 2,
        }),
        label: "Active Deposits",
        accentColor: "blue",
        isLoading,
        errorFallback: "$0.00",
        isSensitive: true,
      },
      {
        value: totalWinnings.toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 2,
        }),
        label: "Cumulative Winnings",
        accentColor: "green",
        isLoading,
        errorFallback: "$0.00",
        isSensitive: true,
      },
      {
        value: formatYield(yieldEarned),
        label: "Yield Earned (Live)",
        accentColor: "purple",
        isLoading,
        errorFallback: "$0.00",
        isSensitive: true,
      },
    ],
    [activeDeposits, totalWinnings, yieldEarned, isLoading]
  );

  // -------------------------------------------------------------------------
  // Connect wallet handler (for empty state)
  // -------------------------------------------------------------------------
  const handleConnectWallet = useCallback(() => {
    logger.info("Connect wallet requested");
    // Implement actual wallet connection logic
    setWalletConnected(true);
    setActiveDeposits(0);
    setTotalWinnings(0);
    setDeposits([]);
    setYieldEarned(0);
    setError(null);
  }, []);

  // -------------------------------------------------------------------------
  // Empty state (not connected)
  // -------------------------------------------------------------------------
  if (!walletConnected && !isLoading && !error) {
    return (
      <div style={pageContainerStyle}>
        <div style={emptyStateStyle}>
          <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🔒</div>
          <h1 style={{ margin: "0 0 8px" }}>Wallet Not Connected</h1>
          <p style={{ color: "var(--color-text-secondary)", marginBottom: "24px", maxWidth: "400px" }}>
            Connect your wallet to view your deposits, earnings, and transaction history.
          </p>
          <button
            onClick={handleConnectWallet}
            style={{
              padding: "14px 28px",
              borderRadius: "12px",
              border: "none",
              background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
              color: "#fff",
              fontSize: "1rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(59,130,246,0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Error state (fallback)
  // -------------------------------------------------------------------------
  if (error) {
    return (
      <div style={pageContainerStyle}>
        <div style={errorContainerStyle}>
          <h2 style={{ margin: "0 0 8px", color: "#ef4444" }}>Something went wrong</h2>
          <p style={{ margin: "0 0 16px", color: "var(--color-text-secondary)" }}>
            {error.message}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={retryButtonStyle}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Main dashboard
  // -------------------------------------------------------------------------
  return (
    <div style={pageContainerStyle}>
      {/* User Greeting */}
      <div style={greetingStyle}>
        <h1 style={{ margin: 0, fontWeight: 700 }}>Your Vault</h1>
        <p style={{ margin: "4px 0 0", color: "var(--color-text-secondary)" }}>
          Track your deposits and watch your earnings grow in real time.
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "20px",
          marginBottom: "32px",
        }}
      >
        {metricCards.map((card, index) => (
          <MetricCard key={index} {...card} />
        ))}
      </div>

      {/* Transaction History Header */}
      <h2
        style={{
          margin: "0 0 16px",
          fontWeight: 600,
          fontSize: "1.25rem",
        }}
      >
        Transaction History
      </h2>

      {/* Transaction List */}
      <UserDepositsList
        deposits={deposits}
        isLoading={isLoading}
        error={error}
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Styles (inline for simplicity; can be moved to CSS module)
// ---------------------------------------------------------------------------
const pageContainerStyle: React.CSSProperties = {
  maxWidth: "1200px",
  margin: "0 auto",
  padding: "32px 16px",
  minHeight: "100vh",
};

const emptyStateStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "60vh",
  textAlign: "center",
  padding: "40px",
};

const errorContainerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "50vh",
  textAlign: "center",
  padding: "40px",
};

const retryButtonStyle: React.CSSProperties = {
  padding: "12px 24px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.05)",
  color: "var(--color-text-primary)",
  cursor: "pointer",
  fontSize: "1rem",
  fontWeight: 500,
};

const greetingStyle: React.CSSProperties = {
  marginBottom: "32px",
};

export default AccountPage;