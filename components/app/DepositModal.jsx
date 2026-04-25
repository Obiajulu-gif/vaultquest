"use client";

import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, AlertCircle, Check, Info } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogClose,
} from "@/components/ui/dialog";

export default function DepositModal({
	isOpen,
	onClose,
	selectedVault,
	onDeposit,
	depositAmount,
	setDepositAmount,
	error,
	success,
	isPending,
}) {
	const { isConnected } = useAccount();

	if (!isOpen || !selectedVault) return null;

	const handleMaxClick = () => {
		// Placeholder for max balance logic
		setDepositAmount("0");
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="bg-[#1A0808] border border-red-900/30 max-w-md">
				<DialogHeader className="border-b border-red-900/10 pb-4">
					<div className="flex items-start justify-between">
						<div>
							<DialogTitle className="text-2xl font-bold">
								Deposit to {selectedVault?.name || "Vault"}
							</DialogTitle>
							<p className="text-sm text-gray-400 mt-1">
								Vault ID: {selectedVault?.id}
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
					{!isConnected ? (
						<div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 flex gap-3">
							<AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
							<div>
								<p className="text-red-300 font-medium">Wallet Not Connected</p>
								<p className="text-red-400/80 text-sm mt-1">
									Please connect your wallet to deposit funds
								</p>
							</div>
						</div>
					) : (
						<>
							{/* Vault Info Cards */}
							<div className="grid grid-cols-2 gap-3">
								<div className="bg-[#2A0A0A]/50 rounded-lg p-3 border border-red-900/10">
									<p className="text-xs text-gray-400 mb-1">Yield (APY)</p>
									<p className="text-lg font-bold text-red-400">{selectedVault?.apy}%</p>
								</div>
								<div className="bg-[#2A0A0A]/50 rounded-lg p-3 border border-red-900/10">
									<p className="text-xs text-gray-400 mb-1">Total Vault Value</p>
									<p className="text-lg font-bold">{selectedVault?.tvl.toFixed(2)} {selectedVault?.tvlToken}</p>
								</div>
							</div>

							{/* Amount Input */}
							<div className="space-y-2">
								<label className="block text-sm font-medium text-gray-300">
									Amount to Deposit
								</label>
								<div className="relative">
									<Input
										type="number"
										value={depositAmount}
										onChange={(e) => setDepositAmount(e.target.value)}
										placeholder="Enter amount"
										className="bg-[#2A0A0A]/70 border-red-900/20 text-white pr-20"
										disabled={isPending}
									/>
									<button
										onClick={handleMaxClick}
										className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-red-400 hover:text-red-300 transition-colors"
										disabled={isPending}
									>
										MAX
									</button>
								</div>
								<p className="text-xs text-gray-500">
									Token: {selectedVault?.tvlToken}
								</p>
							</div>

							{/* Info Alert */}
							<div className="bg-blue-900/20 border border-blue-500/20 rounded-lg p-3 flex gap-3">
								<Info className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
								<div className="text-xs text-blue-300/80">
									You'll receive your principal + interest upon withdrawal
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
									<p className="text-green-300 text-sm">Deposit successful! 🎉</p>
								</div>
							)}

							{/* Action Buttons */}
							<div className="space-y-2 pt-2">
								<Button
									onClick={onDeposit}
									disabled={isPending || !depositAmount || Number(depositAmount) <= 0}
									className="w-full bg-red-600 hover:bg-red-700 text-white font-medium shadow-lg"
								>
									{isPending ? "Processing..." : "Confirm Deposit"}
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
						</>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
