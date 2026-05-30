jsx
// components/app/UserDepositsList.jsx
/**
 * @fileoverview Filterable, paginated list of user deposits with enhanced UX.
 * Supports search, status filtering, pagination, and responsive layout.
 * Handles loading, empty, and error states gracefully.
 * @version 3.0.0
 * @author VaultQuest Team
 */

import React, {
  useCallback,
  useMemo,
  useState,
  useRef,
  useEffect,
  memo,
} from 'react';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const LOG_PREFIX = '[UserDepositsList]';
const ITEMS_PER_PAGE_OPTIONS = [5, 10, 20, 50];
const DEFAULT_ITEMS_PER_PAGE = 10;
const SEARCH_DEBOUNCE_MS = 400;
const FILTER_OPTIONS = ['all', 'active', 'withdrawn', 'pending'];
const MAX_DEPOSITS_DISPLAY = 10000; // Safety limit

const STATUS_LABELS = {
  active: 'Active',
  withdrawn: 'Withdrawn',
  pending: 'Pending',
};

const DEFAULT_DEPOSITS = [];

// ---------------------------------------------------------------------------
// Logger (guarded against production removal)
// ---------------------------------------------------------------------------
const logger = {
  debug: (...args) =>
    process.env.NODE_ENV !== 'production' &&
    console.debug(LOG_PREFIX, '[DEBUG]', ...args),
  info: (...args) =>
    process.env.NODE_ENV !== 'production' &&
    console.info(LOG_PREFIX, '[INFO]', ...args),
  warn: (...args) => console.warn(LOG_PREFIX, '[WARN]', ...args),
  error: (...args) => console.error(LOG_PREFIX, '[ERROR]', ...args),
};

// ---------------------------------------------------------------------------
// Types (JSDoc)
// ---------------------------------------------------------------------------
/**
 * @typedef {import('@/types').Deposit} Deposit
 * @property {number} amount - Deposit amount
 * @property {string} status - 'active' | 'withdrawn' | 'pending'
 * @property {string} [token] - Token symbol
 * @property {Date|string|number} [createdAt] - Deposit date
 * @property {string} [id] - Unique identifier
 */

/**
 * @typedef {'all'|'active'|'withdrawn'|'pending'} FilterStatus
 */

/**
 * @typedef {Object} UserDepositsListProps
 * @property {Deposit[]} deposits - Array of deposit objects
 * @property {boolean} loading - Whether data is loading
 * @property {boolean} walletConnected - Whether a wallet is connected (for empty state)
 * @property {string} [error] - Optional error message from parent fetch
 * @property {() => void} onRetry - Callback to retry fetch
 * @property {string} [className] - Additional CSS classes
 * @property {number} [itemsPerPage] - Override default items per page
 */

// ---------------------------------------------------------------------------
// Validation Helpers
// ---------------------------------------------------------------------------
/**
 * Validates a deposit object has required fields and valid types.
 * @param {unknown} deposit - Candidate deposit.
 * @returns {deposit is Deposit}
 */
const isValidDeposit = (deposit) => {
  if (!deposit || typeof deposit !== 'object') {
    logger.debug('isValidDeposit: deposit is null or not object');
    return false;
  }

  // Must have a numeric amount, finite and >= 0
  if (typeof deposit.amount !== 'number' || !Number.isFinite(deposit.amount) || deposit.amount < 0) {
    logger.debug('isValidDeposit: invalid amount', deposit.amount);
    return false;
  }

  // Must have a valid status
  if (!['active', 'withdrawn', 'pending'].includes(deposit.status)) {
    logger.debug('isValidDeposit: invalid status', deposit.status);
    return false;
  }

  return true;
};

/**
 * Validates filter status value.
 * @param {string} status - Status to validate.
 * @returns {status is FilterStatus}
 */
const isValidFilterStatus = (status) => {
  return typeof status === 'string' && FILTER_OPTIONS.includes(status);
};

/**
 * Sanitizes a search term: strips HTML, trims, lowercases.
 * @param {unknown} term - Raw search term.
 * @returns {string} Sanitized term, never null.
 */
const sanitizeSearchTerm = (term) => {
  if (typeof term !== 'string') return '';
  // Strip HTML tags and potentially dangerous chars, keep alphanumeric, spaces, dots, hyphens
  const cleaned = term.replace(/<[^>]*>?/gm, '').replace(/[^a-zA-Z0-9\s.\-]/g, '');
  return cleaned.trim().toLowerCase();
};

/**
 * Safely parses and formats a date, returns fallback on error.
 * @param {unknown} date - Date input.
 * @returns {string} Formatted date or placeholder.
 */
const safeFormatDate = (date) => {
  try {
    if (date === null || date === undefined) return '—';
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) throw new RangeError('Invalid date value');
    return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(parsed);
  } catch (err) {
    logger.warn('safeFormatDate failed for input:', date, err instanceof Error ? err.message : err);
    return '—';
  }
};

/**
 * Formats a numeric value to a short currency string.
 * @param {unknown} value - Numeric value.
 * @returns {string} Formatted string like "$1.2K", or "$0" on invalid.
 */
const safeFormatCurrencyShort = (value) => {
  try {
    const num = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(num) || num < 0) return '$0';
    const abs = Math.abs(num);
    if (abs >= 1_000_000) return '$' + (num / 1_000_000).toFixed(1) + 'M';
    if (abs >= 1_000) return '$' + (num / 1_000).toFixed(1) + 'K';
    return '$' + num.toFixed(2);
  } catch (err) {
    logger.error('safeFormatCurrencyShort error:', err);
    return '$0';
  }
};

// ---------------------------------------------------------------------------
// Custom Hook: Debounced value
// ---------------------------------------------------------------------------
/**
 * Debounces a value with configurable delay.
 * @template T
 * @param {T} value - Value to debounce.
 * @param {number} delay - Delay in milliseconds.
 * @returns {T} Debounced value.
 */
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/**
 * Renders appropriate empty state based on connection and error conditions.
 * @param {{ walletConnected: boolean, hasError: boolean, onRetry?: () => void }} props
 * @returns {JSX.Element}
 */
const EmptyState = memo(({ walletConnected, hasError, onRetry }) => {
  if (!walletConnected) {
    return (
      <div className="deposits-empty deposits-empty--no-wallet" role="status">
        <p className="deposits-empty__title">No wallet connected</p>
        <p className="deposits-empty__subtitle">Connect your wallet to view your deposits.</p>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="deposits-empty deposits-empty--error" role="alert">
        <p className="deposits-empty__title">Unable to load deposits</p>
        <p className="deposits-empty__subtitle">Please try again later.</p>
        {typeof onRetry === 'function' && (
          <button className="btn btn--retry" onClick={onRetry} type="button">
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="deposits-empty" role="status">
      <p className="deposits-empty__title">No deposits yet</p>
      <p className="deposits-empty__subtitle">Start by making your first deposit!</p>
    </div>
  );
});
EmptyState.displayName = 'EmptyState';

/**
 * Skeleton loading placeholder for deposit rows.
 * @returns {JSX.Element}
 */
const LoadingSkeleton = memo(() => (
  <div className="deposits-skeleton" aria-label="Loading deposits" role="status">
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="deposit-row deposit-row--skeleton">
        <div className="skeleton-line skeleton-line--short" />
        <div className="skeleton-line skeleton-line--medium" />
        <div className="skeleton-line skeleton-line--long" />
      </div>
    ))}
  </div>
));
LoadingSkeleton.displayName = 'LoadingSkeleton';

/**
 * Individual deposit row component.
 * @param {{ deposit: Deposit }} props
 * @returns {JSX.Element}
 */
const DepositRow = memo(({ deposit }) => {
  try {
    const formattedDate = safeFormatDate(deposit.createdAt);
    const formattedAmount = safeFormatCurrencyShort(deposit.amount);
    const statusLabel = STATUS_LABELS[deposit.status] || deposit.status;

    return (
      <div className="deposit-row" key={deposit.id || formattedDate + deposit.amount}>
        <span className="deposit-row__amount">{formattedAmount}</span>
        <span className="deposit-row__token">{deposit.token || '—'}</span>
        <span className={`deposit-row__status deposit-row__status--${deposit.status}`}>
          {statusLabel}
        </span>
        <span className="deposit-row__date">{formattedDate}</span>
      </div>
    );
  } catch (err) {
    logger.error('DepositRow rendering error for deposit:', deposit, err);
    return (
      <div className="deposit-row deposit-row--error">
        <span className="deposit-row__error">Error displaying deposit</span>
      </div>
    );
  }
});
DepositRow.displayName = 'DepositRow';

/**
 * Pagination controls.
 * @param {{ currentPage: number, totalPages: number, onPageChange: (page: number) => void }} props
 * @returns {JSX.Element}
 */
const Pagination = memo(({ currentPage, totalPages, onPageChange }) => {
  // Validate inputs
  const safeCurrentPage = Math.max(1, Math.min(currentPage, totalPages));
  const safeTotalPages = Math.max(1, totalPages);

  // Generate page numbers to display (e.g., first, last, and around current)
  const pageNumbers = useMemo(() => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= safeTotalPages; i++) {
      if (i === 1 || i === safeTotalPages || (i >= safeCurrentPage - delta && i <= safeCurrentPage + delta)) {
        range.push(i);
      }
    }

    range.forEach((i) => {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    });

    return rangeWithDots;
  }, [safeCurrentPage, safeTotalPages]);

  if (safeTotalPages <= 1) return null;

  return (
    <nav className="deposits-pagination" aria-label="Deposits pagination">
      <button
        className="pagination-btn pagination-btn--prev"
        onClick={() => onPageChange(safeCurrentPage - 1)}
        disabled={safeCurrentPage <= 1}
        aria-label="Previous page"
        type="button"
      >
        ← Prev
      </button>
      <div className="pagination-pages">
        {pageNumbers.map((page, index) => {
          if (page === '...') {
            return <span key={`ellipsis-${index}`} className="pagination-ellipsis">…</span>;
          }
          return (
            <button
              key={page}
              className={`pagination-btn pagination-btn--page ${page === safeCurrentPage ? 'pagination-btn--active' : ''}`}
              onClick={() => onPageChange(page)}
              aria-current={page === safeCurrentPage ? 'page' : undefined}
              aria-label={`Page ${page}`}
              type="button"
            >
              {page}
            </button>
          );
        })}
      </div>
      <button
        className="pagination-btn pagination-btn--next"
        onClick={() => onPageChange(safeCurrentPage + 1)}
        disabled={safeCurrentPage >= safeTotalPages}
        aria-label="Next page"
        type="button"
      >
        Next →
      </button>
    </nav>
  );
});
Pagination.displayName = 'Pagination';

/**
 * Filter and search bar.
 * @param {{ filter: FilterStatus, searchTerm: string, onFilterChange: (f: FilterStatus) => void, onSearchChange: (s: string) => void, itemsPerPage: number, onItemsPerPageChange: (n: number) => void }} props
 * @returns {JSX.Element}
 */
const FilterBar = memo(({ filter, searchTerm, onFilterChange, onSearchChange, itemsPerPage, onItemsPerPageChange }) => {
  return (
    <div className="deposits-filters" role="search" aria-label="Filter deposits">
      <div className="deposits-filters__search">
        <label htmlFor="deposits-search" className="sr-only">Search deposits</label>
        <input
          id="deposits-search"
          type="text"
          placeholder="Search by amount or token..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          maxLength={100}
          className="input input--search"
        />
      </div>

      <div className="deposits-filters__status">
        <label htmlFor="deposits-status" className="sr-only">Filter by status</label>
        <select
          id="deposits-status"
          value={filter}
          onChange={(e) => {
            const val = e.target.value;
            if (isValidFilterStatus(val)) onFilterChange(val);
          }}
          className="select"
        >
          <option value="all">All</option>
          {FILTER_OPTIONS.slice(1).map((opt) => (
            <option key={opt} value={opt}>{STATUS_LABELS[opt]}</option>
          ))}
        </select>
      </div>

      <div className="deposits-filters__per-page">
        <label htmlFor="deposits-per-page" className="sr-only">Items per page</label>
        <select
          id="deposits-per-page"
          value={itemsPerPage}
          onChange={(e) => {
            const val = parseInt(e.target.value, 10);
            if (ITEMS_PER_PAGE_OPTIONS.includes(val)) onItemsPerPageChange(val);
          }}
          className="select select--small"
        >
          {ITEMS_PER_PAGE_OPTIONS.map((n) => (
            <option key={n} value={n}>{n} / page</option>
          ))}
        </select>
      </div>
    </div>
  );
});
FilterBar.displayName = 'FilterBar';

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

/**
 * UserDepositsList - Enhanced deposit list with filtering, pagination, and responsive design.
 * @param {UserDepositsListProps} props
 * @returns {JSX.Element}
 */
const UserDepositsList = ({
  deposits = DEFAULT_DEPOSITS,
  loading = false,
  walletConnected = false,
  error = undefined,
  onRetry,
  className = '',
  itemsPerPage: initialItemsPerPage = DEFAULT_ITEMS_PER_PAGE,
}) => {
  // ----- State -----
  const [filter, setFilter] = useState(/** @type {FilterStatus} */ ('all'));
  const [searchInput, setSearchInput] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(
    ITEMS_PER_PAGE_OPTIONS.includes(initialItemsPerPage) ? initialItemsPerPage : DEFAULT_ITEMS_PER_PAGE
  );

  // Debounced search term
  const searchTerm = useDebounce(searchInput, SEARCH_DEBOUNCE_MS);

  // ----- Handlers -----
  const handleFilterChange = useCallback((newFilter) => {
    setFilter(newFilter);
    setCurrentPage(1); // Reset to first page on filter change
  }, []);

  const handleSearchChange = useCallback((value) => {
    setSearchInput(sanitizeSearchTerm(value));
    setCurrentPage(1);
  }, []);

  const handleItemsPerPageChange = useCallback((newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(Math.max(1, Math.min(page, Math.ceil(filteredDeposits.length / itemsPerPage))));
  }, [filteredDeposits.length, itemsPerPage]);

  // ----- Derived data -----
  const filteredDeposits = useMemo(() => {
    try {
      if (!Array.isArray(deposits)) {
        logger.warn('deposits prop is not an array, returning empty list');
        return [];
      }

      // Limit input size for safety (prevent huge lists from freezing UI)
      const safeDeposits = deposits.slice(0, MAX_DEPOSITS_DISPLAY);
      if (safeDeposits.length !== deposits.length) {
        logger.warn('Deposits list truncated to', MAX_DEPOSITS_DISPLAY);
      }

      const validDeposits = safeDeposits.filter(isValidDeposit);

      if (validDeposits.length !== safeDeposits.length && process.env.NODE_ENV !== 'production') {
        logger.warn('Some deposits failed validation', {
          total: safeDeposits.length,
          valid: validDeposits.length,
        });
      }

      return validDeposits.filter((deposit) => {
        // Status filter
        if (filter !== 'all' && deposit.status !== filter) return false;

        // Search term filter (already sanitized)
        if (searchTerm.length > 0) {
          const amountStr = safeFormatCurrencyShort(deposit.amount).toLowerCase();
          const tokenStr = (deposit.token || '').toLowerCase();
          // Also search raw amount as string
          const rawAmountStr = String(deposit.amount).toLowerCase();
          if (
            !amountStr.includes(searchTerm) &&
            !tokenStr.includes(searchTerm) &&
            !rawAmountStr.includes(searchTerm)
          ) {
            return false;
          }
        }

        return true;
      });
    } catch (err) {
      logger.error('filteredDeposits error:', err);
      return [];
    }
  }, [deposits, filter, searchTerm]);

  // Paginate
  const totalPages = Math.max(1, Math.ceil(filteredDeposits.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedDeposits = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * itemsPerPage;
    return filteredDeposits.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredDeposits, safeCurrentPage, itemsPerPage]);

  // Reset to first page if total pages change (e.g., filter reduces results)
  useEffect(() => {
    if (safeCurrentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [safeCurrentPage, totalPages]);

  // ----- Render -----
  // Determine if we should show empty state
  const showEmpty = !loading && (error || !walletConnected || filteredDeposits.length === 0);

  // Error state for the filter bar (only if there's an error loading initially)
  const hasError = Boolean(error);

  return (
    <div className={`deposits-list ${className}`.trim()}>
      {/* Header */}
      <div className="deposits-list__header">
        <h2 className="deposits-list__title">Your Deposits</h2>
        {!loading && !showEmpty && (
          <span className="deposits-list__count">
            {filteredDeposits.length} deposit{filteredDeposits.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Filters (only shown when there are deposits to filter or when loading) */}
      {(filteredDeposits.length > 0 || loading) && (
        <FilterBar
          filter={filter}
          searchTerm={searchInput}
          onFilterChange={handleFilterChange}
          onSearchChange={handleSearchChange}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      )}

      {/* Content area */}
      <div className="deposits-list__body">
        {loading ? (
          <LoadingSkeleton />
        ) : showEmpty ? (
          <EmptyState walletConnected={walletConnected} hasError={hasError} onRetry={onRetry} />
        ) : (
          <>
            <div className="deposits-list__rows" role="list">
              {paginatedDeposits.map((deposit, index) => (
                <DepositRow key={deposit.id || index} deposit={deposit} />
              ))}
            </div>
            <Pagination
              currentPage={safeCurrentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>

      {/* Show info when filter returns empty but deposits exist */}
      {!loading && filteredDeposits.length === 0 && !showEmpty && deposits.length > 0 && (
        <div className="deposits-list__no-results" role="status">
          No deposits match your current filters. Try a different search or status.
        </div>
      )}
    </div>
  );
};

UserDepositsList.displayName = 'UserDepositsList';

export default UserDepositsList;