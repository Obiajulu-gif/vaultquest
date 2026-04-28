"use client";

import { useState, useEffect } from "react";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { X, AlertCircle, Check, Droplets, Wallet, Plus, RefreshCw, Clock } from "lucide-react";
import { createTransaction } from "@/lib/api";
import { useDripWave } from "@/hooks/useDripWave";
import { ErrorStateDisplay, InlineError, LoadingState } from "@/components/ui/error-state";
import { errorManager } from "@/lib/error-handling";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CreatePoolModal({ isOpen, onClose }) {
  const { state: walletConnectionState } = useWalletConnection();
  const { address, isConnected } = walletConnectionState;
  const { 
    validateAction, 
    checkPrerequisites, 
    errorState, 
    dismissError,
    clearErrors 
  } = useDripWave();
  
  // Form state
  const [poolName, setPoolName] = useState("");
  const [poolDescription, setPoolDescription] = useState("");
  const [tokenAddress, setTokenAddress] = useState("0x0000000000000000000000000000000000000000");
  const [duration, setDuration] = useState(30); // days
  const [interestRate, setInterestRate] = useState("5.0"); // percentage
  
  // UI state
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Check prerequisites when modal opens
  useEffect(() => {
    if (isOpen) {
      const prerequisites = checkPrerequisites('create_pool');
      if (!prerequisites.prerequisitesMet) {
        if (!prerequisites.walletConnected) {
          errorManager.addError('WALLET_NOT_CONNECTED');
        }
        if (!prerequisites.networkSupported) {
          errorManager.addError('UNSUPPORTED_NETWORK');
        }
      }
    }
  }, [isOpen, checkPrerequisites]);

  // Clear errors when modal closes
  useEffect(() => {
    if (!isOpen) {
      clearErrors();
      setValidationErrors([]);
      setRetryCount(0);
    }
  }, [isOpen, clearErrors]);

  // Token options
  const tokenOptions = [
    { value: "0x0000000000000000000000000000000000000000", label: "Stellar (XLM)", symbol: "XLM" },
    { value: "0xA0b86a33E6441893F6f7AD06c28f5BAA7D4b0D16", label: "USDC", symbol: "USDC" },
    { value: "0xdAC17F958D2ee523a2206206994597C13D831ec7", label: "USDT", symbol: "USDT" },
  ];

  // Duration options in days
  const durationOptions = [
    { value: 7, label: "1 Week" },
    { value: 14, label: "2 Weeks" },
    { value: 30, label: "1 Month" },
    { value: 90, label: "3 Months" },
    { value: 180, label: "6 Months" },
    { value: 365, label: "1 Year" },
  ];

  const handleCreate = async () => {
    if (!isConnected) {
      setError("Please connect your wallet first");
      return;
    }

    setError("");
    setValidationErrors([]);
    
    const prerequisites = checkPrerequisites('create_pool');
    if (!prerequisites.prerequisitesMet) {
      if (!prerequisites.walletConnected) {
        errorManager.addError('WALLET_NOT_CONNECTED');
        return;
      }
      if (!prerequisites.networkSupported) {
        errorManager.addError('UNSUPPORTED_NETWORK');
        return;
      }
    }

    const formData = {
      name: poolName.trim(),
      description: poolDescription.trim(),
      tokenAddress,
      duration,
      interestRate: parseFloat(interestRate),
    };

    const validation = validateAction('create_pool', formData);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    setIsPending(true);
    setIsRetrying(false);

    try {
      const response = await createTransaction(address, "create_vault", {
        name: formData.name,
        description: formData.description,
        token_address: formData.tokenAddress,
        duration_days: formData.duration,
        interest_rate: formData.interestRate,
      });

      if (response.success) {
        setSuccess(true);
        clearErrors();
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        const errorMsg = response.error || "Failed to create pool";
        setError(errorMsg);
        errorManager.addError('TRANSACTION_FAILED', { 
          error: errorMsg, 
          action: 'create_pool' 
        });
      }
    } catch (err) {
      console.error('Create pool error:', err);
      
      let errorCode = 'TRANSACTION_FAILED';
      let errorContext = { action: 'create_pool' };
      
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
      setError(err.message || "Failed to create pool. Please try again.");
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
      await handleCreate();
    } finally {
      setIsRetrying(false);
    }
  };

  const handleClose = () => {
    setPoolName("");
    setPoolDescription("");
    setTokenAddress("0x0000000000000000000000000000000000000000");
    setDuration(30);
    setInterestRate(5);
    setError("");
    setSuccess(false);
    setIsPending(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-[#1A0808]/90 backdrop-blur-sm border border-blue-900/20 text-white sm:max-w-[500px] shadow-lg">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="flex items-center gap-2">
            <Droplets className="w-5 h-5 text-blue-400" />
            Create Savings Pool
          </DialogTitle>
          <button onClick={handleClose} className="text-gray-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </DialogHeader>

        <div className="py-4">
          {!isConnected ? (
            <div className="text-center py-8">
              <Wallet className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
              <p className="text-yellow-400">Connect your wallet to create a pool</p>
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

              {/* Pool Name */}
              <div className="mb-4">
                <label className="block text-sm text-gray-300 mb-2">
                  Pool Name *
                </label>
                <Input
                  type="text"
                  value={poolName}
                  onChange={(e) => {
                    setPoolName(e.target.value);
                    setError("");
                    setValidationErrors([]);
                  }}
                  placeholder="Enter pool name"
                  className={`bg-[#2A0A0A]/70 border ${
                    validationErrors.some(e => e.toLowerCase().includes('name')) 
                      ? 'border-red-500/50' 
                      : 'border-blue-900/20'
                  } text-white`}
                  disabled={isPending || success}
                />
                {poolName && (poolName.length < 1 || poolName.length > 100) && (
                  <p className="text-xs text-gray-500 mt-1">
                    Pool name must be between 1 and 100 characters
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="mb-4">
                <label className="block text-sm text-gray-300 mb-2">
                  Description
                </label>
                <Textarea
                  value={poolDescription}
                  onChange={(e) => {
                    setPoolDescription(e.target.value);
                    setError("");
                    setValidationErrors([]);
                  }}
                  placeholder="Describe your pool (optional)"
                  className={`bg-[#2A0A0A]/70 border ${
                    poolDescription.length > 500 
                      ? 'border-red-500/50' 
                      : 'border-blue-900/20'
                  } text-white`}
                  rows={3}
                  disabled={isPending || success}
                />
                {poolDescription && (
                  <p className="text-xs text-gray-500 mt-1">
                    {poolDescription.length}/500 characters
                  </p>
                )}
              </div>

              {/* Token Selection */}
              <div className="mb-4">
                <label className="block text-sm text-gray-300 mb-2">
                  Token *
                </label>
                <Select value={tokenAddress} onValueChange={setTokenAddress}>
                  <SelectTrigger className={`bg-[#2A0A0A]/70 border ${
                    validationErrors.some(e => e.toLowerCase().includes('token')) 
                      ? 'border-red-500/50' 
                      : 'border-blue-900/20'
                  } text-white`}>
                    <SelectValue placeholder="Select token" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A0808] border-blue-900/20">
                    {tokenOptions.map((token) => (
                      <SelectItem
                        key={token.value}
                        value={token.value}
                        className="text-white hover:bg-blue-600/10"
                      >
                        <div className="flex items-center gap-2">
                          <span>{token.label}</span>
                          <span className="text-gray-400">({token.symbol})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Duration */}
              <div className="mb-4">
                <label className="block text-sm text-gray-300 mb-2">
                  Duration *
                </label>
                <Select value={duration.toString()} onValueChange={(value) => setDuration(parseInt(value))}>
                  <SelectTrigger className={`bg-[#2A0A0A]/70 border ${
                    validationErrors.some(e => e.toLowerCase().includes('duration')) 
                      ? 'border-red-500/50' 
                      : 'border-blue-900/20'
                  } text-white`}>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A0808] border-blue-900/20">
                    {durationOptions.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value.toString()}
                        className="text-white hover:bg-blue-600/10"
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Interest Rate */}
              <div className="mb-4">
                <label className="block text-sm text-gray-300 mb-2">
                  Interest Rate (%) *
                </label>
                <Input
                  type="number"
                  value={interestRate}
                  onChange={(e) => {
                    setInterestRate(e.target.value);
                    setError("");
                    setValidationErrors([]);
                  }}
                  placeholder="5.0"
                  step="0.1"
                  min="0.1"
                  max="100"
                  className={`bg-[#2A0A0A]/70 border ${
                    validationErrors.some(e => e.toLowerCase().includes('interest')) 
                      ? 'border-red-500/50' 
                      : 'border-blue-900/20'
                  } text-white`}
                  disabled={isPending || success}
                />
                {interestRate && (
                  <p className="text-xs text-gray-500 mt-1">
                    Interest rate must be between 0.01% and 100%
                  </p>
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
                  Pool created successfully! 🎉
                </div>
              )}

              {/* Transaction Status */}
              {isPending && (
                <div className="bg-blue-900/20 text-blue-500 p-3 rounded-md text-sm flex items-center gap-2 mb-4">
                  <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  {isRetrying ? `Retrying... (Attempt ${retryCount + 1}/3)` : 'Creating pool...'}
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
                  💡 Pool creators earn a small fee from all deposits and can set custom terms.
                  Make sure to provide clear descriptions to attract participants.
                </p>
              </div>

              {/* Action Button */}
              {isConnected && (
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={handleCreate}
                  disabled={isPending || success}
                >
                  {isPending ? "Creating Pool..." : success ? "Pool Created!" : "Create Pool"}
                </Button>
              )}
            </>
          )}
        </div>
        {/* Action Button */}
        {isConnected && (
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700"
            onClick={handleCreate}
            disabled={isPending || success}
          >
            {isPending ? "Creating Pool..." : success ? "Pool Created!" : "Create Pool"}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
