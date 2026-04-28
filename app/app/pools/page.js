"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppNav from "@/components/app/AppNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Plus, Users, TrendingUp, Wallet, Droplets, Loader2, Clock, Trophy, Filter, RefreshCw, AlertTriangle } from "lucide-react";
import CreatePoolModal from "@/components/app/CreatePoolModal";
import DepositModal from "@/components/app/DepositModal";
import WithdrawModal from "@/components/app/WithdrawModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { useDripWave } from "@/hooks/useDripWave";
import { Pool, UserPosition } from "@/lib/types";

export default function PoolsPage() {
  const { state: walletConnectionState } = useWalletConnection();
  const { address, isConnected } = walletConnectionState;
  const { 
    pools, 
    activePools, 
    userPositions, 
    loading, 
    errors,
    refresh 
  } = useDripWave();

  // UI State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [selectedPool, setSelectedPool] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  // Filter pools based on search and filter
  const filteredPools = activePools.filter((pool) => {
    const matchesSearch = 
      pool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pool.token.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = 
      activeFilter === "all" || 
      pool.token.symbol.toLowerCase() === activeFilter.toLowerCase();
    
    return matchesSearch && matchesFilter;
  });

  // Get unique tokens for filter
  const uniqueTokens = [...new Set(activePools.map(pool => pool.token.symbol))];

  // Handle pool actions
  const handleOpenDeposit = (pool) => {
    setSelectedPool(pool);
    setIsDepositModalOpen(true);
  };

  const handleOpenWithdraw = (pool) => {
    setSelectedPool(pool);
    setIsWithdrawModalOpen(true);
  };

  // Get user's position in a specific pool
  const getUserPositionInPool = (poolId) => {
    return userPositions.find(position => position.poolId === poolId);
  };

  // Pool card component
  const PoolCard = ({ pool }) => {
    const userPosition = getUserPositionInPool(pool.id);
    const timeLeft = pool.endTime - Date.now();
    const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
    
    return (
      <Card className="bg-[#1A0808]/70 backdrop-blur-sm border border-blue-900/20 shadow-lg hover:border-blue-500/50 transition-all">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{pool.name}</CardTitle>
              <p className="text-sm text-gray-400">
                {pool.token.symbol} Pool
              </p>
            </div>
            <div className="bg-green-900/20 text-green-500 px-3 py-1 rounded-full text-sm">
              {pool.interestRate}% APY
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Pool Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-gray-400" />
              <div>
                <div className="text-sm text-gray-400">TVL</div>
                <div className="font-semibold">
                  ${parseFloat(pool.totalDeposits).toFixed(2)}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" />
              <div>
                <div className="text-sm text-gray-400">Participants</div>
                <div className="font-semibold">{pool.participantCount}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <div>
                <div className="text-sm text-gray-400">Time Left</div>
                <div className="font-semibold">
                  {daysLeft > 0 ? `${daysLeft}d` : "Ended"}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-gray-400" />
              <div>
                <div className="text-sm text-gray-400">Prize Pool</div>
                <div className="font-semibold text-yellow-400">
                  ${(parseFloat(pool.totalDeposits) * 0.01).toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* User Position */}
          {userPosition && (
            <div className="bg-blue-900/20 rounded-lg p-3 border border-blue-500/30">
              <div className="text-sm text-blue-400 mb-1">Your Position</div>
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold">
                    {parseFloat(userPosition.totalAmount).toFixed(4)} {pool.token.symbol}
                  </div>
                  <div className="text-xs text-gray-400">
                    Interest: {parseFloat(userPosition.interestEarned).toFixed(4)}
                  </div>
                </div>
                {userPosition.isEligibleForPrize && (
                  <div className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded text-xs">
                    Eligible
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Winner Display */}
          {pool.winner && (
            <div className="bg-green-900/20 rounded-lg p-3 border border-green-500/30">
              <div className="text-sm text-green-400 mb-1">🏆 Winner</div>
              <div className="text-sm font-mono text-green-300">
                {pool.winner.address.slice(0, 7)}...{pool.winner.address.slice(-5)}
              </div>
              <div className="text-xs text-gray-400">
                Won: {parseFloat(pool.winner.amount).toFixed(4)} {pool.token.symbol}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            {userPosition ? (
              <>
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={() => handleOpenDeposit(pool)}
                  disabled={pool.status !== 'active'}
                >
                  Add More
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-blue-600/50 hover:bg-blue-600/10"
                  onClick={() => handleOpenWithdraw(pool)}
                >
                  Withdraw
                </Button>
              </>
            ) : (
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => handleOpenDeposit(pool)}
                disabled={pool.status !== 'active'}
              >
                Join Pool
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Loading skeleton
  const PoolSkeleton = () => (
    <Card className="bg-[#1A0808]/70 backdrop-blur-sm border border-blue-900/20 shadow-lg animate-pulse">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <div className="h-6 bg-gray-700 rounded w-32 mb-2"></div>
            <div className="h-4 bg-gray-700 rounded w-24"></div>
          </div>
          <div className="h-6 bg-gray-700 rounded w-16"></div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i}>
              <div className="h-4 bg-gray-700 rounded w-16 mb-1"></div>
              <div className="h-5 bg-gray-700 rounded w-20"></div>
            </div>
          ))}
        </div>
        <div className="h-10 bg-gray-700 rounded"></div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1A0505] to-[#2D0A0A] text-white">
      <AppNav />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <Droplets className="w-8 h-8 text-blue-400" />
              <h1 className="text-3xl md:text-4xl font-bold">Savings Pools</h1>
            </div>
            {isConnected && (
              <Button
                className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <Plus size={16} />
                Create Pool
              </Button>
            )}
          </div>

          {/* Filters and Search */}
          <Card className="bg-[#1A0808]/50 backdrop-blur-sm border border-blue-900/20 p-6 shadow-lg mb-8">
            <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-medium">Filter</h3>
                <div className="flex items-center gap-2 bg-[#2A0A0A]/80 backdrop-blur-sm rounded-full p-1 border border-blue-900/10">
                  <button
                    className={`px-3 py-1 rounded-full text-sm ${
                      activeFilter === "all" ? "bg-blue-600" : "hover:bg-[#3A0A0A]"
                    }`}
                    onClick={() => setActiveFilter("all")}
                  >
                    All
                  </button>
                  {uniqueTokens.map((token) => (
                    <button
                      key={token}
                      className={`px-3 py-1 rounded-full text-sm ${
                        activeFilter === token.toLowerCase() ? "bg-blue-600" : "hover:bg-[#3A0A0A]"
                      }`}
                      onClick={() => setActiveFilter(token.toLowerCase())}
                    >
                      {token}
                    </button>
                  ))}
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search pools..."
                  className="pl-10 bg-[#2A0A0A]/70 backdrop-blur-sm border-blue-900/20 w-full md:w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="text-sm text-gray-400">
              {isConnected ? (
                <span>
                  {activePools.length} active pools • {userPositions.length} positions
                </span>
              ) : (
                <span>Connect wallet to see your positions</span>
              )}
            </div>
          </Card>

          {/* Pools Grid */}
          {loading.pools ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {Array.from({ length: 6 }, (_, i) => <PoolSkeleton key={i} />)}
            </div>
          ) : filteredPools.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {filteredPools.map((pool) => (
                <PoolCard key={pool.id} pool={pool} />
              ))}
            </div>
          ) : (
            <Card className="bg-[#1A0808]/50 backdrop-blur-sm border border-blue-900/20 p-12 text-center">
              <Droplets className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {searchQuery ? "No pools found" : "No active pools"}
              </h3>
              <p className="text-gray-400 mb-6">
                {searchQuery 
                  ? "Try adjusting your search or filters"
                  : "Be the first to create a savings pool!"
                }
              </p>
              {isConnected && !searchQuery && (
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  Create First Pool
                </Button>
              )}
            </Card>
          )}

          {/* Statistics */}
          {activePools.length > 0 && (
            <Card className="bg-[#1A0808]/50 backdrop-blur-sm border border-blue-900/20 p-6 shadow-lg">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="bg-[#2A0A0A]/80 border border-blue-900/10 mb-6">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="statistics">Statistics</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-[#1A0808]/70 backdrop-blur-sm rounded-xl p-6 border border-blue-900/20">
                      <h3 className="text-lg font-bold mb-4">Total Value Locked</h3>
                      <div className="text-3xl font-bold">
                        ${activePools.reduce((sum, pool) => sum + parseFloat(pool.totalDeposits), 0).toFixed(2)}
                      </div>
                      <div className="mt-2 text-sm text-gray-400">
                        Across {activePools.length} active pools
                      </div>
                    </div>

                    <div className="bg-[#1A0808]/70 backdrop-blur-sm rounded-xl p-6 border border-blue-900/20">
                      <h3 className="text-lg font-bold mb-4">Total Participants</h3>
                      <div className="text-3xl font-bold">
                        {activePools.reduce((sum, pool) => sum + pool.participantCount, 0)}
                      </div>
                      <div className="mt-2 text-sm text-gray-400">
                        Active savers
                      </div>
                    </div>

                    <div className="bg-[#1A0808]/70 backdrop-blur-sm rounded-xl p-6 border border-blue-900/20">
                      <h3 className="text-lg font-bold mb-4">Average APY</h3>
                      <div className="text-3xl font-bold">
                        {activePools.length > 0
                          ? (activePools.reduce((sum, pool) => sum + pool.interestRate, 0) / activePools.length).toFixed(2)
                          : 0}%
                      </div>
                      <div className="mt-2 text-sm text-gray-400">
                        Weighted average
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="statistics">
                  <div className="text-center text-gray-400">
                    Detailed statistics coming soon...
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          )}
        </div>
      </main>

      {/* Modals */}
      <CreatePoolModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <DepositModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        selectedPool={selectedPool}
      />

      <WithdrawModal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        selectedPool={selectedPool}
      />
    </div>
  );
}
