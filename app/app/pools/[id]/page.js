"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import AppNav from "@/components/app/AppNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAccount } from "wagmi";
import { useDripWave } from "@/hooks/useDripWave";
import { 
  Droplets, 
  Users, 
  Wallet, 
  TrendingUp, 
  Clock, 
  Trophy, 
  ArrowLeft,
  Loader2,
  ExternalLink
} from "lucide-react";
import DepositModal from "@/components/app/DepositModal";
import WithdrawModal from "@/components/app/WithdrawalModal";

export default function PoolDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isConnected } = useAccount();
  const { pools, userPositions, loading } = useDripWave();
  
  const [pool, setPool] = useState(null);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && pools.length > 0) {
      const foundPool = pools.find(p => p.id === params.id);
      setPool(foundPool || null);
    }
  }, [mounted, pools, params.id]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1A0505] to-[#2D0A0A] text-white flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  if (loading.pools) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1A0505] to-[#2D0A0A] text-white">
        <AppNav />
        <main className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center py-16">
            <Loader2 className="animate-spin w-8 h-8 mr-2" />
            <span>Loading pool details...</span>
          </div>
        </main>
      </div>
    );
  }

  if (!pool) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1A0505] to-[#2D0A0A] text-white">
        <AppNav />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <Droplets className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Pool Not Found</h2>
            <p className="text-gray-400 mb-6">The pool you're looking for doesn't exist.</p>
            <Button onClick={() => router.back()} className="bg-blue-600 hover:bg-blue-700">
              Go Back
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const userPosition = userPositions.find(pos => pos.poolId === pool.id);
  const timeLeft = pool.endTime - Date.now();
  const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
  const isEligible = userPosition?.isEligibleForPrize;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1A0505] to-[#2D0A0A] text-white">
      <AppNav />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-6 text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Pools
          </Button>

          {/* Pool Header */}
          <div className="bg-[#1A0808]/70 backdrop-blur-sm rounded-xl p-8 border border-blue-900/20 shadow-lg mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Droplets className="w-8 h-8 text-blue-400" />
                  <h1 className="text-3xl font-bold">{pool.name}</h1>
                </div>
                <p className="text-gray-400">
                  {pool.description || "A prize-linked savings pool on the Stellar network"}
                </p>
              </div>
              <div className="flex items-center gap-4 mt-4 md:mt-0">
                <div className="bg-green-900/20 text-green-500 px-4 py-2 rounded-full text-lg font-semibold">
                  {pool.interestRate}% APY
                </div>
                <div className={`px-4 py-2 rounded-full text-lg font-semibold ${
                  pool.status === 'active' 
                    ? 'bg-blue-900/20 text-blue-400' 
                    : 'bg-gray-700/50 text-gray-400'
                }`}>
                  {pool.status.charAt(0).toUpperCase() + pool.status.slice(1)}
                </div>
              </div>
            </div>

            {/* Pool Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="flex items-center gap-3">
                <div className="bg-blue-900/20 p-3 rounded-lg">
                  <Wallet className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <div className="text-sm text-gray-400">TVL</div>
                  <div className="text-xl font-bold">
                    ${parseFloat(pool.totalDeposits).toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-green-900/20 p-3 rounded-lg">
                  <Users className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <div className="text-sm text-gray-400">Participants</div>
                  <div className="text-xl font-bold">{pool.participantCount}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-yellow-900/20 p-3 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-400" />
                </div>
                <div>
                  <div className="text-sm text-gray-400">Time Left</div>
                  <div className="text-xl font-bold">
                    {daysLeft > 0 ? `${daysLeft}d` : "Ended"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-purple-900/20 p-3 rounded-lg">
                  <Trophy className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <div className="text-sm text-gray-400">Prize Pool</div>
                  <div className="text-xl font-bold text-purple-400">
                    ${(parseFloat(pool.totalDeposits) * 0.01).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Pool Details */}
              <Card className="bg-[#1A0808]/50 backdrop-blur-sm border border-blue-900/20">
                <CardHeader>
                  <CardTitle>Pool Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-gray-400">Token:</span>
                      <div className="font-medium">{pool.token.symbol}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Token Address:</span>
                      <div className="font-mono text-sm">
                        {pool.token.address.slice(0, 6)}...{pool.token.address.slice(-4)}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">Duration:</span>
                      <div className="font-medium">{Math.floor(pool.duration / (24 * 60 * 60))} days</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Start Date:</span>
                      <div className="font-medium">
                        {new Date(pool.startTime).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">End Date:</span>
                      <div className="font-medium">
                        {new Date(pool.endTime).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">Minimum Deposit:</span>
                      <div className="font-medium">0.001 {pool.token.symbol}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* How It Works */}
              <Card className="bg-[#1A0808]/50 backdrop-blur-sm border border-blue-900/20">
                <CardHeader>
                  <CardTitle>How It Works</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-3">
                    <div className="bg-blue-900/20 text-blue-400 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">1</div>
                    <div>
                      <div className="font-medium">Deposit Funds</div>
                      <div className="text-sm text-gray-400">
                        Deposit {pool.token.symbol} to start earning interest
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="bg-blue-900/20 text-blue-400 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">2</div>
                    <div>
                      <div className="font-medium">Earn Interest</div>
                      <div className="text-sm text-gray-400">
                        Your deposit earns {pool.interestRate}% APY over the pool duration
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="bg-blue-900/20 text-blue-400 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">3</div>
                    <div>
                      <div className="font-medium">Win Prizes</div>
                      <div className="text-sm text-gray-400">
                        Be eligible to win from the prize pool when it ends
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="bg-blue-900/20 text-blue-400 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">4</div>
                    <div>
                      <div className="font-medium">Withdraw Anytime</div>
                      <div className="text-sm text-gray-400">
                        Withdraw your principal + earned interest at any time
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Your Position */}
              {userPosition && (
                <Card className="bg-blue-900/20 backdrop-blur-sm border border-blue-500/30">
                  <CardHeader>
                    <CardTitle className="text-blue-300">Your Position</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Principal:</span>
                      <span className="font-medium">
                        {parseFloat(userPosition.principalAmount).toFixed(4)} {pool.token.symbol}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Interest:</span>
                      <span className="font-medium text-green-400">
                        {parseFloat(userPosition.interestEarned).toFixed(4)} {pool.token.symbol}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Total:</span>
                      <span className="font-bold">
                        {parseFloat(userPosition.totalAmount).toFixed(4)} {pool.token.symbol}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Deposited:</span>
                      <span className="text-sm">
                        {new Date(userPosition.depositTimestamp).toLocaleDateString()}
                      </span>
                    </div>
                    {isEligible && (
                      <div className="bg-yellow-500/20 text-yellow-400 px-3 py-2 rounded text-sm text-center">
                        🏆 Prize Eligible
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Winner Display */}
              {pool.winner && (
                <Card className="bg-green-900/20 backdrop-blur-sm border border-green-500/30">
                  <CardHeader>
                    <CardTitle className="text-green-300">🏆 Winner</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="font-mono text-sm text-green-300 mb-2">
                        {pool.winner.address.slice(0, 7)}...{pool.winner.address.slice(-5)}
                      </div>
                      <div className="text-lg font-bold text-green-400">
                        {parseFloat(pool.winner.amount).toFixed(4)} {pool.token.symbol}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Won on {new Date(pool.winner.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <Card className="bg-[#1A0808]/50 backdrop-blur-sm border border-blue-900/20">
                <CardContent className="p-6">
                  {!isConnected ? (
                    <div className="text-center py-4">
                      <p className="text-yellow-400 text-sm mb-4">
                        Connect your wallet to participate
                      </p>
                    </div>
                  ) : userPosition ? (
                    <div className="space-y-3">
                      <Button
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        onClick={() => setIsDepositModalOpen(true)}
                        disabled={pool.status !== 'active'}
                      >
                        Add More Funds
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full border-blue-600/50 hover:bg-blue-600/10"
                        onClick={() => setIsWithdrawModalOpen(true)}
                      >
                        Withdraw
                      </Button>
                    </div>
                  ) : (
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      onClick={() => setIsDepositModalOpen(true)}
                      disabled={pool.status !== 'active'}
                    >
                      Join Pool
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <DepositModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        selectedPool={pool}
      />

      <WithdrawModal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        selectedPool={pool}
      />
    </div>
  );
}
