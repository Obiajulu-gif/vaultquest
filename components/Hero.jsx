import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"

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
            <Image
              src="/aval.png"
              alt="Stellar"
              width={120}
              height={120}
            />
          </div>
          <div className="absolute bottom-40 right-60 top-20 animate-float">
            <Image
              src="/avall.png"
              alt="Stellar"
              width={50}
              height={50}
            />
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
             <Image
               src="/aval.png"
               alt="Stellar"
               width={80}
               height={80}
             />
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
             <Image
               src="/avall.png"
               alt="Stellar"
               width={40}
               height={40}
             />
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
      <div className="text-center max-w-4xl mx-auto relative z-10">
        

        <h1 className="text-3xl md:text-7xl font-bold leading-tight mb-6">
          The #1 Protocol <br className="hidden md:block" />
          <span className="md:hidden">for Real Adoption</span>
          <span className="hidden md:inline">for Real Adoption</span>
        </h1>
        
        <p className="text-sm md:text-lg text-gray-300 mb-8 max-w-md md:max-w-none mx-auto">
          The permissionless protocol 86,000 people are using to win by saving
        </p>
        
        <Link href="/app">
          <Button className="bg-red-600 hover:bg-red-700 text-sm md:text-lg py-3 px-6 md:py-6 md:px-8 rounded-full w-full md:w-auto max-w-xs md:max-w-none">
            Launch DApp
          </Button>
        </Link>
      </div>
    </section>
  )
}

