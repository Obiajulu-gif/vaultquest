"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { X, AlertCircle, Check, Droplets, Wallet } from "lucide-react";
import { createTransaction } from "@/lib/api";

export default function DepositModal({
  isOpen,
  onClose,
  selectedPool,
}) {
  const { address, isConnected } = useAccount();
  
  // Form state
  const [depositAmount, setDepositAmount] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleDeposit = async () => {
    if (!isConnected) {
      setError("Please connect your wallet first");
      return;
    }

    if (!selectedPool) {
      setError("No pool selected");
      return;
    }

    if (!depositAmount || Number(depositAmount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    setError("");
    setIsPending(true);

    try {
      // Create transaction record
      const response = await createTransaction(address, "deposit", {
        pool_id: selectedPool.id,
        amount: depositAmount,
      });

      if (response.success) {
        setSuccess(true);
        // In a real implementation, you would now initiate the blockchain transaction
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        setError(response.error || "Failed to process deposit");
      }
    } catch (err) {
      setError("Failed to process deposit. Please try again.");
    } finally {
      setIsPending(false);
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
                  }}
                  placeholder="0.00"
                  className="bg-[#2A0A0A]/70 border-blue-900/20 text-white"
                  disabled={isPending || success}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimum deposit: 0.001 {selectedPool?.token.symbol || "TOKEN"}
                </p>
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
                  Deposit successful! 🎉
                </div>
              )}

              {/* Transaction Status */}
              {isPending && (
                <div className="bg-blue-900/20 text-blue-500 p-3 rounded-md text-sm flex items-center gap-2 mb-4">
                  <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  Processing deposit...
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
