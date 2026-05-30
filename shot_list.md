tsx
// components/app/UserDepositsList.tsx
import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  memo,
  useRef,
} from 'react';
import { fetchDeposits } from '@/services/depositService';
import type { Deposit, DepositFilter, Pagination } from '@/types/deposit';
import { logger } from '@/utils/logger';

// ───────────────────────────────────────────────────────────────────────────
// Types & Interfaces
// ───────────────────────────────────────────────────────────────────────────

interface UserDepositsListProps {
  walletConnected?: boolean;
  pageSize?: number;
}

interface DepositState {
  loading: boolean;
  error: string | null;
  deposits: Deposit[];
  pagination: Pagination;
}

const defaultPagination: Pagination = {
  page: 1,
  totalPages: 0,
  totalItems: 0,
};

// ───────────────────────────────────────────────────────────────────────────
// Inline Styles (extract to CSS module in production for better maintainability)
// ───────────────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    overflowX: 'auto',
    minHeight: 200,
  },
  filterBar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.75rem',
    marginBottom: '1rem',
    alignItems: 'center',
  },
  select: {
    padding: '0.5rem 0.75rem',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.3)',
    background: 'rgba(255,255,255,0.1)',
    color: '#fff',
    fontSize: '0.875rem',
    cursor: 'pointer',
  },
  input: {
    padding: '0.5rem 0.75rem',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.3)',
    background: 'rgba(255,255,255,0.1)',
    color: '#fff',
    fontSize: '0.875rem',
    minWidth: '140px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.875rem',
  },
  th: {
    textAlign: 'left',
    padding: '0.75rem 0.5rem',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    fontWeight: 600,
    opacity: 0.7,
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '0.75rem 0.5rem',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
  paginationBar: {
    display: 'flex',
    justifyContent: 'center',
    gap: '0.5rem',
    marginTop: '1.25rem',
    flexWrap: 'wrap',
  },
  pageButton: {
    padding: '0.4rem 0.8rem',
    borderRadius: '6px',
    border: '1px solid rgba(255,255,255,0.2)',
    background: 'rgba(255,255,255,0.1)',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: 500,
    transition: 'background 0.15s',
    minWidth: '40px',
    textAlign: 'center',
  },
  activePageButton: {
    background: 'rgba(255,255,255,0.25)',
    borderColor: 'rgba(255,255,255,0.5)',
  },
  emptyRow: {
    textAlign: 'center',
    padding: '2rem',
    color: 'rgba(255,255,255,0.5)',
  },
  errorContainer: {
    padding: '1rem',
    backgroundColor: 'rgba(255,0,0,0.1)',
    borderRadius: '8px',
    color: '#f99',
    fontSize: '0.875rem',
  },
  loadingContainer: {
    textAlign: 'center',
    padding: '2rem',
    color: 'rgba(255,255,255,0.6)',
  },
  emptyStateContainer: {
    textAlign: 'center',
    padding: '3rem 1rem',
    color: 'rgba(255,255,255,0.5)',
    fontSize: '1rem',
  },
};

// ───────────────────────────────────────────────────────────────────────────
// Utility Functions
// ───────────────────────────────────────────────────────────────────────────

const formatDate = (isoDate: string): string => {
  try {
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) throw new Error('Invalid date');
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (error) {
    logger.warn(`Failed to format date: "${isoDate}"`, error);
    return 'Invalid date';
  }
};

const formatAmount = (amount: number, currency: string = 'USD'): string => {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  } catch (error) {
    logger.warn(`Failed to format amount: ${amount} with currency ${currency}`, error);
    return `${amount} ${currency}`;
  }
};

const getPageRange = (current: number, total: number): (number | string)[] => {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const siblingCount = 1;
  const leftStart = Math.max(1, current - siblingCount);
  const leftEnd = Math.min(total, current + siblingCount);
  const range: (number | string)[] = [];

  if (leftStart > 1) {
    range.push(1);
    if (leftStart > 2) range.push('...');
  }
  for (let i = leftStart; i <= leftEnd; i++) range.push(i);
  if (leftEnd < total) {
    if (leftEnd < total - 1) range.push('...');
    range.push(total);
  }
  return range;
};

const DATE_REGEX = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

// ───────────────────────────────────────────────────────────────────────────
// Subcomponents
// ───────────────────────────────────────────────────────────────────────────

interface DepositFiltersProps {
  filter: DepositFilter;
  onChange: (filter: DepositFilter) => void;
}

const DepositFilters: React.FC<DepositFiltersProps> = memo(({ filter, onChange }) => {
  const handleTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value as DepositFilter['type'];
      const sanitized: DepositFilter['type'] = value || undefined;
      onChange({ ...filter, type: sanitized });
    },
    [filter, onChange]
  );

  const handleDateChange = useCallback(
    (field: 'startDate' | 'endDate') =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        const sanitized = raw && DATE_REGEX.test(raw) ? raw : undefined;
        onChange({ ...filter, [field]: sanitized });
      },
    [filter, onChange]
  );

  return (
    <div style={styles.filterBar} role="group" aria-label="Transaction filters">
      <label htmlFor="deposit-type-filter" style={{ display: 'none' }}>
        Filter by type
      </label>
      <select
        id="deposit-type-filter"
        style={styles.select}
        value={filter.type ?? ''}
        onChange={handleTypeChange}
        aria-label="Filter by transaction type"
      >
        <option value="">All Types</option>
        <option value="deposit">Deposit</option>
        <option value="withdrawal">Withdrawal</option>
        <option value="reward">Reward</option>
      </select>

      <label htmlFor="start-date-filter" style={{ fontSize: '0.8rem', opacity: 0.7 }}>
        From:
      </label>
      <input
        id="start-date-filter"
        type="date"
        style={styles.input}
        value={filter.startDate ?? ''}
        onChange={handleDateChange('startDate')}
        aria-label="Start date"
      />

      <label htmlFor="end-date-filter" style={{ fontSize: '0.8rem', opacity: 0.7 }}>
        To:
      </label>
      <input
        id="end-date-filter"
        type="date"
        style={styles.input}
        value={filter.endDate ?? ''}
        onChange={handleDateChange('endDate')}
        aria-label="End date"
      />
    </div>
  );
});

DepositFilters.displayName = 'DepositFilters';

// ───────────────────────────────────────────────────────────────────────────
// Main Component
// ───────────────────────────────────────────────────────────────────────────

const UserDepositsList: React.FC<UserDepositsListProps> = ({
  walletConnected = true,
  pageSize = 10,
}) => {
  const [state, setState] = useState<DepositState>({
    loading: false,
    error: null,
    deposits: [],
    pagination: defaultPagination,
  });
  const [filter, setFilter] = useState<DepositFilter>({});
  const currentPage = state.pagination.page;
  const abortControllerRef = useRef<AbortController | null>(null);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setState(prev => ({
      ...prev,
      pagination: { ...prev.pagination, page: 1 },
    }));
  }, [filter]);

  const fetchData = useCallback(async () => {
    if (!walletConnected) {
      setState(prev => ({
        ...prev,
        loading: false,
        deposits: [],
        pagination: defaultPagination,
        error: null,
      }));
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await fetchDeposits(
        {
          page: currentPage,
          pageSize,
          filter,
        },
        controller.signal
      );

      if (!controller.signal.aborted) {
        setState({
          loading: false,
          error: null,
          deposits: result.deposits,
          pagination: result.pagination,
        });
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Request was cancelled, ignore
        return;
      }
      const message = error instanceof Error ? error.message : 'Failed to load deposits';
      logger.error('Failed to fetch deposits', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: message,
      }));
    }
  }, [walletConnected, currentPage, pageSize, filter]);

  useEffect(() => {
    fetchData();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);

  const handleFilterChange = useCallback((newFilter: DepositFilter) => {
    setFilter(newFilter);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setState(prev => ({
      ...prev,
      pagination: { ...prev.pagination, page },
    }));
  }, []);

  const totalPages = state.pagination.totalPages;
  const pageRange = useMemo(() => getPageRange(currentPage, totalPages), [currentPage, totalPages]);

  // Table columns
  const columns = useMemo(
    () => [
      { key: 'id', label: 'ID' },
      { key: 'type', label: 'Type' },
      { key: 'amount', label: 'Amount' },
      { key: 'date', label: 'Date' },
      { key: 'status', label: 'Status' },
    ],
    []
  );

  // ───────────────────────────────────────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────────────────────────────────────

  if (!walletConnected) {
    return (
      <div style={styles.emptyStateContainer}>
        Please connect your wallet to view your deposits.
      </div>
    );
  }

  if (state.error) {
    return (
      <div style={styles.errorContainer}>
        <p>Unable to load deposits. Please try again later.</p>
        <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>{state.error}</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <DepositFilters filter={filter} onChange={handleFilterChange} />

      {state.loading ? (
        <div style={styles.loadingContainer}>Loading deposits...</div>
      ) : state.deposits.length === 0 ? (
        <div style={styles.emptyStateContainer}>No deposits found.</div>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {columns.map(col => (
                    <th key={col.key} style={styles.th}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {state.deposits.map(deposit => (
                  <tr key={deposit.id}>
                    <td style={styles.td}>{deposit.id}</td>
                    <td style={styles.td}>{deposit.type}</td>
                    <td style={styles.td}>{formatAmount(deposit.amount, deposit.currency)}</td>
                    <td style={styles.td}>{formatDate(deposit.date)}</td>
                    <td style={styles.td}>{deposit.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={styles.paginationBar} role="navigation" aria-label="Deposit pagination">
              <button
                style={styles.pageButton}
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                aria-label="First page"
              >
                ««
              </button>
              <button
                style={styles.pageButton}
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="Previous page"
              >
                «
              </button>

              {pageRange.map((item, idx) =>
                typeof item === 'string' ? (
                  <span key={`ellipsis-${idx}`} style={{ ...styles.pageButton, cursor: 'default' }}>
                    ...
                  </span>
                ) : (
                  <button
                    key={item}
                    style={{
                      ...styles.pageButton,
                      ...(item === currentPage ? styles.activePageButton : {}),
                    }}
                    onClick={() => handlePageChange(item)}
                    aria-current={item === currentPage ? 'page' : undefined}
                    aria-label={`Page ${item}`}
                  >
                    {item}
                  </button>
                )
              )}

              <button
                style={styles.pageButton}
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label="Next page"
              >
                »
              </button>
              <button
                style={styles.pageButton}
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                aria-label="Last page"
              >
                »»
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default memo(UserDepositsList);