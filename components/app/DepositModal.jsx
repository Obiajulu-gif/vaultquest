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
			<DialogContent className="bg-zinc-950 border border-white/10 max-w-md rounded-2xl shadow-2xl">
				<DialogHeader className="border-b border-white/5 pb-4">
					<div className="flex items-start justify-between">
						<div>
							<DialogTitle className="text-2xl font-bold text-white tracking-tight">
								Deposit to {selectedVault?.name || "Vault"}
							</DialogTitle>
							<p className="text-sm text-zinc-400 mt-1 font-mono">
								VAULT #{selectedVault?.id}
							</p>
						</div>
						<DialogClose asChild>
							<button className="rounded-full p-1.5 opacity-70 transition-all hover:bg-white/10 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-white/20 disabled:pointer-events-none">
								<X className="h-4 w-4 text-white" />
								<span className="sr-only">Close</span>
							</button>
						</DialogClose>
					</div>
				</DialogHeader>

				<div className="space-y-6 py-4">
					{!isConnected ? (
						<div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex gap-3">
							<AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
							<div>
								<p className="text-red-200 font-medium">Wallet Not Connected</p>
								<p className="text-red-300/80 text-sm mt-1">
									Please connect your wallet to deposit funds
								</p>
							</div>
						</div>
					) : (
						<>
							{/* Vault Info Cards */}
							<div className="grid grid-cols-2 gap-3">
								<div className="bg-zinc-900/50 rounded-xl p-4 border border-white/5">
									<p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold mb-1">Yield (APY)</p>
									<p className="text-xl font-bold text-emerald-400">{selectedVault?.apy}%</p>
								</div>
								<div className="bg-zinc-900/50 rounded-xl p-4 border border-white/5">
									<p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold mb-1">Total Value</p>
									<p className="text-xl font-bold text-white">{selectedVault?.tvl.toFixed(2)} <span className="text-sm text-zinc-500 font-normal">{selectedVault?.tvlToken}</span></p>
								</div>
							</div>

							{/* Amount Input */}
							<div className="space-y-2">
								<label className="block text-sm font-medium text-zinc-300">
									Amount to Deposit
								</label>
								<div className="relative">
									<Input
										type="number"
										value={depositAmount}
										onChange={(e) => setDepositAmount(e.target.value)}
										placeholder="0.00"
										className="bg-zinc-900/80 border-white/10 text-white text-lg rounded-xl focus:ring-1 focus:ring-white/20 h-14 pr-20"
										disabled={isPending}
									/>
									<button
										onClick={handleMaxClick}
										className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded-md transition-all"
										disabled={isPending}
									>
										MAX
									</button>
								</div>
								<div className="flex justify-between text-xs text-zinc-500 mt-1">
									<span>Token: {selectedVault?.tvlToken}</span>
								</div>
							</div>

							{/* Info Alert */}
							<div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex gap-3 items-start">
								<Info className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
								<div className="text-xs text-blue-200/80 leading-relaxed">
									You'll receive your principal + interest upon withdrawal at the end of the lock period.
								</div>
							</div>

							{/* Error message */}
							{error && (
								<div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex gap-3">
									<AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
									<p className="text-red-200 text-sm">{error}</p>
								</div>
							)}

							{/* Success message */}
							{success && (
								<div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex gap-3">
									<Check className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
									<p className="text-emerald-200 text-sm">Deposit successful! 🎉</p>
								</div>
							)}

							{/* Action Buttons */}
							<div className="space-y-3 pt-2">
								<Button
									onClick={onDeposit}
									disabled={isPending || !depositAmount || Number(depositAmount) <= 0}
									className="w-full bg-white hover:bg-zinc-200 text-zinc-900 font-bold h-12 rounded-xl transition-all disabled:bg-zinc-800 disabled:text-zinc-500"
								>
									{isPending ? "Processing..." : "Confirm Deposit"}
								</Button>

								<Button
									onClick={onClose}
									variant="ghost"
									disabled={isPending}
									className="w-full text-zinc-400 hover:text-white hover:bg-zinc-900 h-12 rounded-xl transition-all"
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
