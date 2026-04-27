"use client"

import { useState } from "react"
import Image from "next/image"

export default function SupportedChains() {
  const [isPaused, setIsPaused] = useState(false)

  // Blockchain data with logos and names
 const blockchains = [
		{
			name: "Stellar (XLM)",
			logo: "/images/stellar.png",
			color: "bg-gradient-to-r from-blue-500 to-indigo-500",
			description: "Native asset for transactions and fees on the Stellar network",
		},
		{
			name: "USDC",
			logo: "/images/usdc.png",
			color: "bg-gradient-to-r from-blue-600 to-blue-400",
			description: "Regulated dollar stablecoin on Stellar",
		},
		{
			name: "USDT",
			logo: "/images/usdt.png",
			color: "bg-gradient-to-r from-teal-500 to-green-500",
			description: "Widely used stablecoin available on Stellar",
		},
 ];

  return (
    <div className="py-8 overflow-hidden bg-[#08081A]/30 backdrop-blur-sm border-y border-blue-900/20">
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
              className="flex flex-col items-center justify-center bg-[#08081A]/70 backdrop-blur-sm rounded-xl p-4 border border-blue-900/20 shadow-lg min-w-[160px] transition-all duration-300 hover:scale-105 hover:border-blue-500/50"
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
              className="flex flex-col items-center justify-center bg-[#08081A]/70 backdrop-blur-sm rounded-xl p-4 border border-blue-900/20 shadow-lg min-w-[160px] transition-all duration-300 hover:scale-105 hover:border-blue-500/50"
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

