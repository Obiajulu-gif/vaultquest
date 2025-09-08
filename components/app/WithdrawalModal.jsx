"use client";

import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function WithdrawalModal({
  isOpen,
  onClose,
  selectedVault,
  onWithdraw,
  withdrawalAmount,
  setWithdrawalAmount,
  error,
  success,
  isPending,
}) {
  const { isConnected } = useAccount();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-[#1A0808] rounded-xl p-6 border border-red-900/20 shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-white">
          Withdraw from {selectedVault?.name || "Vault"}
        </h2>

        {!isConnected ? (
          <p className="text-red-500 text-sm mb-4">
            Please connect your wallet to withdraw.
          </p>
        ) : (
          <>
            <div className="mb-4">
              <label className="block text-sm text-gray-300 mb-1">
                Amount
              </label>
              {/* <Input
                type="number"
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                placeholder="Enter amount"
                className="bg-[#2A0A0A]/70 border-red-900/20 text-white"
              /> */}

              <div>All your funds will be withdrawn from the vault. Are you sure you want to continue?</div>
            </div>
            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

            {success && (
              <p className="text-green-500 text-sm mb-2">
                Withdrawal successful! 🎉
              </p>
            )}

            <Button
              onClick={onWithdraw}
              disabled={isPending}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              {isPending ? "Processing..." : "Withdraw"}
            </Button>
          </>
        )}

        <Button
          onClick={onClose}
          variant="secondary"
          className="w-full mt-3 bg-gray-700 hover:bg-gray-600 text-white"
        >
          Close
        </Button>
      </div>
    </div>
  );
}
