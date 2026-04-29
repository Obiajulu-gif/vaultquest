"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Droplets } from "lucide-react";

export default function WinnersPage() {
	const [activeFilter, setActiveFilter] = useState("all");

	const winners = [
		{
			network: "Stellar",
			address: "GBXK...5B5B",
			date: "January 18",
			price: "100 XLM",
		},
		{
			network: "USDC",
			address: "GBXK...5B5B",
			date: "January 18",
			price: "50 USDC",
		},
		{
			network: "USDT",
			address: "GBXK...5B5B",
			date: "January 18",
			price: "50 USDT",
		},
		{
			network: "USDC",
			address: "GBXK...5B5B",
			date: "January 18",
			price: "25 USDC",
		},
		{
			network: "Stellar",
			address: "GBXK...5B5B",
			date: "January 18",
			price: "75 XLM",
		},
		{
			network: "USDT",
			address: "GBXK...5B5B",
			date: "January 18",
			price: "30 USDT",
		},
		{
			network: "Stellar",
			address: "GBXK...5B5B",
			date: "January 18",
			price: "120 XLM",
		},
		{
			network: "USDC",
			address: "GBXK...5B5B",
			date: "January 18",
			price: "40 USDC",
		},
		{
			network: "Stellar",
			address: "GBXK...5B5B",
			date: "January 18",
			price: "90 XLM",
		},
		{
			network: "USDC",
			address: "GBXK...5B5B",
			date: "January 18",
			price: "60 USDC",
		},
		{
			network: "USDT",
			address: "GBXK...5B5B",
			date: "January 18",
			price: "45 USDT",
		},
		{
			network: "USDC",
			address: "GBXK...5B5B",
			date: "January 18",
			price: "55 USDC",
		},
	];

	const filteredWinners =
		activeFilter === "all"
			? winners
			: winners.filter(
					(w) => w.network.toLowerCase() === activeFilter.toLowerCase()
			  );

	return (
		<div className="min-h-screen bg-gradient-to-b from-[#1A0505] to-[#2D0A0A] text-white">
			<header className="container mx-auto px-4 py-6 z-10 relative">
				<nav className="flex items-center justify-between backdrop-blur-sm bg-[#1A0505]/70 rounded-xl p-4 border border-red-900/20">
					<Link href="/" className="flex items-center gap-2">
						<Image
							src="/images/logo.png"
							alt="Drip Wave Logo"
							width={40}
							height={40}
							className="rounded-full"
						/>
						<span className="text-xl font-bold">
							Drip <span className="text-blue-400">Wave</span>
						</span>
					</Link>
					<div className="hidden md:flex items-center gap-8">
						<Link
							href="/"
							className="text-gray-300 hover:text-white transition-colors"
						>
							Home
						</Link>
						<Link href="/winners" className="text-red-500">
							Winners
						</Link>
						<Link
							href="/doc"
							className="text-gray-300 hover:text-white transition-colors"
						>
							Doc
						</Link>
					</div>
					<Link href="/app">
						<Button className="bg-red-600 hover:bg-red-700">Launch DApp</Button>
					</Link>
				</nav>
			</header>

			<main className="container mx-auto px-4 py-8">
				<div className="max-w-5xl mx-auto">
					<div className="flex justify-center mb-8">
						<div className="flex items-center gap-2 bg-[#2A0A0A]/80 backdrop-blur-sm rounded-full p-1 border border-red-900/10">
							<button
								className={`px-4 py-2 rounded-full text-sm transition-colors ${
									activeFilter === "all" ? "bg-red-600" : "hover:bg-[#3A0A0A]"
								}`}
								onClick={() => setActiveFilter("all")}
							>
								All
							</button>
							<button
								className={`px-4 py-2 rounded-full text-sm transition-colors flex items-center gap-2 ${
									activeFilter === "stellar"
										? "bg-blue-600"
										: "hover:bg-[#3A0A0A]"
								}`}
								onClick={() => setActiveFilter("stellar")}
							>
								<div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
									<Droplets size={10} className="text-white" />
								</div>
								Stellar
							</button>
							<button
								className={`px-4 py-2 rounded-full text-sm transition-colors flex items-center gap-2 ${
									activeFilter === "usdc" ? "bg-red-600" : "hover:bg-[#3A0A0A]"
								}`}
								onClick={() => setActiveFilter("usdc")}
							>
								<Image
									src="/placeholder.svg?height=16&width=16"
									alt="USDC"
									width={16}
									height={16}
									className="rounded-full"
								/>
								USDC
							</button>
						</div>
					</div>

					<div className="bg-[#1A0808]/60 backdrop-blur-sm rounded-xl border border-red-900/20 p-6 shadow-lg">
						<h2 className="text-xl font-bold mb-6">Recent Winners</h2>
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
									{filteredWinners.map((winner, i) => (
										<tr key={i} className="border-b border-red-900/10">
											<td className="py-4">{winner.network}</td>
											<td className="py-4 font-mono">{winner.address}</td>
											<td className="py-4">{winner.date}</td>
											<td className="py-4">{winner.price}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}
