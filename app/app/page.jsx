"use client"

import { useState } from "react"
import Link from "next/link"
import  AppNav from "@/components/app/AppNav"
import { Button } from "@/components/ui/button"
import PrizeGrid from "@/components/app/PrizeGrid"

export default function AppPage() {
  const [isConnected, setIsConnected] = useState(false)

  const handleConnectWallet = () => {
    setIsConnected(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1A0505] to-[#2D0A0A] text-white">
      <AppNav />
      <main className="container mx-auto px-4 py-8 md:py-16 relative z-10">
        <div className="text-center mb-12 md:mb-16">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 leading-tight">Save your deposit.</h1>
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-6 md:mb-8 leading-tight">
            Win up to <span className="text-red-500">$362,497</span>
          </h2>
          {!isConnected ? (
            <Button
              className="bg-red-600/90 hover:bg-red-700 text-white font-bold py-3 px-6 md:px-8 rounded-full backdrop-blur-sm shadow-lg w-full sm:w-auto text-base md:text-lg"
              onClick={handleConnectWallet}
            >
              Start Saving
            </Button>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md sm:max-w-none mx-auto">
              <Link href="/app/prizes" className="w-full sm:w-auto">
                <Button className="bg-red-600/90 hover:bg-red-700 text-white font-bold py-3 px-6 md:px-8 rounded-full backdrop-blur-sm shadow-lg w-full text-base md:text-lg">
                  View All Prizes
                </Button>
              </Link>
              <Link href="/app/vault" className="w-full sm:w-auto">
                <Button className="bg-transparent border border-red-600/70 hover:bg-red-600/10 text-white font-bold py-3 px-6 md:px-8 rounded-full backdrop-blur-sm shadow-lg w-full text-base md:text-lg">
                  Manage Vaults
                </Button>
              </Link>
            </div>
          )}
        </div>
        <PrizeGrid />
      </main>
    </div>
  )
}

