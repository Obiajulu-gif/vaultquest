"use client";

import { useState, useEffect } from "react";
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
				// refresh depositor balances for connected address
				refetchDepositorBalances();
				// NEW: refresh depositors and all depositor balances
				refetchVaultDepositors();
				refetchAllDepositorBalances();
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
	]);

	// Refetch depositor balances whenever address or totalVaults changes
	useEffect(() => {
		if (address && totalVaults) {
			refetchDepositorBalances();
		}
	}, [address, totalVaults, refetchDepositorBalances]);

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

			console.log("Depositing....", parseEther(depositAmount));

			// Step 1: Send the transaction
			await writeContract({
				...vaultData,
				functionName: "deposit",
				args: [vaultId, parseEther(depositAmount)], // deposit args
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

		if (!withdrawalAmount || Number(withdrawalAmount) <= 0) {
			setError("Please enter a valid withdrawal amount");
			return;
		}

		if (Number(withdrawalAmount) > maxWithdraw) {
			setError(`You can only withdraw up to ${maxWithdraw.toFixed(4)} ${selectedVault.balanceToken}`);
			return;
		}

		setError("");

		writeContract({
			...vaultData,
			functionName: "withdraw",
			args: [vaultId, parseEther(withdrawalAmount)],
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
			<main className="container mx-auto px-4 py-8">
				<div className="max-w-6xl mx-auto">
					<div className="flex flex-col md:flex-row justify-between items-center mb-8">
						<h1 className="text-3xl md:text-4xl font-bold">Prize Vaults</h1>
						{address === adminWallet && (
							<Button
								className="bg-red-600 hover:bg-red-700 mt-4 md:mt-0 flex items-center gap-2"
								onClick={() => setIsCreateModalOpen(true)}
							>
								<Plus size={16} />
								Create a Vault
							</Button>
						)}
					</div>

					<div className="bg-[#1A0808]/50 backdrop-blur-sm rounded-xl border border-red-900/20 p-6 shadow-lg mb-8">
						<div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
							<div className="flex items-center gap-4">
								<h2 className="text-lg font-medium">Filter</h2>
								<div className="flex items-center gap-2 bg-[#2A0A0A]/80 backdrop-blur-sm rounded-full p-1 border border-red-900/10">
									<button
										className={`px-3 py-1 rounded-full text-sm ${activeFilter === "all" ? "bg-red-600" : "hover:bg-[#3A0A0A]"
											}`}
										onClick={() => setActiveFilter("all")}
									>
										All
									</button>
									<button
										className={`px-3 py-1 rounded-full text-sm ${activeFilter === "AVAX"
											? "bg-red-600"
											: "hover:bg-[#3A0A0A]"
											}`}
										onClick={() => setActiveFilter("AVAX")}
									>
										AVAX
									</button>
								</div>
							</div>
							<div className="relative">
								<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
								<Input
									placeholder="Search Vaults"
									className="pl-10 bg-[#2A0A0A]/70 backdrop-blur-sm border-red-900/20 w-full md:w-64"
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
								/>
							</div>
						</div>

						<div className="mb-6 text-sm text-gray-400">
							Total Vaults: {totalVaults ? Number(totalVaults) : 0} | Admin: {" "}
							{adminWallet
								? `${adminWallet.slice(0, 6)}...${adminWallet.slice(-4)}`
								: "Loading..."}
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
							{isLoadingVaults ? (
								Array.from({ length: 4 }, (_, i) => <VaultSkeleton key={i} />)
							) : filteredVaults.length > 0 ? (
								filteredVaults.map((vault) => (
									<div
										key={vault.id}
										className="bg-[#1A0808]/70 backdrop-blur-sm rounded-xl p-6 border border-red-900/20 shadow-lg hover:border-red-500/50 transition-all"
									>
										<div className="flex items-center justify-between mb-4">
											<div className="flex items-center gap-2">
												<Image src="/images/avax.png" height={1000} width={1000} alt="avax icon" className="w-10 h-10" />
												<div>
													<div className="font-medium">{vault.name}</div>
													<div className="text-sm text-gray-400 capitalize">
														{vault.network}
													</div>
												</div>
											</div>
											<div className="bg-green-900/20 text-green-500 px-2 py-1 rounded text-sm">
												{vault.apy}% APY
											</div>
										</div>

										<div className="space-y-3 mb-4">
											<div className="flex justify-between items-center">
												<div className="text-gray-400 text-sm flex items-center gap-1">
													<Wallet size={14} /> TVL
												</div>
												<div>
													<div>
														{vault.tvl.toFixed(4)} {vault.tvlToken}
													</div>
													<div className="text-xs text-gray-400 text-right">
														{vault.timeLeft > 0
															? `${Math.floor(vault.timeLeft / 86400)}d left`
															: "Expired"}
													</div>
												</div>
											</div>

											<div className="flex justify-between items-center">
												<div className="text-gray-400 text-sm flex items-center gap-1">
													<Users size={14} /> Users
												</div>
												<div>{vault.users}</div>
											</div>

											<div className="flex justify-between items-center">
												<div className="text-gray-400 text-sm flex items-center gap-1">
													<TrendingUp size={14} /> Your Balance
												</div>
												<div>
													<div>
														{vault.balance.toFixed(4)} {vault.balanceToken}
													</div>
													<div className="text-xs text-gray-400 text-right">
														Active: {vault.active ? "Yes" : "No"}
													</div>
												</div>
											</div>
										</div>

										<div className="flex flex-col gap-2">
											<Button
												className="w-full bg-red-600/90 hover:bg-red-700 backdrop-blur-sm shadow-lg"
												onClick={() => handleOpenDeposit(vault)}
												disabled={!vault.active || vault.timeLeft <= 0}
											>
												{vault.timeLeft <= 0 ? "Expired" : "Deposit"}
											</Button>

											<Button
												variant="outline"
												className="w-full outline-[#E3E3E3] outline outline-1 border-red-900/20 hover:bg-red-600/10 backdrop-blur-sm shadow-lg"
												onClick={() => {
													setSelectedVault(vault);
													setVaultId(vault.id);
													setIsWithdrawalModalOpen(true);
												}}
												disabled={!vault.active || vault.timeLeft <= 0}
											>
												Withdraw
											</Button>

										</div>
									</div>
								))
							) : (
								<div className="col-span-full text-center py-12 text-gray-400">
									{totalVaults && Number(totalVaults) > 0
										? "No vaults match your search criteria"
										: "No vaults created yet"}
								</div>
							)}
						</div>
					</div>

					{filteredVaults.length > 0 && (
						<div className="bg-[#1A0808]/50 backdrop-blur-sm rounded-xl border border-red-900/20 p-6 shadow-lg">
							{/* Updated Tabs: added Recent Deposits tab (global) */}
							<Tabs defaultValue="deposits" className="w-full">
								<TabsList className="bg-[#2A0A0A]/80 border border-red-900/10 mb-6">
									<TabsTrigger value="deposits">Recent Deposits</TabsTrigger>
									<TabsTrigger value="stats">Vault Statistics</TabsTrigger>
								</TabsList>

								{/* Recent Deposits (global feed) */}
								<TabsContent value="deposits">
									<RecentDeposits deposits={globalDeposits} />
								</TabsContent>

								{/* Vault statisticsvaultId */}
								<TabsContent value="stats">
									<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
										<div className="bg-[#1A0808]/70 backdrop-blur-sm rounded-xl p-6 border border-red-900/20">
											<h3 className="text-lg font-bold mb-4">
												Total Value Locked
											</h3>
											<div className="text-3xl font-bold">
												{filteredVaults
													.reduce((sum, vault) => sum + vault.tvl, 0)
													.toFixed(4)}{" "}
												AVAX
											</div>
											<div className="mt-2 text-sm text-gray-400">
												Across {filteredVaults.length} active vaults
											</div>
										</div>

										<div className="bg-[#1A0808]/70 backdrop-blur-sm rounded-xl p-6 border border-red-900/20">
											<h3 className="text-lg font-bold mb-4">Total Users</h3>
											<div className="text-3xl font-bold">
												{filteredVaults.reduce(
													(sum, vault) => sum + vault.users,
													0
												)}
											</div>
											<div className="mt-2 text-sm text-gray-400">
												Active depositors
											</div>
										</div>

										<div className="bg-[#1A0808]/70 backdrop-blur-sm rounded-xl p-6 border border-red-900/20">
											<h3 className="text-lg font-bold mb-4">Average APY</h3>
											<div className="text-3xl font-bold">
												{filteredVaults.length > 0
													? (
														filteredVaults.reduce(
															(sum, vault) => sum + vault.apy,
															0
														) / filteredVaults.length
													).toFixed(2)
													: 0}
												%
											</div>
											<div className="mt-2 text-sm text-gray-400">
												Weighted average
											</div>
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
