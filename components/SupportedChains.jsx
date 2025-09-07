"use client"

import { useState } from "react"
import Image from "next/image"

export default function SupportedChains() {
  const [isPaused, setIsPaused] = useState(false)

  // Blockchain data with logos and names
 const blockchains = [
		{
			name: "Eth",
			logo: "/images/avax.png",
			color: "bg-gradient-to-r from-cyan-500 to-blue-500",
			description: "Interoperable blockchain for the Cosmos ecosystem",
		},
		{
			name: "USDC",
			logo: "/images/usdc.png",
			color: "bg-gradient-to-r from-green-600 to-green-400",
			description: "Stablecoin for reliable transactions",
		},
		{
			name: "USDT",
			logo: "/images/usdt.png",
			color: "bg-gradient-to-r from-orange-500 to-red-500",
			description: "Chain for innovative decentralized apps",
		},
 ];

  return (
    <div className="py-8 overflow-hidden bg-[#1A0808]/30 backdrop-blur-sm border-y border-red-900/20">
      <div className="container mx-auto px-4 mb-4">
        <h3 className="text-center text-xl font-bold">Supported Tokens</h3>
      </div>

      <div
        className="relative overflow-hidden marquee-mask"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className={`marquee flex py-4 gap-8 ${isPaused ? "paused" : ""}`}>
          {/* First set of items */}
          {blockchains.map((blockchain, index) => (
            <div
              key={`${blockchain.name}-${index}`}
              className="flex flex-col items-center justify-center bg-[#1A0808]/70 backdrop-blur-sm rounded-xl p-4 border border-red-900/20 shadow-lg min-w-[160px] transition-all duration-300 hover:scale-105 hover:border-red-500/50"
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 `}>
                <Image
                  src={blockchain.logo || "/placeholder.svg"}
                  alt={blockchain.name}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              </div>
              <span className="font-medium">{blockchain.name}</span>
            
            </div>
          ))}

          {/* Duplicate set for seamless looping */}
          {blockchains.map((blockchain, index) => (
            <div
              key={`${blockchain.name}-duplicate-${index}`}
              className="flex flex-col items-center justify-center bg-[#1A0808]/70 backdrop-blur-sm rounded-xl p-4 border border-red-900/20 shadow-lg min-w-[160px] transition-all duration-300 hover:scale-105 hover:border-red-500/50"
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2`}>
                <Image
                  src={blockchain.logo || "/placeholder.svg"}
                  alt={blockchain.name}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              </div>
              <span className="font-medium">{blockchain.name}</span>
              
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

