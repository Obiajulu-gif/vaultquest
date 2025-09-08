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
import { ChevronDown, X, AlertCircle } from "lucide-react";
import { EthIcon } from "@/components/icons/EthIcon";

export default function WithdrawModal({ isOpen, onClose }) {
	const [amount, setAmount] = useState("");
	const [selectedToken, setSelectedToken] = useState("Prize DAI");
	const availableBalance = "4,330.00 USDC";
	const [isProcessing, setIsProcessing] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState(false);

	const handleMax = () => {
		const maxAmount = availableBalance.split(" ")[0].replace(",", "");
		setAmount(maxAmount);
	};

	const handleWithdraw = () => {
		// Validate amount
		if (
			!amount ||
			isNaN(Number.parseFloat(amount)) ||
			Number.parseFloat(amount) <= 0
		) {
			setError("Please enter a valid amount");
			return;
		}

		const maxAmount = Number.parseFloat(
			availableBalance.split(" ")[0].replace(",", "")
		);
		if (Number.parseFloat(amount) > maxAmount) {
			setError("Amount exceeds available balance");
			return;
		}

		setError("");
		setIsProcessing(true);

		// Simulate processing
		setTimeout(() => {
			setIsProcessing(false);
			setSuccess(true);

			// Close modal after success
			setTimeout(() => {
				onClose();
			}, 1500);
		}, 1000);
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="bg-[#1A0808]/90 backdrop-blur-sm border border-red-900/20 text-white sm:max-w-[425px] shadow-lg rounded-xl">
				<DialogHeader className="flex flex-row items-center justify-between">
					<DialogTitle>Withdraw</DialogTitle>
					<button onClick={onClose} className="text-gray-400 hover:text-white">
						<X className="h-4 w-4" />
					</button>
				</DialogHeader>

				<div className="py-4">
					<div className="space-y-4">
						<div className="relative">
							<button className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-sm">
								<EthIcon className="w-5 h-5" />
								{selectedToken}
								<ChevronDown className="h-4 w-4" />
							</button>
							<Input
								type="text"
								value={amount}
								onChange={(e) => setAmount(e.target.value)}
								className="pl-32 pr-16 h-12 bg-[#2A0A0A]/80 backdrop-blur-sm border-red-900/20 text-right rounded-lg focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30"
								placeholder="0.00"
							/>
							<button
								onClick={handleMax}
								className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-red-500 hover:text-red-400"
							>
								Max
							</button>
						</div>

						<div className="text-sm text-gray-400">
							Available: {availableBalance}
						</div>
					</div>
				</div>

				{error && (
					<div className="flex items-center gap-2 text-red-500 text-sm bg-red-900/10 p-3 rounded-lg border border-red-900/30">
						<AlertCircle size={16} />
						{error}
					</div>
				)}

				{success && (
					<div className="bg-green-900/20 text-green-500 p-4 rounded-lg text-sm border border-green-900/30 flex items-center gap-2">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							className="lucide lucide-check-circle"
						>
							<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
							<polyline points="22 4 12 14.01 9 11.01" />
						</svg>
						Withdrawal successful! Your funds have been sent to your wallet.
					</div>
				)}

				<Button
					className={`w-full bg-red-600 hover:bg-red-700 transition-all duration-300 py-3 rounded-lg font-medium ${
						isProcessing ? "animate-pulse" : ""
					}`}
					onClick={handleWithdraw}
					disabled={isProcessing || success}
				>
					{isProcessing ? "Processing..." : "Withdraw"}
				</Button>
			</DialogContent>
		</Dialog>
	);
}
