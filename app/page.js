
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import SavingAndWinning from "@/components/SavingAndWinning";
import WhyPrizeSavings from "@/components/WhyPrizeSavings";
import Stats from "@/components/Stats";
import Footer from "@/components/Footer";
import Roadmap from "@/components/Roadmap";
import Technology from "@/components/Technology";
import FAQ from "@/components/FAQ";
import GetInvolved from "@/components/GetInvolved";
import SupportedChains from "@/components/SupportedChains";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1A0505] to-[#2D0A0A] text-white">
      <Navbar />
      <main className="pt-16">
        <Hero />
        <Stats />
        <SupportedChains />
        <SavingAndWinning />
        <WhyPrizeSavings />
        <Technology />
        <Roadmap />
        <GetInvolved />
        <FAQ />
      </main>

      <Footer />
    </div>
  );
}
