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
		{ value: 24, label: "1 Day" },
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
			<DialogContent className="bg-[#1A0808]/90 backdrop-blur-sm border border-red-900/20 text-white sm:max-w-[425px] shadow-lg">
				<DialogHeader className="flex flex-row items-center justify-between">
					<DialogTitle>Create A Vault</DialogTitle>
					<button onClick={handleClose} className="text-gray-400 hover:text-white">
						<X className="h-4 w-4" />
					</button>
				</DialogHeader>

				<div className="py-4 space-y-4">
					{/* Vault Name Input */}
					<div>
						<label className="text-sm text-gray-400 mb-1 block">
							Vault Name
						</label>
						<Input
							placeholder="e.g. Savings Vault"
							className="bg-[#2A0A0A]/80 backdrop-blur-sm border-red-900/20"
							value={vaultName}
							onChange={(e) => {
								setVaultName(e.target.value);
								setError("");
							}}
							disabled={isPending || success}
						/>
					</div>

					{/* Token Selection */}
					<div>
						<label className="text-sm text-gray-400 mb-1 block">Token</label>
						<Select
							value={vaultToken}
							onValueChange={(value) => {
								setVaultToken(value);
								setError("");
							}}
							disabled={isPending || success}
						>
							<SelectTrigger className="bg-[#2A0A0A]/80 backdrop-blur-sm border-red-900/20">
								<SelectValue placeholder="Select Token" />
							</SelectTrigger>
							<SelectContent className="bg-[#1A0808] border border-red-900/20 text-gray-400">
								{tokenOptions.map((token) => (
									<SelectItem key={token.value} value={token.value}>
										{token.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<p className="text-xs text-gray-500 mt-1">
							Selected: {tokenOptions.find(t => t.value === vaultToken)?.label || "None"}
						</p>
					</div>

					{/* Duration Selection */}
					<div>
						<label className="text-sm text-gray-400 mb-1 block">
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
							<SelectTrigger className="bg-[#2A0A0A]/80 backdrop-blur-sm border-red-900/20">
								<SelectValue placeholder="Select Duration" />
							</SelectTrigger>
							<SelectContent className="bg-[#1A0808] border border-red-900/20 text-gray-400">
								{durationOptions.map((duration) => (
									<SelectItem key={duration.value} value={duration.value.toString()}>
										{duration.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<p className="text-xs text-gray-500 mt-1">
							Users can withdraw early without interest
						</p>
					</div>

					{/* Interest Rate Input */}
					<div>
						<label className="text-sm text-gray-400 mb-1 block">
							Annual Interest Rate (%)
						</label>
						<Input
							type="number"
							placeholder="e.g. 5"
							min="0.01"
							max="100"
							step="0.01"
							className="bg-[#2A0A0A]/80 backdrop-blur-sm border-red-900/20"
							value={vaultInterestRate}
							onChange={(e) => {
								setVaultInterestRate(Number(e.target.value));
								setError("");
							}}
							disabled={isPending || success}
						/>
						<p className="text-xs text-gray-500 mt-1">
							Interest only paid after lock period expires
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
							Vault created successfully!
						</div>
					)}

					{/* Transaction Status */}
					{isPending && (
						<div className="bg-blue-900/20 text-blue-500 p-3 rounded-md text-sm flex items-center gap-2">
							<div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
							Transaction pending...
						</div>
					)}
				</div>

				{/* Form Summary */}
				<div className="bg-[#2A0A0A]/50 p-3 rounded-md text-xs text-gray-400 space-y-1">
					<div>Name: {vaultName || "Not set"}</div>
					<div>Token: {tokenOptions.find(t => t.value === vaultToken)?.symbol || "Not selected"}</div>
					<div>Duration: {durationOptions.find(d => d.value === vaultDuration)?.label || "Not selected"}</div>
					<div>APY: {vaultInterestRate || 0}%</div>
				</div>

				{/* Create Button */}
				<Button
					className="w-full bg-red-600 hover:bg-red-700"
					onClick={handleCreate}
					disabled={isPending || success}
				>
					{isPending ? "Creating Vault..." : success ? "Vault Created!" : "Create Vault"}
				</Button>
			</DialogContent>
		</Dialog>
	);
}