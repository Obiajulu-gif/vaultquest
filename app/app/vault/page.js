"use client";

import { useState, useEffect, useMemo } from "react";
import AppNav from "@/components/app/AppNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Users, TrendingUp, Wallet, Coins, Clock, ChevronRight } from "lucide-react";
import CreateVaultModal from "@/components/app/CreateVaultModal";
import DepositModal from "@/components/app/DepositModal";
import WithdrawModal from "@/components/app/WithdrawModal";
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
				network: "Native",
				apy: 0,
				tvl: 0,
				tvlToken: "Native",
				balance: 0,
				balanceToken: "Native",
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
		const tokenSymbol = isETH ? "Native" : "TOKEN";
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
		<div className="bg-zinc-900/60 backdrop-blur-sm rounded-2xl p-6 border border-white/5 shadow-xl animate-pulse">
			<div className="flex items-center justify-between mb-6">
				<div className="flex items-center gap-3">
					<div className="w-12 h-12 rounded-full bg-zinc-800"></div>
					<div>
						<div className="h-5 bg-zinc-800 rounded w-32 mb-2"></div>
						<div className="h-3 bg-zinc-800 rounded w-20"></div>
					</div>
				</div>
				<div className="h-7 bg-zinc-800 rounded w-20"></div>
			</div>
			<div className="grid grid-cols-2 gap-4 mb-6">
				<div className="h-16 bg-zinc-800/50 rounded-xl"></div>
				<div className="h-16 bg-zinc-800/50 rounded-xl"></div>
				<div className="h-16 bg-zinc-800/50 rounded-xl"></div>
				<div className="h-16 bg-zinc-800/50 rounded-xl"></div>
			</div>
			<div className="flex gap-3">
				<div className="h-12 flex-1 bg-zinc-800 rounded-xl"></div>
				<div className="h-12 flex-1 bg-zinc-800/50 rounded-xl"></div>
			</div>
		</div>
	);

	return (
		<div className="min-h-screen bg-zinc-950 text-white selection:bg-indigo-500/30">
			<AppNav />
			<main className="container mx-auto px-4 py-8 lg:px-8 xl:max-w-7xl">
				<div className="flex flex-col gap-8">
					{/* Header Section */}
					<div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
						<div className="flex flex-col gap-2">
							<h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">Prize Vaults</h1>
							<p className="text-zinc-400 text-lg">Deposit, earn yield, and win weekly prizes.</p>
						</div>
					</div>

					{/* Key Stats - Hero Section */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="bg-zinc-900/50 backdrop-blur-md rounded-2xl p-6 border border-white/5 shadow-xl">
							<div className="text-sm text-zinc-400 font-medium mb-3 flex items-center gap-2">
								<Wallet size={16} /> Total Value Locked
							</div>
							<div className="text-3xl md:text-4xl font-bold tracking-tight text-white">
								{filteredVaults
									.reduce((sum, vault) => sum + vault.tvl, 0)
									.toFixed(2)}{" "}
								<span className="text-lg text-zinc-500 font-normal">Tokens</span>
							</div>
						</div>

						<div className="bg-zinc-900/50 backdrop-blur-md rounded-2xl p-6 border border-white/5 shadow-xl">
							<div className="text-sm text-zinc-400 font-medium mb-3 flex items-center gap-2">
								<Users size={16} /> Active Users
							</div>
							<div className="text-3xl md:text-4xl font-bold tracking-tight text-white">
								{filteredVaults.reduce((sum, vault) => sum + vault.users, 0)}
							</div>
						</div>

						<div className="bg-zinc-900/50 backdrop-blur-md rounded-2xl p-6 border border-white/5 shadow-xl">
							<div className="text-sm text-zinc-400 font-medium mb-3 flex items-center gap-2">
								<TrendingUp size={16} /> Average Yield
							</div>
							<div className="text-3xl md:text-4xl font-bold tracking-tight text-emerald-400">
								{filteredVaults.length > 0
									? (
										filteredVaults.reduce(
											(sum, vault) => sum + vault.apy,
											0
										) / filteredVaults.length
									).toFixed(1)
									: 0}
								<span className="text-lg text-emerald-500/70 font-normal ml-1">%</span>
							</div>
						</div>
					</div>

					{/* Controls Section */}
					<div className="bg-zinc-900/30 backdrop-blur-sm rounded-2xl border border-white/5 p-4 shadow-lg flex flex-col md:flex-row justify-between items-center gap-4">
						{/* Search and Filter Controls */}
						<div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
							<div className="relative w-full sm:w-64">
								<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 h-4 w-4" />
								<Input
									placeholder="Search vaults..."
									className="pl-10 bg-zinc-900/80 border-white/10 text-white rounded-xl focus:ring-1 focus:ring-white/20 transition-all h-11"
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
								/>
							</div>
							<div className="bg-zinc-900/80 rounded-xl p-1 border border-white/5 inline-flex h-11">
								<button
									className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeFilter === "all" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-400 hover:text-white hover:bg-white/5"
										}`}
									onClick={() => setActiveFilter("all")}
								>
									All Vaults
								</button>
								<button
									className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeFilter === "Native"
										? "bg-white text-zinc-900 shadow-sm"
										: "text-zinc-400 hover:text-white hover:bg-white/5"
										}`}
									onClick={() => setActiveFilter("Native")}
								>
									Native Only
								</button>
							</div>
						</div>
						
						<div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
							<span className="text-xs text-zinc-500 hidden lg:block">
								Showing {filteredVaults.length} vaults
							</span>
							{address === adminWallet && (
								<Button
									className="bg-white hover:bg-zinc-200 text-zinc-900 w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl h-11 px-5 font-semibold"
									onClick={() => setIsCreateModalOpen(true)}
								>
									<Plus size={18} />
									<span>Create Vault</span>
								</Button>
							)}
						</div>
					</div>

					{/* Vault Cards Grid */}
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
						{isLoadingVaults ? (
							Array.from({ length: 6 }, (_, i) => <VaultSkeleton key={i} />)
						) : filteredVaults.length > 0 ? (
							filteredVaults.map((vault) => (
								<div
									key={vault.id}
									className="bg-zinc-900/60 backdrop-blur-sm rounded-2xl border border-white/5 shadow-xl hover:shadow-2xl hover:border-white/20 transition-all duration-300 overflow-hidden flex flex-col"
								>
									{/* Card Header */}
									<div className="p-6 pb-4 border-b border-white/5 relative">
										<div className="flex items-start justify-between mb-4">
											<div className="flex items-center gap-3">
												<div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center border border-white/10 shadow-inner">
													<Coins className="w-6 h-6 text-zinc-300" />
												</div>
												<div className="min-w-0 flex-1">
													<h3 className="font-bold text-lg text-white truncate tracking-tight">{vault.name}</h3>
													<p className="text-xs text-zinc-500 font-mono mt-0.5">VAULT #{vault.id}</p>
												</div>
											</div>
											<div className={`px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase ${vault.active ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-zinc-800 text-zinc-500 border border-zinc-700"
												}`}>
												{vault.active ? "Active" : "Inactive"}
											</div>
										</div>

										{/* APY Highlight */}
										<div className="flex items-end gap-2 mt-2">
											<div className="text-3xl font-bold text-white leading-none">{vault.apy}%</div>
											<div className="text-sm text-emerald-400 font-medium mb-0.5">APY</div>
										</div>
									</div>

									{/* Card Body */}
									<div className="p-6 space-y-4 flex-1">
										<div className="grid grid-cols-2 gap-3">
											<div className="bg-zinc-800/50 rounded-xl p-3 border border-white/5">
												<div className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold mb-1">Total Value</div>
												<div className="text-base font-medium text-white">
													{vault.tvl.toFixed(3)}
													<span className="text-xs text-zinc-500 ml-1">{vault.tvlToken}</span>
												</div>
											</div>
											<div className="bg-zinc-800/50 rounded-xl p-3 border border-white/5">
												<div className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold mb-1">Participants</div>
												<div className="text-base font-medium text-white">{vault.users}</div>
											</div>
											<div className="bg-zinc-800/50 rounded-xl p-3 border border-white/5">
												<div className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold mb-1">Your Balance</div>
												<div className="text-base font-medium text-white">
													{vault.balance.toFixed(3)}
													<span className="text-xs text-zinc-500 ml-1">{vault.balanceToken}</span>
												</div>
											</div>
											<div className="bg-zinc-800/50 rounded-xl p-3 border border-white/5">
												<div className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold mb-1">Time Left</div>
												<div className="text-base font-medium text-white flex items-center gap-1">
													<Clock className="w-3.5 h-3.5 text-zinc-500" />
													{vault.timeLeft > 0 ? `${Math.floor(vault.timeLeft / 86400)}d` : "Expired"}
												</div>
											</div>
										</div>

										{/* Winner Badge */}
										{vaultWinners[vault.id] && (
											<div className="bg-amber-500/10 rounded-xl p-3 border border-amber-500/20 mt-4">
												<div className="text-[11px] text-amber-500 font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1">
													<span>🏆</span> Recent Winner
												</div>
												<div className="text-xs text-amber-200/80 font-mono truncate">
													{vaultWinners[vault.id].address.slice(0, 8)}...
													{vaultWinners[vault.id].address.slice(-6)}
												</div>
											</div>
										)}
									</div>

									{/* Card Actions */}
									<div className="p-4 bg-zinc-950/50 border-t border-white/5 flex gap-3">
										<Button
											className="flex-1 bg-white hover:bg-zinc-200 text-zinc-900 font-semibold rounded-xl h-11 transition-all"
											onClick={() => handleOpenDeposit(vault)}
											disabled={!vault.active || vault.timeLeft <= 0}
										>
											{vault.timeLeft <= 0 ? "Expired" : "Deposit"}
										</Button>

										<Button
											className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-xl h-11 transition-all"
											onClick={() => {
												setSelectedVault(vault);
												setVaultId(vault.id);
												setIsWithdrawalModalOpen(true);
											}}
											disabled={!vault.active || vault.balance <= 0}
										>
											Withdraw {vault.balance > 0 ? `(${vault.balance.toFixed(2)})` : ""}
										</Button>
									</div>
								</div>
							))
						) : (
							<div className="col-span-full text-center py-20 bg-zinc-900/30 rounded-2xl border border-white/5 border-dashed">
								<div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
									<Search size={24} className="text-zinc-500" />
								</div>
								<p className="text-xl font-medium text-white mb-2">
									{totalVaults && Number(totalVaults) > 0
										? "No vaults match your criteria"
										: "No vaults available yet"}
								</p>
								<p className="text-zinc-500 max-w-sm mx-auto">
									{totalVaults && Number(totalVaults) > 0
										? "Try adjusting your filters or search terms to find what you're looking for."
										: "Check back later when new vaults are launched."}
								</p>
							</div>
						)}
					</div>

					{filteredVaults.length > 0 && (
						<div className="bg-zinc-900/30 backdrop-blur-sm rounded-2xl border border-white/5 p-6 md:p-8 shadow-lg">
							<h2 className="text-2xl font-bold mb-6 text-white tracking-tight">Activity & Insights</h2>
							
							<Tabs defaultValue="deposits" className="w-full">
								<TabsList className="bg-zinc-900/80 border border-white/5 mb-6 inline-flex p-1 rounded-xl">
									<TabsTrigger value="deposits" className="text-sm md:text-base rounded-lg data-[state=active]:bg-zinc-800 data-[state=active]:text-white">Recent Deposits</TabsTrigger>
									<TabsTrigger value="stats" className="text-sm md:text-base rounded-lg data-[state=active]:bg-zinc-800 data-[state=active]:text-white">Detailed Stats</TabsTrigger>
								</TabsList>

								<TabsContent value="deposits">
									{globalDeposits && globalDeposits.length > 0 ? (
										<RecentDeposits deposits={globalDeposits} />
									) : (
										<div className="text-center py-16 text-zinc-500 bg-zinc-900/30 rounded-xl border border-white/5 border-dashed">
											<p>No deposits recorded yet</p>
										</div>
									)}
								</TabsContent>

								<TabsContent value="stats">
									<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
										<div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-6 border border-white/5 hover:border-white/10 transition-colors">
											<h3 className="text-sm font-medium text-zinc-400 mb-2">
												Total Value Locked
											</h3>
											<div className="text-3xl md:text-4xl font-bold text-white mb-2">
												{filteredVaults
													.reduce((sum, vault) => sum + vault.tvl, 0)
													.toFixed(2)}
											</div>
											<p className="text-xs text-zinc-500">
												Tokens across {filteredVaults.length} active vaults
											</p>
										</div>

										<div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-6 border border-white/5 hover:border-white/10 transition-colors">
											<h3 className="text-sm font-medium text-zinc-400 mb-2">Total Users</h3>
											<div className="text-3xl md:text-4xl font-bold text-white mb-2">
												{filteredVaults.reduce(
													(sum, vault) => sum + vault.users,
													0
												)}
											</div>
											<p className="text-xs text-zinc-500">
												Active depositors in ecosystem
											</p>
										</div>

										<div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-6 border border-white/5 hover:border-white/10 transition-colors">
											<h3 className="text-sm font-medium text-zinc-400 mb-2">Average Yield</h3>
											<div className="text-3xl md:text-4xl font-bold text-emerald-400 mb-2">
												{filteredVaults.length > 0
													? (
														filteredVaults.reduce(
															(sum, vault) => sum + vault.apy,
															0
														) / filteredVaults.length
													).toFixed(2)
													: 0}
												<span className="text-lg text-emerald-500/70 font-normal ml-1">%</span>
											</div>
											<p className="text-xs text-zinc-500">
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
			<WithdrawModal
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
