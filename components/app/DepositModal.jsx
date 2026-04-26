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
import { ErrorStateDisplay, InlineError, LoadingState, InsufficientBalance } from "@/components/ui/error-state";
import { errorManager } from "@/lib/error-handling";

export default function DepositModal({
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
    clearErrors 
  } = useDripWave();
  
  // Form state
  const [depositAmount, setDepositAmount] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [userBalance] = useState("1000.0"); // Mock balance for validation

  // Check prerequisites when modal opens
  useEffect(() => {
    if (isOpen && selectedPool) {
      const prerequisites = checkPrerequisites('deposit', selectedPool, userBalance);
      if (!prerequisites.prerequisitesMet) {
        if (!prerequisites.walletConnected) {
          errorManager.addError('WALLET_NOT_CONNECTED');
        }
        if (!prerequisites.networkSupported) {
          errorManager.addError('UNSUPPORTED_NETWORK');
        }
        if (!prerequisites.sufficientBalance) {
          errorManager.addError('INSUFFICIENT_BALANCE', { 
            available: userBalance,
            required: '0.001'
          });
        }
        if (!prerequisites.poolActive) {
          errorManager.addError('POOL_NOT_ACTIVE');
        }
      }
    }
  }, [isOpen, selectedPool, checkPrerequisites, userBalance]);

  // Clear errors when modal closes
  useEffect(() => {
    if (!isOpen) {
      clearErrors();
      setValidationErrors([]);
      setRetryCount(0);
    }
  }, [isOpen, clearErrors]);

  const handleDeposit = async () => {
    // Clear previous errors
    setError("");
    setValidationErrors([]);
    
    // Validate prerequisites
    const prerequisites = checkPrerequisites('deposit', selectedPool, userBalance);
    if (!prerequisites.prerequisitesMet) {
      if (!prerequisites.walletConnected) {
        errorManager.addError('WALLET_NOT_CONNECTED');
        return;
      }
      if (!prerequisites.networkSupported) {
        errorManager.addError('UNSUPPORTED_NETWORK');
        return;
      }
      if (!prerequisites.sufficientBalance) {
        errorManager.addError('INSUFFICIENT_BALANCE', { 
          available: userBalance,
          required: depositAmount || '0.001'
        });
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
      amount: depositAmount,
    };

    // Validate form data
    const validation = validateAction('deposit', formData, selectedPool, userBalance);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    setIsPending(true);
    setIsRetrying(false);

    try {
      // Create transaction record with error handling
      const response = await createTransaction(address, "deposit", {
        pool_id: selectedPool.id,
        amount: depositAmount,
      });

      if (response.success) {
        setSuccess(true);
        // Clear any existing errors
        clearErrors();
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        const errorMsg = response.error || "Failed to process deposit";
        setError(errorMsg);
        errorManager.addError('TRANSACTION_FAILED', { 
          error: errorMsg, 
          action: 'deposit',
          poolId: selectedPool.id
        });
      }
    } catch (err) {
      console.error('Deposit error:', err);
      
      // Handle specific error types
      let errorCode = 'TRANSACTION_FAILED';
      let errorContext = { action: 'deposit', poolId: selectedPool?.id };
      
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
      setError(err.message || "Failed to process deposit. Please try again.");
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
      await handleDeposit();
    } finally {
      setIsRetrying(false);
    }
  };

  const handleClose = () => {
    setDepositAmount("");
    setError("");
    setSuccess(false);
    setIsPending(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-[#1A0808]/90 backdrop-blur-sm border border-blue-900/20 text-white sm:max-w-[425px] shadow-lg">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="flex items-center gap-2">
            <Droplets className="w-5 h-5 text-blue-400" />
            Join Savings Pool
          </DialogTitle>
          <button onClick={handleClose} className="text-gray-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </DialogHeader>

        <div className="py-4">
          {!isConnected ? (
            <div className="text-center py-8">
              <Wallet className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
              <p className="text-yellow-400">Connect your wallet to deposit</p>
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
                      <span className="text-gray-400">APY:</span>
                      <div className="font-medium text-green-400">{selectedPool.interestRate}%</div>
                    </div>
                    <div>
                      <span className="text-gray-400">TVL:</span>
                      <div className="font-medium">${parseFloat(selectedPool.totalDeposits).toFixed(2)}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Participants:</span>
                      <div className="font-medium">{selectedPool.participantCount}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Amount Input */}
              <div className="mb-4">
                <label className="block text-sm text-gray-300 mb-2">
                  Deposit Amount ({selectedPool?.token.symbol || "TOKEN"})
                </label>
                <Input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => {
                    setDepositAmount(e.target.value);
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
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-gray-500">
                    Minimum deposit: 0.001 {selectedPool?.token.symbol || "TOKEN"}
                  </p>
                  <p className="text-xs text-gray-500">
                    Your balance: {userBalance} {selectedPool?.token.symbol || "TOKEN"}
                  </p>
                </div>
              </div>

              {/* Insufficient Balance Warning */}
              {depositAmount && parseFloat(depositAmount) > parseFloat(userBalance) && (
                <InsufficientBalance
                  token={selectedPool?.token.symbol || "TOKEN"}
                  available={userBalance}
                  required={depositAmount}
                  onAddFunds={() => {
                    // Handle add funds action
                    window.dispatchEvent(new CustomEvent('add_funds'));
                  }}
                />
              )}

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
                  Deposit successful! 🎉
                </div>
              )}

              {/* Transaction Status */}
              {isPending && (
                <div className="bg-blue-900/20 text-blue-500 p-3 rounded-md text-sm flex items-center gap-2 mb-4">
                  <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  {isRetrying ? `Retrying... (Attempt ${retryCount + 1}/3)` : 'Processing deposit...'}
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
                  💧 Your deposit will start earning interest immediately. 
                  You'll be eligible for the prize draw when the pool ends.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        {isConnected && (
          <div className="flex gap-3">
            <Button
              onClick={handleDeposit}
              disabled={isPending || success}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isPending ? "Processing..." : success ? "Deposited!" : "Deposit"}
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
