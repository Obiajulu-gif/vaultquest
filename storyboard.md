tsx
// app/app/account/page.tsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { UserDepositsList } from '../../components/app/UserDepositsList'
import { useWallet } from '../../hooks/useWallet'
import { useYieldData } from '../../hooks/useYieldData'
import { formatCurrency, formatAPY } from '../../utils/format'
import { captureError } from '../../utils/errorLogging'
import { logger } from '../../utils/logger'

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------

interface Metrics {
  readonly activeDeposits: number
  readonly cumulativeWinnings: number
  readonly apy: number
  readonly projectedMonthly: number
}

interface YieldState {
  readonly accumulated: number
  readonly lastTick: number | null
  readonly animationId: number | null
}

// ------------------------------------------------------------------
// Constants
// ------------------------------------------------------------------

const SECONDS_PER_YEAR = 365 * 86400
const MAX_HISTORY_PAGE_SIZE = 10
const YIELD_UPDATE_INTERVAL_SECONDS = 1

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

/**
 * Compute per-second growth factor from APY.
 * @param apy - annual percentage yield (as decimal, e.g. 0.05 for 5%)
 * @returns per-second growth factor (decimal)
 */
function perSecondGrowthFactor(apy: number): number {
  // (1 + APY) ^ (1 / seconds_per_year) - 1
  return Math.pow(1 + apy, 1 / SECONDS_PER_YEAR) - 1
}

/**
 * Validate that a value is a non‑negative number.
 * Logs a warning and returns 0 if invalid.
 * @param value - value to validate
 * @param name - display name for logging
 * @returns validated number (0 on failure)
 */
function safeNumber(value: unknown, name: string): number {
  if (typeof value === 'number' && !Number.isNaN(value) && value >= 0) {
    return value
  }
  logger.warn(`Invalid ${name}`, { value })
  return 0
}

// ------------------------------------------------------------------
// API call
// ------------------------------------------------------------------

/**
 * Fetch user metrics from the API.
 * @param address - wallet address (validated)
 * @returns metrics object
 * @throws TypeError if address is invalid
 * @throws Error if HTTP error or invalid response
 */
async function fetchUserMetrics(address: string): Promise<Metrics> {
  if (!address || typeof address !== 'string') {
    throw new TypeError('Invalid address: must be a non-empty string')
  }

  // Security: basic address sanitization (allow only alphanumeric and common chars)
  const sanitized = address.replace(/[^a-zA-Z0-9_\-.:]/g, '')
  if (sanitized !== address) {
    logger.warn('Address contained sanitized characters', { original: address, sanitized })
  }

  const url = `/api/users/${encodeURIComponent(sanitized)}/metrics`
  let response: Response
  try {
    response = await fetch(url)
  } catch (err) {
    throw new Error('Network error while fetching user metrics')
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  let data: unknown
  try {
    data = await response.json()
  } catch (err) {
    throw new Error('Invalid JSON response from metrics endpoint')
  }

  if (typeof data !== 'object' || data === null) {
    throw new Error('Invalid metrics payload: expected an object')
  }

  const { activeDeposits, cumulativeWinnings, apy, projectedMonthly } = data as Record<string, unknown>

  return {
    activeDeposits: safeNumber(activeDeposits, 'activeDeposits'),
    cumulativeWinnings: safeNumber(cumulativeWinnings, 'cumulativeWinnings'),
    apy: safeNumber(apy, 'apy'),
    projectedMonthly: safeNumber(projectedMonthly, 'projectedMonthly'),
  }
}

// ------------------------------------------------------------------
// Custom hook: real‑time yield counter
// ------------------------------------------------------------------

/**
 * Hook that drives a yield micro‑counter using `requestAnimationFrame`.
 * It recalculates every second and updates the displayed value.
 *
 * @param isConnected - whether wallet is connected
 * @param activeDeposits - current deposit balance
 * @param apy - annual percentage yield (as decimal)
 * @returns current accrued yield value (rounded to 2 decimals)
 */
function useYieldCounter(
  isConnected: boolean,
  activeDeposits: number,
  apy: number
): number {
  const [yieldValue, setYieldValue] = useState(0)

  // Refs to avoid stale closures
  const apyRef = useRef(apy)
  const depositsRef = useRef(activeDeposits)
  const accumulatedRef = useRef(0)
  const lastTickRef = useRef<number | null>(null)
  const animationRef = useRef<number | null>(null)

  // Sync refs with props
  useEffect(() => {
    apyRef.current = apy
    depositsRef.current = activeDeposits
  }, [apy, activeDeposits])

  useEffect(() => {
    if (!isConnected) {
      // Reset
      accumulatedRef.current = 0
      setYieldValue(0)
      lastTickRef.current = null
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
      return
    }

    const frameCallback = (timestamp: number) => {
      if (lastTickRef.current === null) {
        lastTickRef.current = timestamp
      }

      const deltaSeconds = (timestamp - lastTickRef.current) / 1000
      if (deltaSeconds >= YIELD_UPDATE_INTERVAL_SECONDS) {
        const growthFactor = perSecondGrowthFactor(apyRef.current)
        const increment = depositsRef.current * growthFactor * deltaSeconds
        accumulatedRef.current += increment
        // Use functional update for accuracy
        setYieldValue(prev => Math.round((prev + increment) * 100) / 100)
        lastTickRef.current = timestamp
      }

      animationRef.current = requestAnimationFrame(frameCallback)
    }

    animationRef.current = requestAnimationFrame(frameCallback)

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
    }
  }, [isConnected])

  return yieldValue
}

// ------------------------------------------------------------------
// Main Page Component
// ------------------------------------------------------------------

/**
 * Account dashboard page – shows user portfolio metrics, real‑time yield counter,
 * and transaction history.
 */
export default function AccountPage(): React.ReactElement {
  // Wallet hook (assumed to be well‑typed)
  const { address, isConnected, balance, error: walletError } = useWallet()

  // State
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<Error | null>(null)

  // Real‑time yield dependencies
  const activeDeposits = useMemo(() => metrics?.activeDeposits ?? 0, [metrics])
  const apy = useMemo(() => metrics?.apy ?? 0, [metrics])
  const yieldValue = useYieldCounter(isConnected, activeDeposits, apy)

  // Validation of balance
  const validatedBalance = useMemo(() => {
    if (balance == null) return null
    const num = Number(balance)
    if (Number.isNaN(num) || num < 0) {
      logger.warn('Invalid balance', { balance })
      return 0
    }
    return num
  }, [balance])

  // Fetch metrics when address changes
  useEffect(() => {
    if (!address || !isConnected) {
      setMetrics(null)
      setLoading(false)
      setFetchError(null)
      return
    }

    let cancelled = false
    const load = async () => {
      setLoading(true)
      setFetchError(null)
      try {
        const data = await fetchUserMetrics(address)
        if (!cancelled) {
          setMetrics(data)
          logger.info('User metrics loaded', { address, activeDeposits: data.activeDeposits })
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const error = err instanceof Error ? err : new Error(String(err))
          setFetchError(error)
          captureError(error, { context: 'fetchUserMetrics' })
          logger.error('Failed to load user metrics', { address, error: error.message })
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()
    return () => { cancelled = true }
  }, [address, isConnected])

  // Derived values
  const cumulativeWinnings = metrics?.cumulativeWinnings ?? 0
  const projectedMonthly = metrics?.projectedMonthly ?? 0

  // Render loading state
  if (!isConnected) {
    return (
      <EmptyWalletState />
    )
  }

  if (loading || !metrics) {
    return <LoadingState />
  }

  if (fetchError) {
    return <ErrorState error={fetchError} onRetry={() => setFetchError(prev => prev)} />
  }

  return (
    <div className="account-page">
      {/* Welcome Header */}
      <header className="account-header">
        <h1>VaultQuest Account</h1>
        <p className="wallet-address">Connected: {address}</p>
        <div className="balance-badge">
          Balance: {validatedBalance !== null ? formatCurrency(validatedBalance) : '---'}
        </div>
      </header>

      {/* Metrics Cards (Glassmorphic) */}
      <section className="metrics-grid" aria-label="Account metrics">
        <MetricCard
          title="Active Deposits"
          value={formatCurrency(activeDeposits)}
          gradient="rgba(255,255,255,0.06)"
        />
        <MetricCard
          title="Cumulative Winnings"
          value={formatCurrency(cumulativeWinnings)}
          gradient="rgba(255,215,0,0.08)"
        />
        <MetricCard
          title="Yield APY"
          value={formatAPY(apy)}
          gradient="rgba(0,255,127,0.06)"
        />
        <MetricCard
          title="Projected Monthly"
          value={formatCurrency(projectedMonthly)}
          gradient="rgba(100,149,237,0.06)"
        />
      </section>

      {/* Real‑time Yield Micro‑Counter */}
      <section className="yield-counter" aria-label="Real-time accrued yield">
        <h2>Yield accruing now</h2>
        <div className="yield-value" data-testid="yield-value">
          {formatCurrency(yieldValue)}
        </div>
        <small>Based on APY {formatAPY(apy)}</small>
      </section>

      {/* Transaction History */}
      <UserDepositsList
        address={address}
        maxPageSize={MAX_HISTORY_PAGE_SIZE}
      />
    </div>
  )
}

// ------------------------------------------------------------------
// Subcomponents
// ------------------------------------------------------------------

/**
 * Metric card with glassmorphic styling.
 */
function MetricCard({ title, value, gradient }: {
  title: string
  value: string
  gradient: string
}): React.ReactElement {
  return (
    <div
      className="metric-card"
      style={{
        background: `linear-gradient(135deg, ${gradient}, rgba(255,255,255,0.02))`,
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.15)',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      }}
    >
      <span className="metric-title">{title}</span>
      <span className="metric-value">{value}</span>
    </div>
  )
}

/**
 * Empty state when no wallet is connected.
 */
function EmptyWalletState(): React.ReactElement {
  return (
    <div className="empty-state" role="status">
      <h2>No Wallet Connected</h2>
      <p>Please connect your wallet to view your VaultQuest account details.</p>
      {/* Assume wallet connection button exists elsewhere */}
    </div>
  )
}

/**
 * Loading skeleton.
 */
function LoadingState(): React.ReactElement {
  return (
    <div className="loading-state" role="status">
      <div className="spinner" />
      <p>Loading account data...</p>
    </div>
  )
}

/**
 * Error state with retry action.
 */
function ErrorState({ error, onRetry }: {
  error: Error
  onRetry: () => void
}): React.ReactElement {
  return (
    <div className="error-state" role="alert">
      <h2>Something went wrong</h2>
      <p>{error.message}</p>
      <button onClick={onRetry}>Retry</button>
    </div>
  )
}

// ------------------------------------------------------------------
// Styles (CSS-in-JS object – can be moved to a .css file)
// ------------------------------------------------------------------

const styles = {
  // Placeholder for actual CSS classes; in production use a module
}