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
import { X, AlertCircle, Check } from "lucide-react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

export default function CreateVaultModal({
	isOpen,
	onClose,
	onCreateVault,
	vaultName,
	setVaultName,
	vaultToken,
	setVaultToken,
	vaultDuration,
	setVaultDuration,
	vaultInterestRate,
	setVaultInterestRate,
	isPending
}) {
	const [error, setError] = useState("");
	const [success, setSuccess] = useState(false);

	// Token options with their contract addresses
	const tokenOptions = [
		{ value: "0x0000000000000000000000000000000000000000", label: "AVAX", symbol: "AVAX" },
		{ value: "0xA0b86a33E6441893F6f7AD06c28f5BAA7D4b0D16", label: "USDC", symbol: "USDC" },
		{ value: "0xdAC17F958D2ee523a2206206994597C13D831ec7", label: "USDT", symbol: "USDT" },
		{ value: "0x6B175474E89094C44Da98b954EedeAC495271d0F", label: "DAI", symbol: "DAI" },
		{ value: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14", label: "WETH", symbol: "WETH" }
	];

	// Duration options in hours (will be converted to seconds in parent)
	const durationOptions = [
		{ value: 0.25, label: "15 minutes (testing only)" },
		{ value: 0.5, label: "30 minutes (testing only)" },
		{ value: 168, label: "1 Week" },
		{ value: 336, label: "2 Weeks" },
		{ value: 720, label: "1 Month" },
		{ value: 2160, label: "3 Months" },
		{ value: 4320, label: "6 Months" },
		{ value: 8760, label: "1 Year" }
	];

	const handleCreate = () => {
		// Validate form data
		if (!vaultName.trim()) {
			setError("Please enter a vault name");
			return;
		}

		if (!vaultToken) {
			setError("Please select a token");
			return;
		}

		if (!vaultDuration || vaultDuration <= 0) {
			setError("Please select a valid duration");
			return;
		}

		if (!vaultInterestRate || vaultInterestRate <= 0 || vaultInterestRate > 10000) {
			setError("Interest rate must be between 0.01% and 100%");
			return;
		}

		setError("");

		// Call the parent's create vault function
		if (onCreateVault) {
			onCreateVault();
		}
	};

	const handleClose = () => {
		// Reset form when closing
		setError("");
		setSuccess(false);
		onClose();
	};

	// Handle successful transaction (would be triggered from parent)
	const handleSuccess = () => {
		setSuccess(true);
		setTimeout(() => {
			handleClose();
		}, 2000);
	};

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="bg-zinc-950 border border-white/10 max-w-md max-h-screen overflow-y-auto rounded-2xl shadow-2xl">
				<DialogHeader className="border-b border-white/5 pb-4">
					<div className="flex items-start justify-between">
						<div>
							<DialogTitle className="text-2xl font-bold text-white tracking-tight">Create New Vault</DialogTitle>
							<p className="text-sm text-zinc-400 mt-1">
								Configure a new prize-linked savings vault
							</p>
						</div>
						<button onClick={handleClose} className="rounded-full p-1.5 opacity-70 transition-all hover:bg-white/10 hover:opacity-100">
							<X className="h-4 w-4 text-white" />
							<span className="sr-only">Close</span>
						</button>
					</div>
				</DialogHeader>

				<div className="py-6 space-y-5">
					{/* Vault Name Input */}
					<div>
						<label className="text-sm font-medium text-zinc-300 mb-2 block">
							Vault Name
						</label>
						<Input
							placeholder="e.g. Summer Savings"
							className="bg-zinc-900/80 border-white/10 text-white focus:ring-1 focus:ring-white/20 rounded-xl h-12"
							value={vaultName}
							onChange={(e) => {
								setVaultName(e.target.value);
								setError("");
							}}
							disabled={isPending || success}
						/>
						<p className="text-xs text-zinc-500 mt-1.5">
							A memorable name for your vault
						</p>
					</div>

					{/* Token Selection */}
					<div>
						<label className="text-sm font-medium text-zinc-300 mb-2 block">
							Asset Token
						</label>
						<Select
							value={vaultToken}
							onValueChange={(value) => {
								setVaultToken(value);
								setError("");
							}}
							disabled={isPending || success}
						>
							<SelectTrigger className="bg-zinc-900/80 border-white/10 text-white focus:ring-1 focus:ring-white/20 rounded-xl h-12">
								<SelectValue placeholder="Select Token" />
							</SelectTrigger>
							<SelectContent className="bg-zinc-950 border border-white/10 rounded-xl">
								{tokenOptions.map((token) => (
									<SelectItem key={token.value} value={token.value} className="focus:bg-zinc-800">
										<span className="text-white">{token.label}</span>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<p className="text-xs text-zinc-500 mt-1.5">
							Selected: {tokenOptions.find(t => t.value === vaultToken)?.label || "Select a token"}
						</p>
					</div>

					{/* Duration Selection */}
					<div>
						<label className="text-sm font-medium text-zinc-300 mb-2 block">
							Lock Duration
						</label>
						<Select
							value={vaultDuration.toString()}
							onValueChange={(value) => {
								setVaultDuration(Number(value));
								setError("");
							}}
							disabled={isPending || success}
						>
							<SelectTrigger className="bg-zinc-900/80 border-white/10 text-white focus:ring-1 focus:ring-white/20 rounded-xl h-12">
								<SelectValue placeholder="Select Duration" />
							</SelectTrigger>
							<SelectContent className="bg-zinc-950 border border-white/10 rounded-xl">
								{durationOptions.map((duration) => (
									<SelectItem key={duration.value} value={duration.value.toString()} className="focus:bg-zinc-800">
										<span className="text-white">{duration.label}</span>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<p className="text-xs text-zinc-500 mt-1.5">
							How long deposits are locked
						</p>
					</div>

					{/* Interest Rate Input */}
					<div>
						<label className="text-sm font-medium text-zinc-300 mb-2 block">
							Annual Yield Rate (%)
						</label>
						<Input
							type="number"
							placeholder="e.g. 5.5"
							min="0.01"
							max="100"
							step="0.01"
							className="bg-zinc-900/80 border-white/10 text-white focus:ring-1 focus:ring-white/20 rounded-xl h-12"
							value={vaultInterestRate}
							onChange={(e) => {
								setVaultInterestRate(Number(e.target.value));
								setError("");
							}}
							disabled={isPending || success}
						/>
						<p className="text-xs text-zinc-500 mt-1.5">
							APY paid after lock period completes
						</p>
					</div>

					{/* Configuration Summary */}
					<div className="bg-zinc-900/50 rounded-xl p-4 border border-white/5 space-y-2">
						<p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-3">Vault Configuration</p>
						<div className="space-y-2 text-sm">
							<div className="flex justify-between">
								<span className="text-zinc-500">Vault Name:</span>
								<span className="text-white font-medium">{vaultName || "—"}</span>
							</div>
							<div className="flex justify-between">
								<span className="text-zinc-500">Token:</span>
								<span className="text-white font-medium">{tokenOptions.find(t => t.value === vaultToken)?.label || "—"}</span>
							</div>
							<div className="flex justify-between">
								<span className="text-zinc-500">Duration:</span>
								<span className="text-white font-medium">{durationOptions.find(d => d.value.toString() === vaultDuration.toString())?.label || "—"}</span>
							</div>
							<div className="flex justify-between">
								<span className="text-zinc-500">APY:</span>
								<span className="text-white font-medium">{vaultInterestRate}%</span>
							</div>
						</div>
					</div>

					{/* Error Display */}
					{error && (
						<div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
							<AlertCircle size={18} className="text-red-400 flex-shrink-0" />
							<p className="text-red-200 text-sm">{error}</p>
						</div>
					)}

					{/* Success Display */}
					{success && (
						<div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
							<Check size={18} className="text-emerald-400 flex-shrink-0" />
							<p className="text-emerald-200 text-sm">Vault created successfully!</p>
						</div>
					)}

					{/* Transaction Status */}
					{isPending && (
						<div className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
							<div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
							<p className="text-blue-200 text-sm">Transaction pending...</p>
						</div>
					)}
				</div>

				{/* Action Buttons */}
				<div className="space-y-3 pt-4 border-t border-white/5">
					<Button
						className="w-full bg-white hover:bg-zinc-200 text-zinc-900 font-bold h-12 rounded-xl transition-all disabled:bg-zinc-800 disabled:text-zinc-500 mt-4"
						onClick={handleCreate}
						disabled={isPending || success}
					>
						{isPending ? "Creating Vault..." : success ? "✓ Vault Created" : "Create Vault"}
					</Button>

					<Button
						variant="ghost"
						className="w-full text-zinc-400 hover:text-white hover:bg-zinc-900 h-12 rounded-xl transition-all"
						onClick={handleClose}
						disabled={isPending}
					>
						Cancel
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}