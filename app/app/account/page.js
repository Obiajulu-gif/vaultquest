"use client"

import { useState } from "react"
import AppNav from "@/components/app/AppNav"
import { Button } from "@/components/ui/button"
import { Wallet, Trophy } from "lucide-react"
import DepositModal from "@/components/app/DepositModal"
import WithdrawModal from "@/components/app/WithdrawModal"

export default function AccountPage() {
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false)
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false)

  const recentWins = [
    { network: "Eth", address: "cosm...gsye20", date: "January 18", price: "0.0009 eth" },
    { network: "USDC", address: "cosm...hjue79", date: "January 18", price: "0.0009 eth" },
    { network: "USDT", address: "cosm...gj90rc", date: "January 18", price: "0.0009 eth" },
    { network: "Eth", address: "cosm...hjue79", date: "January 18", price: "0.0009 eth" },
    { network: "USDC", address: "cosm...gsye20", date: "January 18", price: "0.0009 eth" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1A0505] to-[#2D0A0A] text-white">
      <AppNav />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold">Account Overview</h1>
            <div className="flex gap-2">
              <Button
                className="bg-red-600/90 hover:bg-red-700 backdrop-blur-sm shadow-lg"
                onClick={() => setIsDepositModalOpen(true)}
              >
                Deposit
              </Button>
              <Button
                variant="outline"
                className="border-red-900/20 hover:bg-red-600/10 backdrop-blur-sm shadow-lg"
                onClick={() => setIsWithdrawModalOpen(true)}
              >
                Withdraw
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-[#1A0808]/70 backdrop-blur-sm rounded-xl p-6 border border-red-900/20 shadow-lg">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-gray-400 mb-2">Your Deposits</div>
                  <div className="text-3xl font-bold">
                    $ 4,330<span className="text-sm">.00</span>
                  </div>
                </div>
                <div className="bg-[#2A0A0A] p-3 rounded-lg">
                  <Wallet className="w-6 h-6 text-gray-400" />
                </div>
              </div>
            </div>

            <div className="bg-[#1A0808]/70 backdrop-blur-sm rounded-xl p-6 border border-red-900/20 shadow-lg">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-gray-400 mb-2">Your Winnings</div>
                  <div className="text-3xl font-bold">
                    $ 0<span className="text-sm">.00</span>
                  </div>
                </div>
                <div className="bg-[#2A0A0A] p-3 rounded-lg">
                  <Trophy className="w-6 h-6 text-gray-400" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#1A0808]/70 backdrop-blur-sm rounded-xl border border-red-900/20 p-6 shadow-lg">
            <h2 className="text-xl font-bold mb-6">Recent Wins</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-gray-400 text-sm border-b border-red-900/10">
                    <th className="text-left pb-4 font-normal">Network</th>
                    <th className="text-left pb-4 font-normal">Address</th>
                    <th className="text-left pb-4 font-normal">↓ Date</th>
                    <th className="text-left pb-4 font-normal">↓ Price</th>
                  </tr>
                </thead>
                <tbody>
                  {recentWins.map((win, i) => (
                    <tr key={i} className="border-b border-red-900/10">
                      <td className="py-4">{win.network}</td>
                      <td className="py-4 font-mono">{win.address}</td>
                      <td className="py-4">{win.date}</td>
                      <td className="py-4">{win.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      <DepositModal isOpen={isDepositModalOpen} onClose={() => setIsDepositModalOpen(false)} />

      <WithdrawModal isOpen={isWithdrawModalOpen} onClose={() => setIsWithdrawModalOpen(false)} />
    </div>
  )
}

