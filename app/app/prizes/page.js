"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import AppNav from "@/components/app/AppNav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Clock, Trophy, Wallet } from "lucide-react"
import DepositModal from "@/components/app/DepositModal"
import Image from "next/image"

export default function PrizesPage() {
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState("all")
  // const [selectedPrize, setSelectedPrize] = useState(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const prizes = [
    {
      id: 1,
      name: "Grand Prize",
      protocol: "Drip Wave",
      amount: 23087.0,
      token: "XLM",
      tokenAmount: 0.23,
      cadence: "Monthly",
      participants: 1247,
      nextDraw: "in 5 days",
    },
    {
      id: 2,
      name: "Weekly Prize",
      protocol: "Drip Wave",
      amount: 12500.0,
      token: "XLM",
      tokenAmount: 0.15,
      cadence: "Weekly",
      participants: 892,
      nextDraw: "in 2 days",
    },
    {
      id: 3,
      name: "Daily Prize",
      protocol: "Drip Wave",
      amount: 5000.0,
      token: "XLM",
      tokenAmount: 0.08,
      cadence: "Daily",
      participants: 456,
      nextDraw: "in 12 hours",
    },
    {
      id: 4,
      name: "Hourly Prize",
      protocol: "Drip Wave",
      amount: 1000.0,
      token: "XLM",
      tokenAmount: 0.02,
      cadence: "Hourly",
      participants: 234,
      nextDraw: "in 45 minutes",
    },
    {
      id: 5,
      name: "Community Prize",
      protocol: "Drip Wave",
      amount: 7500.0,
      token: "XLM",
      tokenAmount: 0.12,
      cadence: "Weekly",
      participants: 678,
      nextDraw: "in 4 days",
    },
    {
      id: 6,
      name: "Special Prize",
      protocol: "Drip Wave",
      amount: 15000.0,
      token: "XLM",
      tokenAmount: 0.18,
      cadence: "Monthly",
      participants: 1023,
      nextDraw: "in 8 days",
    },
  ]

  const filteredPrizes = activeFilter === "all" ? prizes : prizes.filter((p) => p.protocol === activeFilter)

  const handleOpenDeposit = (prize) => {
    setIsDepositModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1A0505] to-[#2D0A0A] text-white">
      <AppNav />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Prize Pools</h1>
            <p className="text-gray-300 mb-6">
              Deposit into Drip Wave prize pools on Stellar and win rewards without risking your principal
            </p>
          </div>

          <div className="bg-[#1A0808]/50 backdrop-blur-sm rounded-xl border border-red-900/20 p-6 shadow-lg">
            <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-medium">Filter</h2>
                <div className="flex items-center gap-2 bg-[#2A0A0A]/80 backdrop-blur-sm rounded-full p-1 border border-red-900/10">
                  <button
                    className={`px-3 py-1 rounded-full text-sm ${activeFilter === "all" ? "bg-red-600" : "hover:bg-[#3A0A0A]"}`}
                    onClick={() => setActiveFilter("all")}
                  >
                    All
                  </button>
                  <button
                    className={`px-3 py-1 rounded-full text-sm ${activeFilter === "Drip Wave" ? "bg-red-600" : "hover:bg-[#3A0A0A]"}`}
                    onClick={() => setActiveFilter("Drip Wave")}
                  >
                    Drip Wave
                  </button>
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search Prizes"
                  className="pl-10 bg-[#2A0A0A]/70 backdrop-blur-sm border-red-900/20 w-full md:w-64"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPrizes.map((prize) => (
                <div
                  key={prize.id}
                  className="bg-[#1A0808]/70 backdrop-blur-sm rounded-xl p-6 border border-red-900/20 shadow-lg hover:border-red-500/50 transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Image src="/images/avax.png" height={1000} width={1000} alt="stellar icon" className="w-10 h-10" />
                      <div>
                        <div className="font-medium">{prize.name}</div>
                        <div className="text-sm text-gray-400">{prize.protocol}</div>
                      </div>
                    </div>
                    <div className="bg-red-900/20 text-red-500 px-2 py-1 rounded text-sm">
                      {prize.cadence}
                    </div>
                  </div>

                  <div className="text-3xl font-bold mb-1">
                    {mounted 
                      ? `$${prize.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                      : `$${prize.amount}`}
                  </div>
                  <div className="text-gray-400 text-sm mb-4">
                    + {prize.tokenAmount} {prize.token}
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center">
                      <div className="text-gray-400 text-sm flex items-center gap-1">
                        <Wallet size={14} /> Participants
                      </div>
                      <div>{prize.participants}</div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="text-gray-400 text-sm flex items-center gap-1">
                        <Clock size={14} /> Next Draw
                      </div>
                      <div className="text-sm">{prize.nextDraw}</div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="text-gray-400 text-sm flex items-center gap-1">
                        <Trophy size={14} /> Prize Pool
                      </div>
                      <div className="text-sm">${(prize.amount * prize.participants).toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      className="w-full bg-red-600/90 hover:bg-red-700 backdrop-blur-sm shadow-lg"
                      onClick={() => handleOpenDeposit(prize)}
                    >
                      Deposit
                    </Button>
                    <Link
                      href={`/app/prize/${prize.id}`}
                      className="w-full"
                    >
                      <Button
                        variant="outline"
                        className="w-full border-red-900/20 hover:bg-red-600/10 backdrop-blur-sm shadow-lg"
                      >
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <DepositModal isOpen={isDepositModalOpen} onClose={() => setIsDepositModalOpen(false)} />
    </div>
  )
}

