"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function WinnersPage() {
	const [activeFilter, setActiveFilter] = useState("all");

	const winners = [
		{
			network: "Cosmos",
			address: "cosm...45ng4f",
			date: "January 18",
			price: "0.0009 Eth",
		},
		{
			network: "USDC",
			address: "cosm...34nf30",
			date: "January 18",
			price: "0.0009 Eth",
		},
		{
			network: "USDT",
			address: "cosm...gsye20",
			date: "January 18",
			price: "0.0009 Eth",
		},
		{
			network: "USDC",
			address: "cosm...3if0w3",
			date: "January 18",
			price: "0.0009 Eth",
		},
		{
			network: "Cosmos",
			address: "cosm...er93j9",
			date: "January 18",
			price: "0.0009 Eth",
		},
		{
			network: "USDT",
			address: "cosm...gsye20",
			date: "January 18",
			price: "0.0009 Eth",
		},
		{
			network: "Cosmos",
			address: "cosm...it4g45",
			date: "January 18",
			price: "0.0009 Eth",
		},
		{
			network: "USDC",
			address: "cosm...93nf34",
			date: "January 18",
			price: "0.0009 Eth",
		},
		{
			network: "Cosmos",
			address: "cosm...gsye20",
			date: "January 18",
			price: "0.0009 Eth",
		},
		{
			network: "USDC",
			address: "cosm...94mg40",
			date: "January 18",
			price: "0.0009 Eth",
		},
		{
			network: "USDT",
			address: "cosm...9g6450",
			date: "January 18",
			price: "0.0009 Eth",
		},
		{
			network: "USDC",
			address: "cosm...gjr430",
			date: "January 18",
			price: "0.0009 Eth",
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
							alt="VaultQuest Logo"
							width={40}
							height={40}
							className="rounded-full"
						/>
						<span className="text-xl font-bold">
							Vault<span className="text-red-600">Quest</span>
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
									activeFilter === "ethereum"
										? "bg-red-600"
										: "hover:bg-[#3A0A0A]"
								}`}
								onClick={() => setActiveFilter("ethereum")}
							>
								<Image
									src="/placeholder.svg?height=16&width=16"
									alt="Cosmos"
									width={16}
									height={16}
									className="rounded-full"
								/>
								Cosmos
							</button>
							<button
								className={`px-4 py-2 rounded-full text-sm transition-colors flex items-center gap-2 ${
									activeFilter === "starknet"
										? "bg-red-600"
										: "hover:bg-[#3A0A0A]"
								}`}
								onClick={() => setActiveFilter("starknet")}
							>
								<Image
									src="/placeholder.svg?height=16&width=16"
									alt="Starknet"
									width={16}
									height={16}
									className="rounded-full"
								/>
								Cosmos
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
