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
import { X, AlertCircle, Check, Droplets, Wallet, TrendingUp } from "lucide-react";
import { createTransaction } from "@/lib/api";

export default function WithdrawModal({
  isOpen,
  onClose,
  selectedPool,
}) {
  const { address, isConnected } = useAccount();
  
  // Form state
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [userPosition, setUserPosition] = useState(null);

  // Set max amount when modal opens or pool changes
  useEffect(() => {
    if (selectedPool && isOpen) {
      // In a real implementation, you would fetch the user's position for this pool
      // For now, we'll use a mock position
      setUserPosition({
        poolId: selectedPool.id,
        totalAmount: "10.5",
        principalAmount: "10.0",
        interestEarned: "0.5",
        tokenSymbol: selectedPool.token.symbol,
      });
      setWithdrawAmount("10.5");
    }
  }, [selectedPool, isOpen]);

  const handleWithdraw = async () => {
    if (!isConnected) {
      setError("Please connect your wallet first");
      return;
    }

    if (!selectedPool) {
      setError("No pool selected");
      return;
    }

    if (!withdrawAmount || Number(withdrawAmount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (userPosition && Number(withdrawAmount) > Number(userPosition.totalAmount)) {
      setError("Amount exceeds your available balance");
      return;
    }

    setError("");
    setIsPending(true);

    try {
      // Create transaction record
      const response = await createTransaction(address, "withdraw", {
        pool_id: selectedPool.id,
        amount: withdrawAmount,
      });

      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        setError(response.error || "Failed to process withdrawal");
      }
    } catch (err) {
      setError("Failed to process withdrawal. Please try again.");
    } finally {
      setIsPending(false);
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
              <Wallet className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
              <p className="text-yellow-400">Connect your wallet to withdraw</p>
            </div>
          ) : (
            <>
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
                  }}
                  placeholder="0.00"
                  className="bg-[#2A0A0A]/70 border-blue-900/20 text-white"
                  disabled={isPending || success}
                />
                {userPosition && (
                  <p className="text-xs text-gray-500 mt-1">
                    Available: {parseFloat(userPosition.totalAmount).toFixed(4)} {userPosition.tokenSymbol}
                  </p>
                )}
              </div>

              {/* Error Display */}
              {error && (
                <div className="flex items-center gap-2 text-red-500 text-sm mb-4">
                  <AlertCircle size={16} />
                  {error}
                </div>
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
                  Processing withdrawal...
                </div>
              )}

              {/* Info Box */}
              <div className="bg-yellow-900/20 rounded-lg p-3 text-xs text-yellow-300 mb-4">
                <p>
                  ⚠️ Early withdrawals may forfeit earned interest. 
                  Check pool terms before withdrawing.
                </p>
              </div>
            </>
          )}
        </div>

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
