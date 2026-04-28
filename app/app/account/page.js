"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import AppNav from "@/components/app/AppNav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAccount } from "wagmi"
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
import AccountSummaryCards from "@/components/app/AccountSummaryCards"
import AccountPositionsList from "@/components/app/AccountPositionsList"
import AccountActivityList from "@/components/app/AccountActivityList"
import { NoWalletState } from "@/components/app/AccountEmptyState"

export default function AccountPage() {
  const { address, isConnected } = useAccount()
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
                <Button className="bg-blue-600 hover:bg-blue-700">Browse Pools</Button>
              </Link>
              <Button variant="outline" className="border-blue-600/50 hover:bg-blue-600/10" onClick={refresh}>Refresh</Button>
            </div>
          </div>

          {!isConnected ? (
            <NoWalletState />
          ) : (
            <>
              {/* Portfolio Summary Cards */}
              <AccountSummaryCards totalDeposits={totalDeposits} totalInterestEarned={totalInterestEarned} userPositions={userPositions} />

              {/* Main Content Tabs */}
              <Tabs defaultValue="positions" className="w-full">
                <TabsList className="bg-[#2A0A0A]/80 border border-blue-900/10 mb-6 flex flex-wrap">
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
                      <AccountPositionsList userPositions={userPositions} loading={loading.positions} />
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
                      <AccountActivityList transactions={transactions} loading={loading.transactions} />
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

