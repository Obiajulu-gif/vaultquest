"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X, AlertCircle, Check, Droplets } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createTransaction } from "@/lib/api";
import { useAccount } from "wagmi";

export default function CreatePoolModal({ isOpen, onClose }) {
  const { address, isConnected } = useAccount();
  
  // Form state
  const [poolName, setPoolName] = useState("");
  const [poolDescription, setPoolDescription] = useState("");
  const [tokenAddress, setTokenAddress] = useState("0x0000000000000000000000000000000000000000");
  const [duration, setDuration] = useState(30); // days
  const [interestRate, setInterestRate] = useState(5);
  
  // UI state
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isPending, setIsPending] = useState(false);

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

    // Validate form
    if (!poolName.trim()) {
      setError("Please enter a pool name");
      return;
    }

    if (!tokenAddress) {
      setError("Please select a token");
      return;
    }

    if (!duration || duration <= 0) {
      setError("Please select a valid duration");
      return;
    }

    if (!interestRate || interestRate <= 0 || interestRate > 100) {
      setError("Interest rate must be between 0.01% and 100%");
      return;
    }

    setError("");
    setIsPending(true);

    try {
      // Create transaction record
      const response = await createTransaction(address, "create_pool", {
        name: poolName,
        description: poolDescription,
        token_address: tokenAddress,
        duration: duration * 24 * 60 * 60, // Convert days to seconds
        interest_rate: interestRate,
      });

      if (response.success) {
        setSuccess(true);
        // In a real implementation, you would now initiate the blockchain transaction
        // and update the transaction with the tx_hash
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        setError(response.error || "Failed to create pool");
      }
    } catch (err) {
      setError("Failed to create pool. Please try again.");
    } finally {
      setIsPending(false);
    }
  };

  const handleClose = () => {
    // Reset form
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

        <div className="py-4 space-y-4">
          {!isConnected ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
              <p className="text-yellow-400">Connect your wallet to create a pool</p>
            </div>
          ) : (
            <>
              {/* Pool Name */}
              <div>
                <label className="text-sm text-gray-400 mb-1 block">
                  Pool Name *
                </label>
                <Input
                  placeholder="e.g. Summer Savings Pool"
                  className="bg-[#2A0A0A]/80 backdrop-blur-sm border-blue-900/20"
                  value={poolName}
                  onChange={(e) => {
                    setPoolName(e.target.value);
                    setError("");
                  }}
                  disabled={isPending || success}
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-sm text-gray-400 mb-1 block">
                  Description
                </label>
                <Textarea
                  placeholder="Describe your savings pool..."
                  className="bg-[#2A0A0A]/80 backdrop-blur-sm border-blue-900/20 min-h-[80px]"
                  value={poolDescription}
                  onChange={(e) => {
                    setPoolDescription(e.target.value);
                    setError("");
                  }}
                  disabled={isPending || success}
                />
              </div>

              {/* Token Selection */}
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Token *</label>
                <Select
                  value={tokenAddress}
                  onValueChange={(value) => {
                    setTokenAddress(value);
                    setError("");
                  }}
                  disabled={isPending || success}
                >
                  <SelectTrigger className="bg-[#2A0A0A]/80 backdrop-blur-sm border-blue-900/20">
                    <SelectValue placeholder="Select Token" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A0808] border border-blue-900/20 text-gray-400">
                    {tokenOptions.map((token) => (
                      <SelectItem key={token.value} value={token.value}>
                        {token.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Selected: {tokenOptions.find(t => t.value === tokenAddress)?.label || "None"}
                </p>
              </div>

              {/* Duration Selection */}
              <div>
                <label className="text-sm text-gray-400 mb-1 block">
                  Duration *
                </label>
                <Select
                  value={duration.toString()}
                  onValueChange={(value) => {
                    setDuration(Number(value));
                    setError("");
                  }}
                  disabled={isPending || success}
                >
                  <SelectTrigger className="bg-[#2A0A0A]/80 backdrop-blur-sm border-blue-900/20">
                    <SelectValue placeholder="Select Duration" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A0808] border border-blue-900/20 text-gray-400">
                    {durationOptions.map((duration) => (
                      <SelectItem key={duration.value} value={duration.value.toString()}>
                        {duration.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Pool duration determines when prizes are awarded
                </p>
              </div>

              {/* Interest Rate */}
              <div>
                <label className="text-sm text-gray-400 mb-1 block">
                  Annual Interest Rate (%) *
                </label>
                <Input
                  type="number"
                  placeholder="e.g. 5"
                  min="0.01"
                  max="100"
                  step="0.01"
                  className="bg-[#2A0A0A]/80 backdrop-blur-sm border-blue-900/20"
                  value={interestRate}
                  onChange={(e) => {
                    setInterestRate(Number(e.target.value));
                    setError("");
                  }}
                  disabled={isPending || success}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Interest rate that will be paid to participants
                </p>
              </div>

              {/* Error Display */}
              {error && (
                <div className="flex items-center gap-2 text-red-500 text-sm">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              {/* Success Display */}
              {success && (
                <div className="bg-green-900/20 text-green-500 p-3 rounded-md text-sm flex items-center gap-2">
                  <Check size={16} />
                  Pool created successfully!
                </div>
              )}

              {/* Transaction Status */}
              {isPending && (
                <div className="bg-blue-900/20 text-blue-500 p-3 rounded-md text-sm flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  Creating pool...
                </div>
              )}

              {/* Form Summary */}
              <div className="bg-[#2A0A0A]/50 p-3 rounded-md text-xs text-gray-400 space-y-1">
                <div>Name: {poolName || "Not set"}</div>
                <div>Token: {tokenOptions.find(t => t.value === tokenAddress)?.symbol || "Not selected"}</div>
                <div>Duration: {durationOptions.find(d => d.value === duration)?.label || "Not selected"}</div>
                <div>APY: {interestRate || 0}%</div>
              </div>
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
