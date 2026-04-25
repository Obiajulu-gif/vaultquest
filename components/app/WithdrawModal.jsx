"use client";

import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, AlertCircle, Check, Info } from "lucide-react";

export default function WithdrawModal({
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
	const handleMax = () => {
		if (selectedVault && selectedVault.balance) {
			setWithdrawalAmount(selectedVault.balance.toString());
		}
	};

	if (!isOpen || !selectedVault) return null;

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="bg-[#1A0808] border border-red-900/30 max-w-md">
				<DialogHeader className="border-b border-red-900/10 pb-4">
					<div className="flex items-start justify-between">
						<div>
							<DialogTitle className="text-2xl font-bold">
								Withdraw from {selectedVault?.name || "Vault"}
							</DialogTitle>
							<p className="text-sm text-gray-400 mt-1">
								Claim your principal + interest
							</p>
						</div>
						<DialogClose asChild>
							<button className="rounded-md opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
								<X className="h-4 w-4" />
								<span className="sr-only">Close</span>
							</button>
						</DialogClose>
					</div>
				</DialogHeader>

				<div className="space-y-6 py-4">
					{/* Balance Information */}
					<div className="space-y-3">
						<div className="bg-[#2A0A0A]/50 rounded-lg p-4 border border-red-900/10">
							<p className="text-xs text-gray-400 mb-2 font-medium">Your Balance</p>
							<p className="text-2xl font-bold">
								{selectedVault?.balance?.toFixed(4) || "0"}{" "}
								<span className="text-sm text-gray-400 font-normal">{selectedVault?.balanceToken}</span>
							</p>
							<p className="text-xs text-gray-500 mt-2">
								Ready to withdraw
							</p>
						</div>
					</div>

					{/* Amount Input Section */}
					<div className="space-y-2">
						<label className="block text-sm font-medium text-gray-300">
							Withdrawal Amount
						</label>
						<div className="relative">
							<Input
								type="number"
								value={withdrawalAmount}
								onChange={(e) => setWithdrawalAmount(e.target.value)}
								placeholder="Enter amount"
								className="bg-[#2A0A0A]/70 border-red-900/20 text-white pr-20"
								disabled={isPending}
							/>
							<button
								onClick={handleMax}
								className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-red-400 hover:text-red-300 transition-colors"
								disabled={isPending}
							>
								MAX
							</button>
						</div>
						<p className="text-xs text-gray-500">
							Available: {selectedVault?.balance?.toFixed(4) || "0"} {selectedVault?.balanceToken}
						</p>
					</div>

					{/* Info Alert */}
					<div className="bg-green-900/20 border border-green-500/20 rounded-lg p-3 flex gap-3">
						<Info className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
						<div className="text-xs text-green-300/80">
							Withdrawing will unstake your funds. Any pending interest will be credited.
						</div>
					</div>

					{/* Error message */}
					{error && (
						<div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 flex gap-3">
							<AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
							<p className="text-red-300 text-sm">{error}</p>
						</div>
					)}

					{/* Success message */}
					{success && (
						<div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3 flex gap-3">
							<Check className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
							<p className="text-green-300 text-sm">Withdrawal successful! 🎉</p>
						</div>
					)}

					{/* Action Buttons */}
					<div className="space-y-2 pt-2">
						<Button
							onClick={onWithdraw}
							disabled={isPending || !withdrawalAmount || Number(withdrawalAmount) <= 0}
							className="w-full bg-red-600 hover:bg-red-700 text-white font-medium shadow-lg"
						>
							{isPending ? "Processing..." : "Confirm Withdrawal"}
						</Button>

						<Button
							onClick={onClose}
							variant="outline"
							disabled={isPending}
							className="w-full border-red-900/30 text-gray-300 hover:bg-red-900/20 hover:text-red-300 transition-all"
						>
							Cancel
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
