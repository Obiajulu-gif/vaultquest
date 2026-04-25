"use client";

import { useState, useEffect, useMemo } from "react";
import AppNav from "@/components/app/AppNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Users, TrendingUp, Wallet } from "lucide-react";
import CreateVaultModal from "@/components/app/CreateVaultModal";
import DepositModal from "@/components/app/DepositModal";
import WithdrawalModal from "@/components/app/WithdrawalModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RecentDeposits from "@/components/RecentDeposits";

// Wagmi imports
import {
	useReadContract,
	useReadContracts,
	useAccount,
	useChainId,
	useWriteContract,
	useWaitForTransactionReceipt,
} from "wagmi";
import { vaultData } from "@/app/contract/Vault";
import { parseEther, formatEther } from "viem";
import Image from "next/image";

export default function VaultPage() {
	const { address } = useAccount();
	const chainId = useChainId();

	// UI State
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
	const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
	const [selectedVault, setSelectedVault] = useState(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [activeFilter, setActiveFilter] = useState("all");
	const [vaultId, setVaultId] = useState(0);
	const [submitted, setSubmitted] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState(false);
	const [vaultWinners, setVaultWinners] = useState({});

	// Form state
	const [vaultName, setVaultName] = useState("");
	const [vaultToken, setVaultToken] = useState("0x0000000000000000000000000000000000000000");
	const [vaultDuration, setVaultDuration] = useState(500000000000);
	const [vaultInterestRate, setVaultInterestRate] = useState(3);
	const [depositAmount, setDepositAmount] = useState("2");
	const [withdrawalAmount, setWithdrawalAmount] = useState("0");

	// Contract reads
	const { data: adminWallet } = useReadContract({
		...vaultData,
		functionName: "adminWallet",
		args: [],
	});

	const { data: totalVaults, refetch: refetchTotalVaults } = useReadContract({
		...vaultData,
		functionName: "vaultCount",
		args: [],
	});

	// Fetch all vaults with useReadContracts
	const {
		data: vaultsData,
		isLoading: isLoadingVaults,
		refetch: refetchVaults,
	} = useReadContracts({
		contracts: totalVaults
			? Array.from({ length: Number(totalVaults) }, (_, i) => ({
				...vaultData,
				functionName: "getVaultInfo",
				args: [i],
			}))
			: [],
	});

	// Read depositor balances for connected address 
	const {
		data: depositorBalancesData,
		isLoading: isLoadingDepositorBalances,
		refetch: refetchDepositorBalances,
	} = useReadContracts({
		contracts:
			address && totalVaults
				? Array.from({ length: Number(totalVaults) }, (_, i) => ({
					...vaultData,
					functionName: "getDepositorBalance",
					args: [i, address],
				}))
				: [],
	});

	// 1) For each vault, call getVaultDepositors(vaultId)
	const {
		data: vaultDepositorsData,
		isLoading: isLoadingVaultDepositors,
		refetch: refetchVaultDepositors,
	} = useReadContracts({
		contracts: totalVaults
			? Array.from({ length: Number(totalVaults) }, (_, i) => ({
				...vaultData,
				functionName: "getVaultDepositors",
				args: [i],
			}))
			: [],
	});

	// 2) Build flattened contracts array for getDepositorBalance(vaultId, depositor)
	// Also build depositorMeta to map results back to vault + depositor address
	let depositorBalanceContracts = [];
	let depositorMeta = [];

	if (vaultDepositorsData && vaultDepositorsData.length > 0) {
		vaultDepositorsData.forEach((entry, vaultIndex) => {
			const addrs = entry?.result || [];
			addrs.forEach((addr) => {
				depositorBalanceContracts.push({
					...vaultData,
					functionName: "getDepositorBalance",
					args: [vaultIndex, addr],
				});
				depositorMeta.push({
					vaultId: vaultIndex,
					vaultName:
						// vault name comes from the earlier getVaultInfo result mapped later,
						// we'll fall back to `Vault ${vaultIndex}` if not ready
						(vaultsData && vaultsData[vaultIndex]?.result?.[0]) || `Vault ${vaultIndex}`,
					address: addr,
				});
			});
		});
	}

	const {
		data: depositorBalancesAllData,
		isLoading: isLoadingAllDepositorBalances,
		refetch: refetchAllDepositorBalances,
	} = useReadContracts({
		contracts: depositorBalanceContracts.length ? depositorBalanceContracts : [],
	});

	// Check which vaults have winners
	const {
		data: hasWinnerData,
		isLoading: isLoadingHasWinner,
		refetch: refetchHasWinner,
	} = useReadContracts({
		contracts: totalVaults
			? Array.from({ length: Number(totalVaults) }, (_, i) => ({
				...vaultData,
				functionName: "hasWinner",
				args: [i],
			}))
			: [],
	});

	// Memoize vaultsWithWinners to prevent recreation on every render
	const vaultsWithWinners = useMemo(() => {
		if (!hasWinnerData) return [];
		return hasWinnerData
			.map((result, index) => (result?.result === true ? index : null))
			.filter((id) => id !== null);
	}, [hasWinnerData]);

	// Get winner info for vaults that have winners
	const {
		data: winnerInfoData,
		isLoading: isLoadingWinnerInfo,
		refetch: refetchWinnerInfo,
	} = useReadContracts({
		contracts: vaultsWithWinners.length > 0
			? vaultsWithWinners.map((vaultId) => ({
				...vaultData,
				functionName: "getWinnerInfo",
				args: [vaultId],
			}))
			: [],
	});

	// ---------- END NEW wagmi reads ------------

	// Contract writes
	const { writeContract, isPending, data: hash } = useWriteContract();

	// Wait for confirmation
	const {
		isLoading: isConfirming,
		isSuccess: isConfirmed,
		isError: isTxError,
	} = useWaitForTransactionReceipt({
		hash,
	});

	// Refetch vaults and depositor balances after confirmation
	useEffect(() => {
		if (isConfirmed) {
			setSuccess(true);
			setTimeout(() => {
				refetchVaults();
				refetchTotalVaults();
				refetchDepositorBalances();

				refetchVaultDepositors();
				refetchAllDepositorBalances();
				refetchHasWinner();
				refetchWinnerInfo();
				setSubmitted(false);
				setSuccess(false);
				setIsCreateModalOpen(false);
				setIsDepositModalOpen(false);
			}, 2500); // wait for 2.5 secs to show success message
		}
	}, [
		isConfirmed,
		refetchVaults,
		refetchTotalVaults,
		refetchDepositorBalances,
		refetchVaultDepositors,
		refetchAllDepositorBalances,
		refetchHasWinner,
		refetchWinnerInfo,
	]);

	// Refetch depositor balances whenever address or totalVaults changes
	useEffect(() => {
		if (address && totalVaults) {
			refetchDepositorBalances();
		}
	}, [address, totalVaults, refetchDepositorBalances]);

	// Process winner data
	useEffect(() => {
		if (!winnerInfoData || vaultsWithWinners.length === 0) return;

		const winners = {};
		vaultsWithWinners.forEach((vaultId, index) => {
			const winnerData = winnerInfoData[index]?.result;
			if (winnerData) {
				const [winnerAddress, totalInterest] = winnerData;
				winners[vaultId] = {
					address: winnerAddress,
					totalInterest: formatEther(totalInterest),
				};

			}
		});

		// Only update state if winners object has changed
		setVaultWinners(prevWinners => {
			const hasChanged = JSON.stringify(prevWinners) !== JSON.stringify(winners);
			return hasChanged ? winners : prevWinners;
		});
	}, [winnerInfoData]);

	// Helper function to format vault data
	const formatVaultForDisplay = (vaultData, vaultId) => {
		if (!vaultData) {
			return {
				id: vaultId,
				name: `Vault ${vaultId}`,
				network: "AVAX",
				apy: 0,
				tvl: 0,
				tvlToken: "AVAX",
				balance: 0,
				balanceToken: "AVAX",
				users: 0,
				token: "0x0000000000000000000000000000000000000000",
				timeLeft: 0,
				active: false,
			};
		}

		const [
			name,
			token,
			totalDeposits,
			creationTime,
			duration,
			interestRate,
			active,
			timeLeft,
			depositorCount,
		] = vaultData.result || [];

		const isETH = token === "0x0000000000000000000000000000000000000000";
		const tokenSymbol = isETH ? "AVAX" : "TOKEN";
		const formattedTVL = totalDeposits ? Number(formatEther(totalDeposits)) : 0;
		const annualRate = interestRate ? Number(interestRate) / 100 : 0;

		return {
			id: vaultId,
			name: name || `Vault ${vaultId}`,
			network: "AVAX",
			apy: annualRate,
			tvl: formattedTVL,
			tvlToken: tokenSymbol,
			balance: 0, // will be populated from depositorBalancesData when available
			balanceToken: tokenSymbol,
			users: Number(depositorCount) || 0,
			token,
			timeLeft: Number(timeLeft) || 0,
			active: active || false,
		};
	};

	// Build blockchainVaults and inject depositor balance for connected address
	const blockchainVaults =
		vaultsData
			?.map((vaultInfo, index) => {
				const vault = formatVaultForDisplay(vaultInfo, index);

				// depositorBalancesData entries come in the same order as the contracts array
				const depositorResult = depositorBalancesData?.[index]?.result || null;
				if (depositorResult) {
					const principal = depositorResult[0] ?? null;
					const currentInterest = depositorResult[1] ?? null;

					const principalNum = principal ? Number(formatEther(principal)) : 0;
					const interestNum = currentInterest ? Number(formatEther(currentInterest)) : 0;

					vault.balance = principalNum + interestNum;
					vault.balanceToken = vault.tvlToken;
				}

				return vault;
			}) || [];

	// ---------- Build globalDeposits from depositorBalancesAllData + depositorMeta ----------
	let globalDeposits = [];

	if (depositorBalancesAllData && depositorMeta && depositorMeta.length) {
		globalDeposits = depositorBalancesAllData
			.map((entry, idx) => {
				const meta = depositorMeta[idx];
				if (!entry || !meta) return null;

				const principal = entry?.result?.[0] ?? 0;
				const currentInterest = entry?.result?.[1] ?? 0;

				const principalNum = principal ? Number(formatEther(principal)) : 0;
				const interestNum = currentInterest ? Number(formatEther(currentInterest)) : 0;
				const amount = principalNum + interestNum;

				if (amount <= 0) return null;

				return {
					vaultId: meta.vaultId,
					vaultName: meta.vaultName,
					address: meta.address,
					amount,
					// placeholder timestamp for now (as agreed) — we can replace with real tx timestamp later
					date: new Date().toISOString(),
				};
			})
			.filter(Boolean);

		// sort newest → oldest (we're using the placeholder timestamp)
		globalDeposits.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
	}

	// Filter vaults
	const filteredVaults = blockchainVaults
		.filter((vault) => vault.active)
		.filter(
			(vault) =>
				vault.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				vault.tvlToken.toLowerCase().includes(searchQuery.toLowerCase())
		);

	// Contract interaction handlers
	const handleCreateVault = () => {
		if (!address || address !== adminWallet) {
			console.log("Permission denied - not admin wallet");
			return;
		}

		const vaultDurationInSeconds = vaultDuration * 60 * 60;

		writeContract({
			...vaultData,
			functionName: "createVault",
			args: [vaultName, vaultToken, vaultDurationInSeconds, (vaultInterestRate * 100)], //multiply the interest rate by 100 (demanded by the smart contract)
		});

		setSubmitted(true);
	};

	const handleFundVault = async () => {
		if (!depositAmount || Number(depositAmount) <= 0) {
			setError("Please enter a valid amount");
			return;
		}

		if (vaultId === undefined || vaultId === null) {
			setError("Vault ID is missing");
			return;
		}

		try {
			setError("");
			setSubmitted(false);
			setSuccess(false);

			await writeContract({
				...vaultData,
				functionName: "deposit",
				args: [vaultId, parseEther(depositAmount)], 
				value: parseEther(depositAmount), // only valid for AVAX vaults
			});

		} catch (err) {
			console.error("Deposit error:", err);
			setError(err?.shortMessage || err?.message || "Deposit failed");
		}
	};

	const handleWithdrawFromVault = () => {
		if (vaultId === undefined || vaultId === null || !selectedVault) return;

		const maxWithdraw = selectedVault.balance || 0;

		if (maxWithdraw <= 0) {
			setError(`You have nothing to withdraw`);
			return;
		}

		setError("");

		writeContract({
			...vaultData,
			functionName: "withdraw",
			args: [vaultId],
		});

		setSubmitted(true);
	};


	const handleOpenDeposit = (vault) => {
		setSelectedVault(vault);
		setVaultId(vault.id);
		setIsDepositModalOpen(true);
	};

	// Skeleton loader
	const VaultSkeleton = () => (
		<div className="bg-[#1A0808]/70 backdrop-blur-sm rounded-xl p-6 border border-red-900/20 shadow-lg animate-pulse">
			<div className="flex items-center justify-between mb-4">
				<div className="flex items-center gap-2">
					<div className="w-10 h-10 rounded-full bg-gray-700"></div>
					<div>
						<div className="h-4 bg-gray-700 rounded w-24 mb-2"></div>
						<div className="h-3 bg-gray-700 rounded w-16"></div>
					</div>
				</div>
				<div className="h-6 bg-gray-700 rounded w-16"></div>
			</div>
			<div className="space-y-3 mb-4">
				<div className="flex justify-between">
					<div className="h-3 bg-gray-700 rounded w-12"></div>
					<div className="h-3 bg-gray-700 rounded w-20"></div>
				</div>
				<div className="flex justify-between">
					<div className="h-3 bg-gray-700 rounded w-12"></div>
					<div className="h-3 bg-gray-700 rounded w-16"></div>
				</div>
				<div className="flex justify-between">
					<div className="h-3 bg-gray-700 rounded w-16"></div>
					<div className="h-3 bg-gray-700 rounded w-12"></div>
				</div>
			</div>
			<div className="h-10 bg-gray-700 rounded"></div>
		</div>
	);

	return (
		<div className="min-h-screen bg-gradient-to-b from-[#1A0505] to-[#2D0A0A] text-white">
			<AppNav />
			<main className="container mx-auto px-4 py-8 lg:px-6">
				<div className="max-w-7xl mx-auto">
					{/* Header Section */}
					<div className="mb-8">
						<div className="flex flex-col gap-2 mb-6">
							<h1 className="text-4xl md:text-5xl font-bold tracking-tight">Prize Vaults</h1>
							<p className="text-gray-400 text-lg">Deposit, earn, and win with our curated vault collection</p>
						</div>

						{/* Key Stats - Hero Section */}
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
							<div className="bg-gradient-to-br from-red-900/20 to-red-900/10 backdrop-blur-sm rounded-lg p-5 border border-red-900/30 shadow-lg hover:shadow-xl transition-shadow">
								<div className="text-sm text-gray-400 font-medium mb-2">Total Value Locked</div>
								<div className="text-2xl md:text-3xl font-bold">
									{filteredVaults
										.reduce((sum, vault) => sum + vault.tvl, 0)
										.toFixed(2)}{" "}
									<span className="text-sm text-gray-400 font-normal">AVAX</span>
								</div>
								<div className="text-xs text-gray-500 mt-2">Across {filteredVaults.length} active vaults</div>
							</div>

							<div className="bg-gradient-to-br from-red-900/20 to-red-900/10 backdrop-blur-sm rounded-lg p-5 border border-red-900/30 shadow-lg hover:shadow-xl transition-shadow">
								<div className="text-sm text-gray-400 font-medium mb-2">Active Users</div>
								<div className="text-2xl md:text-3xl font-bold">
									{filteredVaults.reduce((sum, vault) => sum + vault.users, 0)}
									<span className="text-sm text-gray-400 font-normal ml-1">users</span>
								</div>
								<div className="text-xs text-gray-500 mt-2">Total depositors</div>
							</div>

							<div className="bg-gradient-to-br from-red-900/20 to-red-900/10 backdrop-blur-sm rounded-lg p-5 border border-red-900/30 shadow-lg hover:shadow-xl transition-shadow">
								<div className="text-sm text-gray-400 font-medium mb-2">Average Yield</div>
								<div className="text-2xl md:text-3xl font-bold">
									{filteredVaults.length > 0
										? (
											filteredVaults.reduce(
												(sum, vault) => sum + vault.apy,
												0
											) / filteredVaults.length
										).toFixed(1)
										: 0}
									<span className="text-sm text-gray-400 font-normal ml-1">%</span>
								</div>
								<div className="text-xs text-gray-500 mt-2">APY across vaults</div>
							</div>
						</div>
					</div>

					{/* Controls Section */}
					<div className="bg-[#1A0808]/40 backdrop-blur-sm rounded-xl border border-red-900/20 p-4 md:p-6 shadow-lg mb-8">
						<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
							<div>
								<h2 className="text-lg font-semibold mb-3 md:mb-0">Explore Vaults</h2>
								<p className="text-sm text-gray-400 hidden md:block">Filter and search to find the perfect vault for you</p>
							</div>
							{address === adminWallet && (
								<Button
									className="bg-red-600 hover:bg-red-700 w-full md:w-auto flex items-center justify-center gap-2 shadow-lg"
									onClick={() => setIsCreateModalOpen(true)}
								>
									<Plus size={18} />
									<span>Create Vault</span>
								</Button>
							)}
						</div>

						{/* Search and Filter Controls */}
						<div className="flex flex-col md:flex-row gap-3">
							<div className="flex-1 relative">
								<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
								<Input
									placeholder="Search by vault name or token..."
									className="pl-10 bg-[#2A0A0A]/70 backdrop-blur-sm border-red-900/20 w-full text-sm md:text-base"
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
								/>
							</div>
							<div className="bg-[#2A0A0A]/80 backdrop-blur-sm rounded-lg p-1 border border-red-900/10 inline-flex md:w-auto gap-1">
								<button
									className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${activeFilter === "all" ? "bg-red-600 text-white shadow-md" : "text-gray-400 hover:text-white hover:bg-red-900/20"
										}`}
									onClick={() => setActiveFilter("all")}
								>
									All
								</button>
								<button
									className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${activeFilter === "AVAX"
										? "bg-red-600 text-white shadow-md"
										: "text-gray-400 hover:text-white hover:bg-red-900/20"
										}`}
									onClick={() => setActiveFilter("AVAX")}
								>
									AVAX Only
								</button>
							</div>
						</div>

						<div className="mt-4 text-xs text-gray-500 flex flex-col md:flex-row justify-between gap-2">
							<span>Showing {filteredVaults.length} of {totalVaults ? Number(totalVaults) : 0} vaults</span>
							<span>Vault Manager: {adminWallet ? `${adminWallet.slice(0, 6)}...${adminWallet.slice(-4)}` : "Loading..."}</span>
						</div>
					</div>

					{/* Vault Cards Grid */}
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
						{isLoadingVaults ? (
							Array.from({ length: 6 }, (_, i) => <VaultSkeleton key={i} />)
						) : filteredVaults.length > 0 ? (
							filteredVaults.map((vault) => (
								<div
									key={vault.id}
									className="bg-[#1A0808]/60 backdrop-blur-sm rounded-xl border border-red-900/20 shadow-lg hover:shadow-2xl hover:border-red-500/40 transition-all duration-300 overflow-hidden group"
								>
									{/* Card Header */}
									<div className="p-5 md:p-6 border-b border-red-900/10">
										<div className="flex items-start justify-between mb-4">
											<div className="flex items-center gap-3">
												<Image
													src="/images/avax.png"
													height={40}
													width={40}
													alt="avax icon"
													className="w-10 h-10 rounded-full bg-red-900/20 p-1.5"
												/>
												<div className="min-w-0 flex-1">
													<h3 className="font-semibold text-base md:text-lg truncate">{vault.name}</h3>
													<p className="text-xs text-gray-500">Vault ID: {vault.id}</p>
												</div>
											</div>
											<div className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${vault.active ? "bg-green-900/20 text-green-400 border border-green-500/30" : "bg-gray-900/20 text-gray-400 border border-gray-500/30"
												}`}>
												{vault.active ? "✓ Active" : "Inactive"}
											</div>
										</div>

										{/* APY Highlight */}
										<div className="inline-block bg-gradient-to-r from-red-600/40 to-red-700/40 px-3 py-2 rounded-lg border border-red-500/30">
											<div className="text-xs text-gray-300 font-medium">APY</div>
											<div className="text-lg font-bold text-red-400">{vault.apy}%</div>
										</div>
									</div>

									{/* Card Body */}
									<div className="p-5 md:p-6 space-y-4">
										{/* Metrics Row 1 */}
										<div className="grid grid-cols-2 gap-3">
											<div className="bg-[#2A0A0A]/50 rounded-lg p-3 border border-red-900/10">
												<div className="text-xs text-gray-400 font-medium flex items-center gap-1 mb-1">
													<Wallet size={12} /> Total Value
												</div>
												<div className="text-sm md:text-base font-semibold">
													{vault.tvl.toFixed(3)}
													<span className="text-xs text-gray-400 ml-1">{vault.tvlToken}</span>
												</div>
											</div>
											<div className="bg-[#2A0A0A]/50 rounded-lg p-3 border border-red-900/10">
												<div className="text-xs text-gray-400 font-medium flex items-center gap-1 mb-1">
													<Users size={12} /> Participants
												</div>
												<div className="text-sm md:text-base font-semibold">{vault.users}</div>
											</div>
										</div>

										{/* Metrics Row 2 */}
										<div className="grid grid-cols-2 gap-3">
											<div className="bg-[#2A0A0A]/50 rounded-lg p-3 border border-red-900/10">
												<div className="text-xs text-gray-400 font-medium mb-1">Your Balance</div>
												<div className="text-sm md:text-base font-semibold">
													{vault.balance.toFixed(3)}
													<span className="text-xs text-gray-400 ml-1">{vault.balanceToken}</span>
												</div>
											</div>
											<div className="bg-[#2A0A0A]/50 rounded-lg p-3 border border-red-900/10">
												<div className="text-xs text-gray-400 font-medium mb-1">Time Remaining</div>
												<div className="text-sm md:text-base font-semibold">
													{vault.timeLeft > 0 ? `${Math.floor(vault.timeLeft / 86400)}d` : "Expired"}
												</div>
											</div>
										</div>

										{/* Winner Badge */}
										{vaultWinners[vault.id] && (
											<div className="bg-gradient-to-r from-green-900/30 to-green-900/20 rounded-lg p-3 border border-green-500/30">
												<div className="text-xs text-green-400 font-semibold flex items-center gap-2 mb-2">
													🏆 Recent Winner
												</div>
												<div className="text-xs text-green-300 font-mono truncate">
													{vaultWinners[vault.id].address.slice(0, 8)}...
													{vaultWinners[vault.id].address.slice(-6)}
												</div>
											</div>
										)}
									</div>

									{/* Card Actions */}
									<div className="p-4 md:p-5 border-t border-red-900/10 bg-[#0F0505]/30 space-y-2">
										<Button
											className="w-full bg-red-600 hover:bg-red-700 shadow-md hover:shadow-lg transition-all text-sm md:text-base"
											onClick={() => handleOpenDeposit(vault)}
											disabled={!vault.active || vault.timeLeft <= 0}
										>
											{vault.timeLeft <= 0 ? "Vault Expired" : "Deposit Now"}
										</Button>

										<Button
											variant="outline"
											className="w-full border-red-900/30 text-gray-300 hover:bg-red-900/20 hover:text-red-300 transition-all text-sm md:text-base"
											onClick={() => {
												setSelectedVault(vault);
												setVaultId(vault.id);
												setIsWithdrawalModalOpen(true);
											}}
											disabled={!vault.active || vault.balance <= 0}
										>
											Withdraw {vault.balance > 0 ? `(${vault.balance.toFixed(3)})` : ""}
										</Button>
									</div>
								</div>
							))
						) : (
							<div className="col-span-full text-center py-16">
								<div className="text-gray-400 mb-2">
									<TrendingUp size={48} className="mx-auto opacity-20 mb-4" />
								</div>
								<p className="text-lg font-medium text-gray-300">
									{totalVaults && Number(totalVaults) > 0
										? "No vaults match your search"
										: "No vaults created yet"}
								</p>
								<p className="text-sm text-gray-500 mt-2">
									{totalVaults && Number(totalVaults) > 0
										? "Try adjusting your filters"
										: "Check back soon for new vaults"}
								</p>
							</div>
						)}
					</div>

					{filteredVaults.length > 0 && (
						<div className="bg-[#1A0808]/40 backdrop-blur-sm rounded-xl border border-red-900/20 p-6 md:p-8 shadow-lg">
							<h2 className="text-2xl font-bold mb-6">Activity & Insights</h2>
							
							{/* Updated Tabs: added Recent Deposits tab (global) */}
							<Tabs defaultValue="deposits" className="w-full">
								<TabsList className="bg-[#2A0A0A]/80 border border-red-900/10 mb-6 w-full justify-start">
									<TabsTrigger value="deposits" className="text-sm md:text-base">Recent Deposits</TabsTrigger>
									<TabsTrigger value="stats" className="text-sm md:text-base">Detailed Stats</TabsTrigger>
								</TabsList>

								{/* Recent Deposits (global feed) */}
								<TabsContent value="deposits">
									{globalDeposits && globalDeposits.length > 0 ? (
										<RecentDeposits deposits={globalDeposits} />
									) : (
										<div className="text-center py-12 text-gray-400">
											<p>No deposits recorded yet</p>
										</div>
									)}
								</TabsContent>

								{/* Vault Statistics */}
								<TabsContent value="stats">
									<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
										<div className="bg-gradient-to-br from-red-900/20 to-red-900/10 backdrop-blur-sm rounded-lg p-6 border border-red-900/30 hover:shadow-lg transition-shadow">
											<h3 className="text-sm font-medium text-gray-400 mb-2">
												Total Value Locked
											</h3>
											<div className="text-3xl md:text-4xl font-bold mb-2">
												{filteredVaults
													.reduce((sum, vault) => sum + vault.tvl, 0)
													.toFixed(2)}
											</div>
											<p className="text-xs text-gray-500">
												AVAX across {filteredVaults.length} active vaults
											</p>
										</div>

										<div className="bg-gradient-to-br from-blue-900/20 to-blue-900/10 backdrop-blur-sm rounded-lg p-6 border border-blue-900/30 hover:shadow-lg transition-shadow">
											<h3 className="text-sm font-medium text-gray-400 mb-2">Total Users</h3>
											<div className="text-3xl md:text-4xl font-bold mb-2">
												{filteredVaults.reduce(
													(sum, vault) => sum + vault.users,
													0
												)}
											</div>
											<p className="text-xs text-gray-500">
												Active depositors in ecosystem
											</p>
										</div>

										<div className="bg-gradient-to-br from-purple-900/20 to-purple-900/10 backdrop-blur-sm rounded-lg p-6 border border-purple-900/30 hover:shadow-lg transition-shadow">
											<h3 className="text-sm font-medium text-gray-400 mb-2">Average Yield</h3>
											<div className="text-3xl md:text-4xl font-bold mb-2">
												{filteredVaults.length > 0
													? (
														filteredVaults.reduce(
															(sum, vault) => sum + vault.apy,
															0
														) / filteredVaults.length
													).toFixed(2)
													: 0}
												<span className="text-sm text-gray-400 font-normal ml-1">%</span>
											</div>
											<p className="text-xs text-gray-500">
												Weighted average APY
											</p>
										</div>
									</div>
								</TabsContent>
							</Tabs>
						</div>
					)}
				</div>
			</main>

			<CreateVaultModal
				isOpen={isCreateModalOpen}
				onClose={() => setIsCreateModalOpen(false)}
				onCreateVault={handleCreateVault}
				vaultName={vaultName}
				setVaultName={setVaultName}
				vaultToken={vaultToken}
				setVaultToken={setVaultToken}
				vaultDuration={vaultDuration}
				setVaultDuration={setVaultDuration}
				vaultInterestRate={vaultInterestRate}
				setVaultInterestRate={setVaultInterestRate}
				isPending={isPending || isConfirming}
			/>

			<DepositModal
				isOpen={isDepositModalOpen}
				onClose={() => setIsDepositModalOpen(false)}
				selectedVault={selectedVault}
				onDeposit={handleFundVault}
				depositAmount={depositAmount}
				setDepositAmount={setDepositAmount}
				error={error}
				success={success}
				isPending={isPending || isConfirming}
			/>
			<WithdrawalModal
				isOpen={isWithdrawalModalOpen}
				onClose={() => setIsWithdrawalModalOpen(false)}
				selectedVault={selectedVault}
				onWithdraw={handleWithdrawFromVault}
				withdrawalAmount={withdrawalAmount}
				setWithdrawalAmount={setWithdrawalAmount}
				error={error}
				success={success}
				isPending={isPending || isConfirming}
			/>
		</div>
	);
}
