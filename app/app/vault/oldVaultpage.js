"use client";

import { useState } from "react";
import AppNav from "@/components/app/AppNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Users, TrendingUp, Wallet } from "lucide-react";
import CreateVaultModal from "@/components/app/CreateVaultModal";
import DepositModal from "@/components/app/DepositModal";
import { EthIcon } from "@/components/icons/EthIcon";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function VaultPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [selectedVault, setSelectedVault] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [vaults, setVaults] = useState([
    {
      id: 1,
      name: "Prize Avax",
      network: "Avax",
      apy: 11.67,
      tvl: 2324058,
      tvlToken: "Avax",
      balance: 0,
      balanceToken: "Avax",
      users: 1243,
      deposits: [
        { address: "cosm...gsye20", amount: 1000, date: "2023-12-15" },
        { address: "cosm...4s6e60", amount: 500, date: "2023-12-14" },
        { address: "cosm...6et420", amount: 2500, date: "2023-12-13" },
      ],
    },
    {
      id: 2,
      name: "Prize USDC",
      network: "Cosmos",
      apy: 9.82,
      tvl: 1845000,
      tvlToken: "USDC",
      balance: 0,
      balanceToken: "USDC",
      users: 987,
      deposits: [
        { address: "cosm...gsye20", amount: 750, date: "2023-12-15" },
        { address: "cosm...g3yd04", amount: 1200, date: "2023-12-12" },
      ],
    },
    {
      id: 3,
      name: "Prize Eth",
      network: "Cosmos",
      apy: 14.25,
      tvl: 980000,
      tvlToken: "Eth",
      balance: 0,
      balanceToken: "Eth",
      users: 654,
      deposits: [
        { address: "cosm...gsye20", amount: 300, date: "2023-12-14" },
        { address: "cosm...52ywe20", amount: 450, date: "2023-12-13" },
        { address: "cosm...33beq0", amount: 600, date: "2023-12-10" },
      ],
    },
    {
      id: 4,
      name: "Prize USDT",
      network: "Cosmos",
      apy: 8.93,
      tvl: 1250000,
      tvlToken: "USDT",
      balance: 0,
      balanceToken: "USDT",
      users: 432,
      deposits: [{ address: "cosm...gsye20", amount: 850, date: "2023-12-15" }],
    },
  ]);

  const filteredVaults = vaults
    .filter((vault) => activeFilter === "all" || vault.network === activeFilter)
    .filter(
      (vault) =>
        vault.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vault.balanceToken.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const handleOpenDeposit = (vault) => {
    setSelectedVault(vault);
    setIsDepositModalOpen(true);
  };

  const handleDeposit = (vaultId, amount, address = "cosm...gsye20") => {
    setVaults((prevVaults) =>
      prevVaults.map((vault) => {
        if (vault.id === vaultId) {
          return {
            ...vault,
            balance: vault.balance + Number.parseFloat(amount),
            tvl: vault.tvl + Number.parseFloat(amount),
            deposits: [
              {
                address,
                amount: Number.parseFloat(amount),
                date: new Date().toISOString().split("T")[0],
              },
              ...vault.deposits,
            ],
          };
        }
        return vault;
      })
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1A0505] to-[#2D0A0A] text-white">
      <AppNav />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold">Prize Vaults</h1>
            <Button
              className="bg-red-600 hover:bg-red-700 mt-4 md:mt-0 flex items-center gap-2"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus size={16} />
              Create a Vault
            </Button>
          </div>

          <div className="bg-[#1A0808]/50 backdrop-blur-sm rounded-xl border border-red-900/20 p-6 shadow-lg mb-8">
            <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-medium">Filter</h2>
                <div className="flex items-center gap-2 bg-[#2A0A0A]/80 backdrop-blur-sm rounded-full p-1 border border-red-900/10">
                  <button
                    className={`px-3 py-1 rounded-full text-sm ${
                      activeFilter === "all"
                        ? "bg-red-600"
                        : "hover:bg-[#3A0A0A]"
                    }`}
                    onClick={() => setActiveFilter("all")}
                  >
                    All
                  </button>
                  <button
                    className={`px-3 py-1 rounded-full text-sm ${
                      activeFilter === "Cosmos"
                        ? "bg-red-600"
                        : "hover:bg-[#3A0A0A]"
                    }`}
                    onClick={() => setActiveFilter("Cosmos")}
                  >
                    Eth
                  </button>
                  <button
                    className={`px-3 py-1 rounded-full text-sm ${
                      activeFilter === "Eth"
                        ? "bg-red-600"
                        : "hover:bg-[#3A0A0A]"
                    }`}
                    onClick={() => setActiveFilter("Eth")}
                  >
                    Cosmos
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {filteredVaults.map((vault) => (
                <div
                  key={vault.id}
                  className="bg-[#1A0808]/70 backdrop-blur-sm rounded-xl p-6 border border-red-900/20 shadow-lg hover:border-red-500/50 transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                        <EthIcon className="w-6 h-6" />
                      </div>
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
                        <div>${vault.tvl.toLocaleString()}</div>
                        <div className="text-xs text-gray-400 text-right">
                          {vault.tvlToken}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="text-gray-400 text-sm flex items-center gap-1">
                        <Users size={14} /> Users
                      </div>
                      <div>{vault.users.toLocaleString()}</div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="text-gray-400 text-sm flex items-center gap-1">
                        <TrendingUp size={14} /> Your Balance
                      </div>
                      <div>
                        <div>${vault.balance.toLocaleString()}</div>
                        <div className="text-xs text-gray-400 text-right">
                          {vault.balanceToken}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-red-600/90 hover:bg-red-700 backdrop-blur-sm shadow-lg"
                    onClick={() => handleOpenDeposit(vault)}
                  >
                    Deposit
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {filteredVaults.length > 0 && (
            <div className="bg-[#1A0808]/50 backdrop-blur-sm rounded-xl border border-red-900/20 p-6 shadow-lg">
              <Tabs defaultValue="deposits" className="w-full">
                <TabsList className="bg-[#2A0A0A]/80 border border-red-900/10 mb-6">
                  <TabsTrigger value="deposits">Recent Deposits</TabsTrigger>
                  <TabsTrigger value="stats">Vault Statistics</TabsTrigger>
                </TabsList>

                <TabsContent value="deposits">
                  <h3 className="text-xl font-bold mb-4">Recent Deposits</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-gray-400 text-sm border-b border-red-900/10">
                          <th className="text-left pb-4 font-normal">Vault</th>
                          <th className="text-left pb-4 font-normal">
                            Address
                          </th>
                          <th className="text-left pb-4 font-normal">Amount</th>
                          <th className="text-left pb-4 font-normal">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredVaults.flatMap((vault) =>
                          vault.deposits.slice(0, 3).map((deposit, i) => (
                            <tr
                              key={`${vault.id}-${i}`}
                              className="border-b border-red-900/10"
                            >
                              <td className="py-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                                    <EthIcon className="w-5 h-5" />
                                  </div>
                                  <span>{vault.name}</span>
                                </div>
                              </td>
                              <td className="py-4 font-mono">
                                {deposit.address}
                              </td>
                              <td className="py-4">
                                ${deposit.amount.toLocaleString()}
                              </td>
                              <td className="py-4">{deposit.date}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>

                <TabsContent value="stats">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-[#1A0808]/70 backdrop-blur-sm rounded-xl p-6 border border-red-900/20">
                      <h3 className="text-lg font-bold mb-4">
                        Total Value Locked
                      </h3>
                      <div className="text-3xl font-bold">
                        $
                        {filteredVaults
                          .reduce((sum, vault) => sum + vault.tvl, 0)
                          .toLocaleString()}
                      </div>
                      <div className="mt-2 text-sm text-gray-400">
                        Across {filteredVaults.length} vaults
                      </div>
                    </div>

                    <div className="bg-[#1A0808]/70 backdrop-blur-sm rounded-xl p-6 border border-red-900/20">
                      <h3 className="text-lg font-bold mb-4">Total Users</h3>
                      <div className="text-3xl font-bold">
                        {filteredVaults
                          .reduce((sum, vault) => sum + vault.users, 0)
                          .toLocaleString()}
                      </div>
                      <div className="mt-2 text-sm text-gray-400">
                        Active depositors
                      </div>
                    </div>

                    <div className="bg-[#1A0808]/70 backdrop-blur-sm rounded-xl p-6 border border-red-900/20">
                      <h3 className="text-lg font-bold mb-4">Average APY</h3>
                      <div className="text-3xl font-bold">
                        {(
                          filteredVaults.reduce(
                            (sum, vault) => sum + vault.apy,
                            0
                          ) / filteredVaults.length
                        ).toFixed(2)}
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
      />

      <DepositModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        selectedVault={selectedVault}
        onDeposit={handleDeposit}
      />
    </div>
  );
}
