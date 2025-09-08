"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import AppNav from "@/components/app/AppNav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import DepositModal from "@/components/app/DepositModal"

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
      network: "Cosmos",
      amount: 23087.0,
      token: "eth",
      tokenAmount: 0.23,
    },
    {
      id: 2,
      name: "Weekly Prize",
      network: "Cosmos",
      amount: 12500.0,
      token: "eth",
      tokenAmount: 0.15,
    },
    {
      id: 3,
      name: "Daily Prize",
      network: "Cosmos",
      amount: 5000.0,
      token: "eth",
      tokenAmount: 0.08,
    },
    {
      id: 4,
      name: "Hourly Prize",
      network: "Cosmos",
      amount: 1000.0,
      token: "eth",
      tokenAmount: 0.02,
    },
    {
      id: 5,
      name: "Community Prize",
      network: "Cosmos",
      amount: 7500.0,
      token: "eth",
      tokenAmount: 0.12,
    },
    {
      id: 6,
      name: "Special Prize",
      network: "Cosmos",
      amount: 15000.0,
      token: "atpm",
      tokenAmount: 0.18,
    },
  ]

  const filteredPrizes = activeFilter === "all" ? prizes : prizes.filter((p) => p.network === activeFilter)

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
              Deposit funds into prize vaults and stand a chance to win prizes without risking your deposit
            </p>
          </div>

          <div className="bg-[#1A0808]/50 backdrop-blur-sm rounded-xl border border-red-900/20 p-6 shadow-lg">
            <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-medium">Filter Prizes</h2>
                <div className="flex items-center gap-2 bg-[#2A0A0A]/80 backdrop-blur-sm rounded-full p-1 border border-red-900/10">
                  <button
                    className={`px-3 py-1 rounded-full text-sm ${activeFilter === "all" ? "bg-red-600" : "hover:bg-[#3A0A0A]"}`}
                    onClick={() => setActiveFilter("all")}
                  >
                    View All
                  </button>
                  <button
                    className={`px-3 py-1 rounded-full text-sm ${activeFilter === "Cosmos" ? "bg-red-600" : "hover:bg-[#3A0A0A]"}`}
                    onClick={() => setActiveFilter("Cosmos")}
                  >
                    Avax
                  </button>
                  <button
                    className={`px-3 py-1 rounded-full text-sm ${activeFilter === "Eth" ? "bg-red-600" : "hover:bg-[#3A0A0A]"}`}
                    onClick={() => setActiveFilter("Eth")}
                  >
                    Eth
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredPrizes.map((prize) => (
                <div
                  key={prize.id}
                  className="bg-[#1A0808]/70 backdrop-blur-sm rounded-xl p-6 border border-red-900/20 hover:border-red-500/50 transition-colors shadow-lg">
                  <div className="text-2xl font-bold mb-1">
                    {mounted 
                      ? `$${prize.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                      : `$${prize.amount}`}
                  </div>
                  {/* Uncomment or import CosmosIcon if needed */}
                  {/* <CosmosIcon className="w-6 h-6" /> */}
                  <div className="text-gray-400 text-sm mb-4">
                    + {prize.tokenAmount} {prize.token}
                  </div>
                  <div className="flex justify-between items-center">
                    <Link
                      href={`/app/prize/${prize.id}`}
                      className="text-red-500 text-sm hover:text-red-400 transition-colors"
                    >
                      View details
                    </Link>
                    <Button size="sm" className="bg-red-600 hover:bg-red-700" onClick={() => handleOpenDeposit(prize)}>
                      Deposit
                    </Button>
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

