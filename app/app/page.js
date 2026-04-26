"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import AppNav from "@/components/app/AppNav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAccount } from "wagmi"
import { useDripWave } from "@/hooks/useDripWave"
import { Wallet, TrendingUp, Users, Droplets, Loader2 } from "lucide-react"
import PrizeGrid from "@/components/app/PrizeGrid"

export default function AppPage() {
  const { address, isConnected } = useAccount()
  const { 
    walletState, 
    totalDeposits, 
    totalInterestEarned, 
    activePools, 
    userPositions, 
    pendingTransactions,
    loading,
    errors 
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

  const isLoading = loading.dashboard || loading.positions || loading.pools

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1A0505] to-[#2D0A0A] text-white">
      <AppNav />
      <main className="container mx-auto px-4 py-8 md:py-16 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-12 md:mb-16">
          <div className="flex items-center justify-center mb-6">
            <Droplets className="w-12 h-12 text-blue-400 mr-3" />
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold leading-tight">
              Drip <span className="text-blue-400">Wave</span>
            </h1>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-4xl font-light mb-4 leading-tight text-gray-300">
            Prize-linked savings for the Stellar ecosystem
          </h2>
          <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
            Save your deposits while earning interest and a chance to win prizes. 
            Your capital is always safe - only the interest is awarded as prizes.
          </p>
          
          {!walletState.isConnected ? (
            <div className="space-y-4">
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full backdrop-blur-sm shadow-lg text-lg"
                onClick={() => {
                  // Wallet connection handled by wagmi through AppNav
                }}
              >
                Connect Wallet to Start
              </Button>
              <p className="text-sm text-gray-400">
                Connect your Stellar wallet to start saving and winning
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-2xl mx-auto">
                <Link href="/app/pools" className="w-full sm:w-auto">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full backdrop-blur-sm shadow-lg w-full text-base md:text-lg">
                    Browse Pools
                  </Button>
                </Link>
                <Link href="/app/account" className="w-full sm:w-auto">
                  <Button className="bg-transparent border border-blue-600/70 hover:bg-blue-600/10 text-white font-bold py-3 px-6 rounded-full backdrop-blur-sm shadow-lg w-full text-base md:text-lg">
                    My Account
                  </Button>
                </Link>
              </div>
              
              {/* Wallet Address Display */}
              <div className="text-sm text-gray-400">
                Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
              </div>
            </div>
          )}
        </div>

        {/* Dashboard Stats - Only show when connected */}
        {walletState.isConnected && (
          <div className="mb-12">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="animate-spin w-8 h-8 mr-2" />
                <span>Loading your dashboard...</span>
              </div>
            ) : errors.dashboard ? (
              <Card className="bg-red-900/20 border-red-500/30">
                <CardContent className="p-6 text-center">
                  <p className="text-red-400">Failed to load dashboard data</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                  </CardContent>
                </Card>

                <Card className="bg-[#1A0808]/70 backdrop-blur-sm border border-blue-900/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      Active Positions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {userPositions.length}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#1A0808]/70 backdrop-blur-sm border border-blue-900/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-400">
                      Pending Transactions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-400">
                      {pendingTransactions.length}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* Available Pools Preview */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Available Pools</h2>
            <Link href="/app/pools">
              <Button variant="outline" className="border-blue-600/50 hover:bg-blue-600/10">
                View All
              </Button>
            </Link>
          </div>
          
          {loading.pools ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="animate-spin w-6 h-6 mr-2" />
              <span>Loading pools...</span>
            </div>
          ) : activePools.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {activePools.slice(0, 3).map((pool) => (
                <Card key={pool.id} className="bg-[#1A0808]/70 backdrop-blur-sm border border-blue-900/20 hover:border-blue-500/50 transition-all">
                  <CardHeader>
                    <CardTitle className="text-lg">{pool.name}</CardTitle>
                    <div className="text-sm text-gray-400">
                      {pool.token.symbol} • {pool.interestRate}% APY
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">TVL:</span>
                        <span>${parseFloat(pool.totalDeposits).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Participants:</span>
                        <span>{pool.participantCount}</span>
                      </div>
                      <Link href={`/app/pools/${pool.id}`}>
                        <Button className="w-full mt-3 bg-blue-600 hover:bg-blue-700">
                          Join Pool
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-[#1A0808]/50 backdrop-blur-sm border border-blue-900/20">
              <CardContent className="p-8 text-center">
                <Droplets className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Active Pools</h3>
                <p className="text-gray-400">
                  Check back soon for new savings opportunities
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Prize Grid */}
        <PrizeGrid />
      </main>
    </div>
  )
}

