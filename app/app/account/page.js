"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import AppNav from "@/components/app/AppNav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { useDripWave } from "@/hooks/useDripWave"
import { 
  Wallet, 
  Trophy, 
  TrendingUp, 
  Droplets, 
  Clock, 
  ExternalLink,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react"
import { TRANSACTION_STATUS_LABELS } from "@/lib/types"

export default function AccountPage() {
  const { state: walletConnectionState } = useWalletConnection();
  const { address, isConnected } = walletConnectionState;
  const { 
    userPositions, 
    transactions, 
    totalDeposits, 
    totalInterestEarned,
    loading,
    errors,
    refresh
  } = useDripWave()

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render until mounted to avoid hydration issues
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1A0505] to-[#2D0A0A] text-white flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    )
  }

  const getTransactionIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'failed':
      case 'reverted':
        return <XCircle className="w-4 h-4 text-red-400" />
      case 'pending':
      case 'submitted':
        return <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />
    }
  }

  const getTransactionColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-400'
      case 'failed':
      case 'reverted':
        return 'text-red-400'
      case 'pending':
      case 'submitted':
        return 'text-yellow-400'
      default:
        return 'text-gray-400'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1A0505] to-[#2D0A0A] text-white">
      <AppNav />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <Wallet className="w-8 h-8 text-blue-400" />
              <h1 className="text-3xl font-bold">Account Overview</h1>
            </div>
            <div className="flex gap-3">
              <Link href="/app/pools">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Browse Pools
                </Button>
              </Link>
              <Button
                variant="outline"
                className="border-blue-600/50 hover:bg-blue-600/10"
                onClick={refresh}
              >
                Refresh
              </Button>
            </div>
          </div>

          {!isConnected ? (
            <Card className="bg-[#1A0808]/50 backdrop-blur-sm border border-blue-900/20 p-12 text-center">
              <Wallet className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
              <p className="text-gray-400 mb-6">
                Connect your Stellar wallet to view your account details and positions
              </p>
            </Card>
          ) : (
            <>
              {/* Account Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card className="bg-[#1A0808]/70 backdrop-blur-sm border border-blue-900/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
                      <Wallet className="w-4 h-4 mr-2" />
                      Total Deposits
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${totalDeposits.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Across all pools
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#1A0808]/70 backdrop-blur-sm border border-blue-900/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Interest Earned
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-400">
                      ${totalInterestEarned.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Total earnings
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#1A0808]/70 backdrop-blur-sm border border-blue-900/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
                      <Droplets className="w-4 h-4 mr-2" />
                      Active Positions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {userPositions.length}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Current pools
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#1A0808]/70 backdrop-blur-sm border border-blue-900/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
                      <Trophy className="w-4 h-4 mr-2" />
                      Prize Eligibility
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-400">
                      {userPositions.filter(pos => pos.isEligibleForPrize).length}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Eligible pools
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Tabs */}
              <Tabs defaultValue="positions" className="w-full">
                <TabsList className="bg-[#2A0A0A]/80 border border-blue-900/10 mb-6">
                  <TabsTrigger value="positions">Positions</TabsTrigger>
                  <TabsTrigger value="transactions">Transactions</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                </TabsList>

                {/* Positions Tab */}
                <TabsContent value="positions">
                  <Card className="bg-[#1A0808]/50 backdrop-blur-sm border border-blue-900/20">
                    <CardHeader>
                      <CardTitle>Your Pool Positions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {loading.positions ? (
                        <div className="flex justify-center items-center py-8">
                          <Loader2 className="animate-spin w-6 h-6 mr-2" />
                          <span>Loading positions...</span>
                        </div>
                      ) : userPositions.length > 0 ? (
                        <div className="space-y-4">
                          {userPositions.map((position) => (
                            <div key={position.poolId} className="bg-[#1A0808]/70 rounded-lg p-4 border border-blue-900/20">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h4 className="font-semibold">{position.poolName}</h4>
                                  <p className="text-sm text-gray-400">{position.tokenSymbol}</p>
                                </div>
                                {position.isEligibleForPrize && (
                                  <div className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded text-xs">
                                    Prize Eligible
                                  </div>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-400">Principal:</span>
                                  <div className="font-medium">
                                    {parseFloat(position.principalAmount).toFixed(4)} {position.tokenSymbol}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-gray-400">Interest:</span>
                                  <div className="font-medium text-green-400">
                                    {parseFloat(position.interestEarned).toFixed(4)} {position.tokenSymbol}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-gray-400">Total:</span>
                                  <div className="font-medium">
                                    {parseFloat(position.totalAmount).toFixed(4)} {position.tokenSymbol}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-gray-400">Deposited:</span>
                                  <div className="font-medium">
                                    {new Date(position.depositTimestamp).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>

                              <div className="flex gap-2 mt-4">
                                <Link href={`/app/pools/${position.poolId}`}>
                                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                                    View Pool
                                  </Button>
                                </Link>
                                {position.hasClaimed && (
                                  <div className="bg-green-900/20 text-green-400 px-3 py-1 rounded text-sm flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" />
                                    Claimed
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Droplets className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                          <h3 className="text-lg font-medium mb-2">No Positions Yet</h3>
                          <p className="text-gray-400 mb-6">
                            Start by joining a savings pool to earn interest and win prizes
                          </p>
                          <Link href="/app/pools">
                            <Button className="bg-blue-600 hover:bg-blue-700">
                              Browse Pools
                            </Button>
                          </Link>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Transactions Tab */}
                <TabsContent value="transactions">
                  <Card className="bg-[#1A0808]/50 backdrop-blur-sm border border-blue-900/20">
                    <CardHeader>
                      <CardTitle>Recent Transactions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {loading.transactions ? (
                        <div className="flex justify-center items-center py-8">
                          <Loader2 className="animate-spin w-6 h-6 mr-2" />
                          <span>Loading transactions...</span>
                        </div>
                      ) : transactions.length > 0 ? (
                        <div className="space-y-3">
                          {transactions.map((tx) => (
                            <div key={tx.id} className="bg-[#1A0808]/70 rounded-lg p-4 border border-blue-900/20">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                  {getTransactionIcon(tx.status)}
                                  <div>
                                    <div className="font-medium capitalize">
                                      {tx.type.replace('_', ' ')}
                                    </div>
                                    <div className="text-sm text-gray-400">
                                      {new Date(tx.timestamp).toLocaleString()}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className={`font-medium ${getTransactionColor(tx.status)}`}>
                                    {TRANSACTION_STATUS_LABELS[tx.status]}
                                  </div>
                                  {tx.amount && (
                                    <div className="text-sm text-gray-400">
                                      {tx.amount}
                                    </div>
                                  )}
                                </div>
                              </div>
                              {tx.txHash && (
                                <div className="mt-2 text-xs text-gray-500">
                                  TX: {tx.txHash.slice(0, 10)}...{tx.txHash.slice(-8)}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Clock className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                          <h3 className="text-lg font-medium mb-2">No Transactions Yet</h3>
                          <p className="text-gray-400">
                            Your transaction history will appear here
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Activity Tab */}
                <TabsContent value="activity">
                  <Card className="bg-[#1A0808]/50 backdrop-blur-sm border border-blue-900/20">
                    <CardHeader>
                      <CardTitle>Activity Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center text-gray-400 py-8">
                        <p>Detailed activity analytics coming soon...</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

