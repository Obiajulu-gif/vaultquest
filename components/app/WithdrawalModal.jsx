"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { X, AlertCircle, Check, Droplets, Wallet, TrendingUp, RefreshCw, Clock } from "lucide-react";
import { createTransaction } from "@/lib/api";
import { useDripWave } from "@/hooks/useDripWave";
import { ErrorStateDisplay, InlineError, LoadingState } from "@/components/ui/error-state";
import { errorManager } from "@/lib/error-handling";

export default function WithdrawModal({
  isOpen,
  onClose,
  selectedPool,
}) {
  const { address, isConnected } = useAccount();
  const { 
    validateAction, 
    checkPrerequisites, 
    errorState, 
    dismissError,
    clearErrors,
    userPositions
  } = useDripWave();
  
  // Form state
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [userPosition, setUserPosition] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Set max amount when modal opens or pool changes
  useEffect(() => {
    if (selectedPool && isOpen) {
      // Find user's position for this pool
      const position = userPositions.find(pos => pos.poolId === selectedPool.id);
      if (position) {
        setUserPosition(position);
        setWithdrawAmount(position.totalAmount);
      } else {
        // Mock position for demonstration
        setUserPosition({
          poolId: selectedPool.id,
          totalAmount: "10.5",
          principalAmount: "10.0",
          interestEarned: "0.5",
          tokenSymbol: selectedPool.token.symbol,
          depositTimestamp: Date.now() - (30 * 24 * 60 * 60 * 1000), // 30 days ago
        });
        setWithdrawAmount("10.5");
      }
    }
  }, [selectedPool, isOpen, userPositions]);

  // Check prerequisites when modal opens
  useEffect(() => {
    if (isOpen && selectedPool) {
      const prerequisites = checkPrerequisites('withdraw', selectedPool);
      if (!prerequisites.prerequisitesMet) {
        if (!prerequisites.walletConnected) {
          errorManager.addError('WALLET_NOT_CONNECTED');
        }
        if (!prerequisites.networkSupported) {
          errorManager.addError('UNSUPPORTED_NETWORK');
        }
        if (!prerequisites.userPositionExists) {
          errorManager.addError('NO_POSITION');
        }
      }
    }
  }, [isOpen, selectedPool, checkPrerequisites]);

  // Clear errors when modal closes
  useEffect(() => {
    if (!isOpen) {
      clearErrors();
      setValidationErrors([]);
      setRetryCount(0);
    }
  }, [isOpen, clearErrors]);

  const handleWithdraw = async () => {
    // Clear previous errors
    setError("");
    setValidationErrors([]);
    
    // Validate prerequisites
    const prerequisites = checkPrerequisites('withdraw', selectedPool);
    if (!prerequisites.prerequisitesMet) {
      if (!prerequisites.walletConnected) {
        errorManager.addError('WALLET_NOT_CONNECTED');
        return;
      }
      if (!prerequisites.networkSupported) {
        errorManager.addError('UNSUPPORTED_NETWORK');
        return;
      }
      if (!prerequisites.userPositionExists) {
        errorManager.addError('NO_POSITION');
        return;
      }
    }

    if (!selectedPool) {
      setError("No pool selected");
      return;
    }

    // Prepare form data for validation
    const formData = {
      poolId: selectedPool.id,
      amount: withdrawAmount,
    };

    // Validate form data
    const validation = validateAction('withdraw', formData, selectedPool, userPosition);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    setIsPending(true);
    setIsRetrying(false);

    try {
      // Create transaction record with error handling
      const response = await createTransaction(address, "withdraw", {
        pool_id: selectedPool.id,
        amount: withdrawAmount,
      });

      if (response.success) {
        setSuccess(true);
        // Clear any existing errors
        clearErrors();
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        const errorMsg = response.error || "Failed to process withdrawal";
        setError(errorMsg);
        errorManager.addError('TRANSACTION_FAILED', { 
          error: errorMsg, 
          action: 'withdraw',
          poolId: selectedPool.id
        });
      }
    } catch (err) {
      console.error('Withdraw error:', err);
      
      // Handle specific error types
      let errorCode = 'TRANSACTION_FAILED';
      let errorContext = { action: 'withdraw', poolId: selectedPool?.id };
      
      if (err.message.includes('network') || err.message.includes('fetch')) {
        errorCode = 'NETWORK_ERROR';
      } else if (err.message.includes('timeout')) {
        errorCode = 'TRANSACTION_TIMEOUT';
      } else if (err.message.includes('rejected') || err.message.includes('denied')) {
        errorCode = 'TRANSACTION_REJECTED';
      } else if (err.message.includes('insufficient')) {
        errorCode = 'INSUFFICIENT_FUNDS';
      }
      
      errorContext = { ...errorContext, originalError: err.message };
      errorManager.addError(errorCode, errorContext);
      setError(err.message || "Failed to process withdrawal. Please try again.");
    } finally {
      setIsPending(false);
    }
  };

  const handleRetry = async () => {
    if (retryCount >= 3) {
      setError("Maximum retry attempts reached. Please try again later.");
      return;
    }
    
    setIsRetrying(true);
    setRetryCount(prev => prev + 1);
    
    try {
      await handleWithdraw();
    } finally {
      setIsRetrying(false);
    }
  };

  const handleClose = () => {
    setWithdrawAmount("");
    setError("");
    setSuccess(false);
    setIsPending(false);
    setUserPosition(null);
    onClose();
  };

  const setMaxAmount = () => {
    if (userPosition) {
      setWithdrawAmount(userPosition.totalAmount);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-[#1A0808]/90 backdrop-blur-sm border border-blue-900/20 text-white sm:max-w-[425px] shadow-lg">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            Withdraw from Pool
          </DialogTitle>
          <button onClick={handleClose} className="text-gray-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </DialogHeader>

        <div className="py-4">
          {!isConnected ? (
            <div className="text-center py-8">

return (
  <Dialog open={isOpen} onOpenChange={handleClose}>
    <DialogContent className="bg-[#1A0808]/90 backdrop-blur-sm border border-blue-900/20 text-white sm:max-w-[425px] shadow-lg">
      <DialogHeader className="flex flex-row items-center justify-between">
        <DialogTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-400" />
          Withdraw from Pool
        </DialogTitle>
        <button onClick={handleClose} className="text-gray-400 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </DialogHeader>

      <div className="py-4">
        {!isConnected ? (
          <div className="text-center py-8">
            <Wallet className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <p className="text-yellow-400">Connect your wallet to withdraw</p>
          </div>
        ) : (
          <>
            {/* Error State Display */}
            <ErrorStateDisplay 
              errorState={errorState}
              onDismiss={dismissError}
              onRetry={handleRetry}
              className="mb-4"
            />

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <div className="mb-4 space-y-2">
                {validationErrors.map((validationError, index) => (
                  <InlineError
                    key={index}
                    message={validationError}
                    severity="error"
                    className="w-full"
                  />
                ))}
              </div>
            )}

            {/* Pool Info */}
            {selectedPool && (
              <div className="bg-[#2A0A0A]/50 rounded-lg p-4 mb-4">
                <h3 className="font-medium mb-2">{selectedPool.name}</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-400">Token:</span>
                    <div className="font-medium">{selectedPool.token.symbol}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Status:</span>
                    <div className="font-medium text-green-400">{selectedPool.status}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Position Info */}
            {userPosition && (
              <div className="bg-blue-900/20 rounded-lg p-4 mb-4 border border-blue-500/30">
                <h4 className="font-medium mb-2 text-blue-300">Your Position</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Balance:</span>
                    <span className="font-medium">
                      {parseFloat(userPosition.totalAmount).toFixed(4)} {userPosition.tokenSymbol}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Principal:</span>
                    <span>
                      {parseFloat(userPosition.principalAmount).toFixed(4)} {userPosition.tokenSymbol}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Interest Earned:</span>
                    <span className="text-green-400">
                      {parseFloat(userPosition.interestEarned).toFixed(4)} {userPosition.tokenSymbol}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Amount Input */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm text-gray-300">
                  Withdraw Amount ({selectedPool?.token.symbol || "TOKEN"})
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={setMaxAmount}
                  className="text-blue-400 hover:text-blue-300 text-xs"
                >
                  MAX
                </Button>
              </div>
              <Input
                type="number"
                value={withdrawAmount}
                onChange={(e) => {
                  setWithdrawAmount(e.target.value);
                  setError("");
                  setValidationErrors([]);
                }}
                placeholder="0.00"
                className={`bg-[#2A0A0A]/70 border ${
                  validationErrors.some(e => e.toLowerCase().includes('amount')) 
                    ? 'border-red-500/50' 
                    : 'border-blue-900/20'
                } text-white`}
                disabled={isPending || success}
              />
              {userPosition && (
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-gray-500">
                    Available: {parseFloat(userPosition.totalAmount).toFixed(4)} {userPosition.tokenSymbol}
                  </p>
                  {withdrawAmount && parseFloat(withdrawAmount) > parseFloat(userPosition.totalAmount) && (
                    <p className="text-xs text-red-400">
                      Exceeds balance
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Legacy Error Display (for backwards compatibility) */}
            {error && (
              <InlineError
                message={error}
                severity="error"
                onRetry={retryCount < 3 ? handleRetry : undefined}
                className="mb-4"
              />
            )}

            {/* Success Display */}
            {success && (
              <div className="bg-green-900/20 text-green-500 p-3 rounded-md text-sm flex items-center gap-2 mb-4">
                <Check size={16} />
                Withdrawal successful! 🎉
              </div>
            )}

            {/* Transaction Status */}
            {isPending && (
              <div className="bg-blue-900/20 text-blue-500 p-3 rounded-md text-sm flex items-center gap-2 mb-4">
                <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                {isRetrying ? `Retrying... (Attempt ${retryCount + 1}/3)` : 'Processing withdrawal...'}
              </div>
            )}

            {/* Retry Status */}
            {retryCount > 0 && !isPending && !success && (
              <div className="bg-yellow-900/20 text-yellow-400 p-3 rounded-md text-sm flex items-center gap-2 mb-4">
                <Clock size={16} />
                Retry attempts: {retryCount}/3
                {retryCount < 3 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRetry}
                    className="ml-auto border-yellow-600/50 hover:bg-yellow-600/10"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Retry
                  </Button>
                )}
              </div>
            )}

            {/* Info Box */}
            <div className="bg-blue-900/20 rounded-lg p-3 text-xs text-blue-300 mb-4">
              <p>
                💰 You can withdraw your principal plus earned interest at any time.
                Withdrawals don't affect your eligibility for the current prize draw.
              </p>
            </div>
          </>
        {/* Action Buttons */}
        {isConnected && (
          <div className="flex gap-3">
            <Button
              onClick={handleWithdraw}
              disabled={isPending || success || !userPosition}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isPending ? "Processing..." : success ? "Withdrawn!" : "Withdraw"}
            </Button>
            <Button
              onClick={handleClose}
              variant="outline"
              className="border-blue-600/50 hover:bg-blue-600/10"
              disabled={isPending}
            >
              Cancel
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
