import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import LandingWalletConnect from "@/components/app/LandingWalletConnect"

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 py-16 overflow-hidden bg-gradient-to-b from-black to-[#FD181466]">
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Desktop Floating Elements */}
        <div className="hidden md:block">
          <div className="absolute top-80 right-64 animate-float-slow">
            <Image
              src="/images/coinsilver.png"
              alt="Protocol Icon"
              width={300}
              height={300}
              className="rounded-full"
            />
          </div>
          <div className="absolute bottom-40 left-60 top-20 animate-float">
            <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-4xl">⭐</span>
            </div>
          </div>
          <div className="absolute bottom-40 right-60 top-20 animate-float">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-2xl">🌟</span>
            </div>
          </div>
          <div className="absolute top-80 left-96 animate-float-medium">
            <Image
              src="/images/diamond.png"
              alt="Coin"
              width={150}
              height={150}
              className="rounded-full"
            />
          </div>
        </div>

        {/* Mobile Background Elements */}
         <div className="md:hidden">
           {/* Top Left Stellar */}
           <div className="absolute top-20 left-4 opacity-80">
             <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
               <span className="text-3xl">⭐</span>
             </div>
           </div>
           {/* Top Right Geometric Shape */}
           <div className="absolute top-16 right-4 opacity-40">
             <div className="w-16 h-16 bg-blue-500/20 transform rotate-45 rounded-lg"></div>
           </div>
           {/* Left Edge Diamond */}
           <div className="absolute top-3 -right-8">
              <Image
               src="/images/diamond.png"
               alt="Diamond"
               width={60}
               height={60}
             />
           </div>
           {/* Right Edge Small Stellar */}
           <div className="absolute top-2/3 -right-4">
             <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
               <span className="text-xl">🌟</span>
             </div>
           </div>
           {/* Bottom Left Large Diamond */}
           <div className="absolute bottom-32 left-0 opacity-60">
             <Image
               src="/images/diamond.png"
               alt="Diamond"
               width={120}
               height={120}
             />
           </div>
           <div className="absolute bottom-10 right-20">
             <Image
               src="/images/coin-gold.png"
               alt="Coin"
               width={60}
               height={60}
               className="rounded-full"
             />
           </div>
           {/* Bottom Right Coin */}
           <div className="absolute bottom-20 right-4">
             <Image
               src="/images/coinsilver.png"
               alt="Coin"
               width={80}
               height={80}
               className="rounded-full"
             />
           </div>
           {/* Center Right Geometric */}
           <div className="absolute top-1/2 right-0 opacity-20">
             <div className="w-24 h-24 bg-purple-500/10 rounded-full"></div>
           </div>
         </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-7xl font-bold leading-tight mb-6">
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Drip Wave
            </span>
            <br className="hidden md:block" />
            <span className="text-2xl md:text-5xl text-white">
              Stellar Savings Protocol
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Save, earn, and win on the Stellar network. Join thousands of users earning competitive yields with prize-linked savings.
          </p>
        </div>
        
        {/* Wallet Connection Component */}
        <div className="max-w-2xl mx-auto">
          <LandingWalletConnect />
        </div>
        
        {/* Additional CTA for connected users */}
        <div className="text-center mt-8">
          <Link href="/app/pools">
            <Button variant="ghost" className="text-gray-400 hover:text-white">
              Explore Pools →
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

