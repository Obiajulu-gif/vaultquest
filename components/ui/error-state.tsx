"use client";

import React from 'react';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { AlertCircle, RefreshCw, Wifi, Wallet, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { ErrorState, RecoveryAction } from '@/lib/error-handling';

interface ErrorStateProps {
  errorState: ErrorState;
  onRetry?: () => void;
  onDismiss?: (errorCode: string) => void;
  className?: string;
}

interface ErrorDisplayProps {
  title: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  recoveryActions?: RecoveryAction[];
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

interface InlineErrorProps {
  message: string;
  severity?: 'error' | 'warning' | 'info';
  onRetry?: () => void;
  className?: string;
}

interface LoadingStateProps {
  message?: string;
  showProgress?: boolean;
  className?: string;
}

interface EmptyStateProps {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: React.ReactNode;
  className?: string;
}

// Error severity icons
const ErrorIcons = {
  error: XCircle,
  warning: AlertTriangle,
  info: AlertCircle,
};

// Error severity colors
const ErrorColors = {
  error: 'text-red-400 border-red-500/20 bg-red-900/20',
  warning: 'text-yellow-400 border-yellow-500/20 bg-yellow-900/20',
  info: 'text-blue-400 border-blue-500/20 bg-blue-900/20',
};

// Main Error State Component
export function ErrorStateDisplay({ 
  errorState, 
  onRetry, 
  onDismiss, 
  className = '' 
}: ErrorStateProps) {
  if (!errorState.hasErrors && !errorState.hasWarnings) {
    return null;
  }

  const criticalError = errorState.criticalError;
  const displayErrors = criticalError ? [criticalError] : errorState.errors;

  return (
    <div className={`space-y-4 ${className}`}>
      {displayErrors.map((error, index) => (
        <ErrorDisplay
          key={`${error.code}-${index}`}
          title={getErrorTitle(error.code)}
          description={error.message}
          severity={error.severity}
          recoveryActions={error.recoverable ? generateRecoveryActions([error]) : []}
          onRetry={error.retryable && onRetry ? onRetry : undefined}
          onDismiss={() => onDismiss?.(error.code)}
        />
      ))}
      
      {errorState.recoveryActions.length > 0 && !criticalError && (
        <Card className="bg-[#1A0808]/50 backdrop-blur-sm border border-blue-900/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-400">Suggested Actions</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {errorState.recoveryActions.map(action => (
                <Button
                  key={action}
                  variant="outline"
                  size="sm"
                  onClick={() => handleRecoveryAction(action)}
                  className="border-blue-600/50 hover:bg-blue-600/10"
                >
                  {getActionLabel(action)}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Individual Error Display Component
export function ErrorDisplay({
  title,
  description,
  severity,
  recoveryActions = [],
  onRetry,
  onDismiss,
  className = '',
}: ErrorDisplayProps) {
  const Icon = ErrorIcons[severity];
  const colorClass = ErrorColors[severity];

  return (
    <Card className={`${colorClass} ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-medium">{title}</h4>
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              )}
            </div>
            <p className="text-sm text-gray-300 mb-3">{description}</p>
            
            {recoveryActions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {recoveryActions.map(action => (
                  <Button
                    key={action.id}
                    variant={action.variant === 'primary' ? 'default' : 'outline'}
                    size="sm"
                    onClick={action.action}
                    className={
                      action.variant === 'primary'
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'border-blue-600/50 hover:bg-blue-600/10'
                    }
                  >
                    {action.label}
                  </Button>
                ))}
                {onRetry && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRetry}
                    className="border-blue-600/50 hover:bg-blue-600/10"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Retry
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Inline Error Component (for form fields, etc.)
export function InlineError({
  message,
  severity = 'error',
  onRetry,
  className = '',
}: InlineErrorProps) {
  const Icon = ErrorIcons[severity];
  const colorClass = ErrorColors[severity];

  return (
    <div className={`flex items-center gap-2 text-sm p-2 rounded-lg border ${colorClass} ${className}`}>
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1">{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-blue-400 hover:text-blue-300 transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

// Loading State Component
export function LoadingState({
  message = 'Loading...',
  showProgress = false,
  className = '',
}: LoadingStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-8 ${className}`}>
      <div className="relative">
        <div className="w-8 h-8 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
        {showProgress && (
          <div className="absolute inset-0 w-8 h-8 border-2 border-transparent border-t-blue-400 rounded-full animate-spin"></div>
        )}
      </div>
      <p className="text-sm text-gray-400 mt-3">{message}</p>
    </div>
  );
}

// Empty State Component
export function EmptyState({
  title,
  description,
  action,
  icon,
  className = '',
}: EmptyStateProps) {
  const defaultIcon = <AlertCircle className="w-12 h-12 text-gray-500" />;

  return (
    <div className={`text-center py-8 ${className}`}>
      <div className="flex justify-center mb-4">
        {icon || defaultIcon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-400 mb-6 max-w-md mx-auto">{description}</p>
      {action && (
        <Button
          onClick={action.onClick}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}

// Specialized error components for common scenarios
export function WalletNotConnected({ onConnect }: { onConnect?: () => void }) {
  return (
    <EmptyState
      title="Wallet Not Connected"
      description="Connect your wallet to start saving and winning prizes"
      icon={<Wallet className="w-12 h-12 text-gray-500" />}
      action={onConnect ? { label: 'Connect Wallet', onClick: onConnect } : undefined}
    />
  );
}

export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorDisplay
      title="Network Error"
      description="Unable to connect to the network. Please check your internet connection and try again."
      severity="error"
      onRetry={onRetry}
    />
  );
}

export function InsufficientBalance({ 
  token, 
  available, 
  required, 
  onAddFunds 
}: { 
  token: string; 
  available: string; 
  required: string; 
  onAddFunds?: () => void;
}) {
  return (
    <ErrorDisplay
      title="Insufficient Balance"
      description={`You need ${required} ${token} but only have ${available} ${token} available.`}
      severity="error"
      recoveryActions={onAddFunds ? [{
        id: 'add_funds',
        label: 'Add Funds',
        description: 'Add more funds to your wallet',
        action: onAddFunds,
        variant: 'primary',
      }] : []}
    />
  );
}

export function StaleData({ onRefresh }: { onRefresh?: () => void }) {
  return (
    <ErrorDisplay
      title="Data May Be Stale"
      description="The data shown might be outdated. Refresh to get the latest information."
      severity="warning"
      onRetry={onRefresh}
    />
  );
}

export function TransactionPending({ 
  message = 'Transaction is being processed...',
  onViewTx 
}: { 
  message?: string; 
  onViewTx?: () => void;
}) {
  return (
    <Card className="bg-blue-900/20 border-blue-500/30">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          <div className="flex-1">
            <p className="text-blue-300 font-medium">Transaction Pending</p>
            <p className="text-sm text-gray-400">{message}</p>
          </div>
          {onViewTx && (
            <Button
              variant="outline"
              size="sm"
              onClick={onViewTx}
              className="border-blue-600/50 hover:bg-blue-600/10"
            >
              View
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function TransactionFailed({ 
  error, 
  onRetry 
}: { 
  error: string; 
  onRetry?: () => void;
}) {
  return (
    <ErrorDisplay
      title="Transaction Failed"
      description={error}
      severity="error"
      onRetry={onRetry}
    />
  );
}

// Helper functions
function getErrorTitle(code: string): string {
  const titles: Record<string, string> = {
    'WALLET_NOT_CONNECTED': 'Wallet Not Connected',
    'WALLET_NO_ADDRESS': 'Wallet Error',
    'NETWORK_ERROR': 'Network Error',
    'TRANSACTION_FAILED': 'Transaction Failed',
    'INSUFFICIENT_BALANCE': 'Insufficient Balance',
    'POOL_NOT_FOUND': 'Pool Not Found',
    'POOL_NOT_ACTIVE': 'Pool Not Active',
    'DATA_STALE': 'Data May Be Stale',
    'VALIDATION_ERROR': 'Validation Error',
  };
  
  return titles[code] || 'Error';
}

function getActionLabel(action: string): string {
  const labels: Record<string, string> = {
    'connect_wallet': 'Connect Wallet',
    'reconnect_wallet': 'Reconnect',
    'switch_network': 'Switch Network',
    'refresh_data': 'Refresh',
    'retry_transaction': 'Retry',
    'reduce_amount': 'Reduce Amount',
    'add_funds': 'Add Funds',
    'wait_and_retry': 'Wait & Retry',
  };
  
  return labels[action] || action;
}

function generateRecoveryActions(errors: any[]): RecoveryAction[] {
  // This would normally import from error-handling.ts
  // For now, return empty array to avoid circular dependencies
  return [];
}

function handleRecoveryAction(action: string) {
  // Dispatch custom event for the action
  window.dispatchEvent(new CustomEvent('recovery_action', {
    detail: { action }
  }));
}
