import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import LandingWalletConnect from "@/components/app/LandingWalletConnect"

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 py-16 overflow-hidden bg-gradient-to-b from-[#0A0202] via-[#1A0505] to-[#2D0A0A]">
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }}></div>
        
        {/* Desktop Floating Elements - Stellar-themed */}
        <div className="hidden md:block">
          <div className="absolute top-80 right-64 animate-float-slow opacity-60">
            <div className="w-64 h-64 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl"></div>
          </div>
          <div className="absolute bottom-40 left-60 top-20 animate-float opacity-40">
            <div className="w-40 h-40 bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-full blur-2xl"></div>
          </div>
          <div className="absolute top-80 left-96 animate-float-medium opacity-50">
            <div className="w-48 h-48 bg-gradient-to-br from-cyan-500/15 to-blue-500/15 rounded-full blur-2xl"></div>
          </div>
        </div>

        {/* Mobile Background Elements */}
         <div className="md:hidden">
           {/* Top Left Glow */}
           <div className="absolute top-20 left-4 opacity-40">
             <div className="w-32 h-32 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-2xl"></div>
           </div>
           {/* Top Right Glow */}
           <div className="absolute top-16 right-4 opacity-30">
             <div className="w-24 h-24 bg-gradient-to-br from-red-500/15 to-orange-500/15 rounded-full blur-xl"></div>
           </div>
           {/* Bottom Left Glow */}
           <div className="absolute bottom-32 left-0 opacity-40">
             <div className="w-40 h-40 bg-gradient-to-br from-cyan-500/15 to-blue-500/15 rounded-full blur-2xl"></div>
           </div>
           {/* Bottom Right Glow */}
           <div className="absolute bottom-20 right-4 opacity-30">
             <div className="w-28 h-28 bg-gradient-to-br from-purple-500/15 to-pink-500/15 rounded-full blur-xl"></div>
           </div>
         </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <div className="inline-block mb-6 px-4 py-2 bg-red-900/20 border border-red-500/30 rounded-full">
            <span className="text-sm font-medium text-red-400">Powered by Stellar & Soroban</span>
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold leading-tight mb-6">
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-red-400 bg-clip-text text-transparent">
              Drip Wave
            </span>
          </h1>
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
            Prize-Linked Savings on Stellar
          </h2>
          
          <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Deposit your assets, earn yield, and win prizes — all without risking your principal. 
            Join the future of savings on the Stellar network.
          </p>
        </div>
        
        {/* Wallet Connection Component */}
        <div className="max-w-md mx-auto mb-8">
          <LandingWalletConnect />
        </div>
        
        {/* Additional CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/app/pools">
            <Button className="bg-red-600/90 hover:bg-red-700 backdrop-blur-sm shadow-lg px-8 py-6 text-lg">
              Explore Prize Pools
            </Button>
          </Link>
          <Link href="/app/prizes">
            <Button variant="outline" className="border-red-900/20 hover:bg-red-600/10 backdrop-blur-sm shadow-lg px-8 py-6 text-lg">
              View Prizes
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

