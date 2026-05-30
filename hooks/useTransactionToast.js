// hooks/useTransactionToast.js
"use client";

import { toast } from "sonner";
import { useEffect } from "react";
import { useAccount } from "wagmi";

/**
 * Hook to show toast notifications for a wagmi transaction.
 * Accepts the transaction result object returned by wagmi hooks
 * (e.g., useContractWrite, useSendTransaction, usePrepareSendTransaction).
 * It monitors the transaction's status and updates a single toast
 * accordingly, providing links to an explorer when available.
 */
export function useTransactionToast({
  data,
  isError,
  error,
  isSuccess,
  isLoading,
  chainId,
  status,
} = {}) {
  // Keep track of the toast ID so we can update the same toast
  let toastId = null;

  // Helper to build explorer URL (using Snowtrace for Avalanche chains)
  const explorerUrl = (hash) => {
    // Fallback to generic Etherscan explorer format if chain is unknown
    const base = chainId === 43114 || chainId === 43113 ? "https://snowtrace.io" : "https://etherscan.io";
    return `${base}/tx/${hash}`;
  };

  useEffect(() => {
    if (isLoading) {
      // Show pending signature toast
      toastId = toast.loading("Signature Pending - Approve in wallet", {
        description: "Waiting for you to sign the transaction in your wallet.",
        duration: Infinity,
        richColors: true,
      });
    } else if (status === "pending" && data?.hash && !toastId) {
      // Transaction broadcasted but not yet confirmed
      toastId = toast.loading("Transaction Broadcasting - Waiting for blocks", {
        description: "Your transaction has been sent to the network.",
        duration: Infinity,
        richColors: true,
      });
    } else if (isSuccess && data?.hash) {
      // Success toast with link to explorer
      toast.success("Transaction Confirmed", {
        description: (
          <a href={explorerUrl(data.hash)} target="_blank" rel="noopener noreferrer" style={{ color: "inherit" }}>
            View on Explorer
          </a>
        ),
        richColors: true,
        duration: 8000,
      });
      toast.dismiss(toastId);
    } else if (isError) {
      // Error toast with friendly message
      const msg = error?.shortMessage || error?.message || "Transaction failed";
      toast.error("Transaction Failed", {
        description: msg,
        richColors: true,
        duration: 8000,
      });
      toast.dismiss(toastId);
    }
  }, [isLoading, status, isSuccess, isError, data, error, chainId]);
}
