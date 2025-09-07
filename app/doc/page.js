import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronRight, Copy, ExternalLink, Search } from "lucide-react";

export default function DocPage() {
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
						<Link
							href="/winners"
							className="text-gray-300 hover:text-white transition-colors"
						>
							Winners
						</Link>
						<Link href="/doc" className="text-red-500">
							Doc
						</Link>
					</div>
					<Link href="/app">
						<Button className="bg-red-600 hover:bg-red-700">Launch DApp</Button>
					</Link>
				</nav>
			</header>

			<main className="container mx-auto px-4 py-8">
				<div className="flex flex-col md:flex-row gap-8">
					{/* Sidebar */}
					<div className="md:w-64 shrink-0">
						<div className="bg-[#1A0808]/60 backdrop-blur-sm rounded-xl border border-red-900/20 p-4 shadow-lg sticky top-24">
							<div className="relative mb-4">
								<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
								<input
									type="text"
									placeholder="Search docs..."
									className="w-full bg-[#2A0A0A]/80 backdrop-blur-sm border border-red-900/20 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30"
								/>
							</div>

							<div className="space-y-6">
								<div>
									<h4 className="text-sm font-semibold text-gray-400 uppercase mb-3">
										Getting Started
									</h4>
									<ul className="space-y-2">
										<li>
											<Link
												href="#overview"
												className="flex items-center text-red-500 font-medium"
											>
												<ChevronRight size={16} className="mr-1" />
												Overview
											</Link>
										</li>
										<li>
											<Link
												href="#how-it-works"
												className="flex items-center text-gray-300 hover:text-white transition-colors"
											>
												<ChevronRight size={16} className="mr-1" />
												How it Works
											</Link>
										</li>
										<li>
											<Link
												href="#quick-start"
												className="flex items-center text-gray-300 hover:text-white transition-colors"
											>
												<ChevronRight size={16} className="mr-1" />
												Quick Start
											</Link>
										</li>
									</ul>
								</div>

								<div>
									<h4 className="text-sm font-semibold text-gray-400 uppercase mb-3">
										Smart Contracts
									</h4>
									<ul className="space-y-2">
										<li>
											<Link
												href="#contracts"
												className="flex items-center text-gray-300 hover:text-white transition-colors"
											>
												<ChevronRight size={16} className="mr-1" />
												Contract Addresses
											</Link>
										</li>
										<li>
											<Link
												href="#interfaces"
												className="flex items-center text-gray-300 hover:text-white transition-colors"
											>
												<ChevronRight size={16} className="mr-1" />
												Interfaces
											</Link>
										</li>
									</ul>
								</div>

								<div>
									<h4 className="text-sm font-semibold text-gray-400 uppercase mb-3">
										API Reference
									</h4>
									<ul className="space-y-2">
										<li>
											<Link
												href="#rest-api"
												className="flex items-center text-gray-300 hover:text-white transition-colors"
											>
												<ChevronRight size={16} className="mr-1" />
												REST API
											</Link>
										</li>
										<li>
											<Link
												href="#graphql"
												className="flex items-center text-gray-300 hover:text-white transition-colors"
											>
												<ChevronRight size={16} className="mr-1" />
												GraphQL
											</Link>
										</li>
										<li>
											<Link
												href="#sdk"
												className="flex items-center text-gray-300 hover:text-white transition-colors"
											>
												<ChevronRight size={16} className="mr-1" />
												SDK
											</Link>
										</li>
									</ul>
								</div>
							</div>
						</div>
					</div>

					{/* Main content */}
					<div className="flex-1">
						<div className="bg-[#1A0808]/60 backdrop-blur-sm rounded-xl border border-red-900/20 p-8 shadow-lg">
							<div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
								<Link href="/" className="hover:text-white">
									Home
								</Link>
								<ChevronRight size={14} />
								<Link href="/doc" className="text-red-500">
									Documentation
								</Link>
							</div>

							<h1 className="text-3xl md:text-4xl font-bold mb-6">
								VaultQuest Documentation
							</h1>
							<div className="text-gray-400 mb-12 text-lg">
								Complete documentation for the VaultQuest protocol, smart
								contracts, and API.
							</div>

							<section id="overview" className="mb-12">
								<h2 className="text-2xl font-bold mb-4 text-red-500">
									Overview
								</h2>
								<div className="prose prose-invert max-w-none">
									<p className="text-gray-300 mb-4">
										VaultQuest is a no-loss prize saving protocol where users
										deposit funds into prize vaults and stand a chance to win
										prizes through regular draws without risking their deposit.
										The protocol uses tokenized vaults (ERC4626) to generate
										yield and distribute prizes.
									</p>
									<p className="text-gray-300 mb-4">
										Our protocol is designed to be:
									</p>
									<ul className="list-disc pl-6 space-y-2 text-gray-300 mb-6">
										<li>
											<strong>Secure</strong> - Audited by leading security
											firms with no exploits to date
										</li>
										<li>
											<strong>Transparent</strong> - All prize distributions are
											verifiably random and on-chain
										</li>
										<li>
											<strong>Efficient</strong> - Low gas fees and optimized
											for maximum yield generation
										</li>
										<li>
											<strong>Multi-chain</strong> - Available on multiple
											blockchains for wider accessibility
										</li>
									</ul>
								</div>
							</section>

							<section id="how-it-works" className="mb-12">
								<h2 className="text-2xl font-bold mb-4 text-red-500">
									How it Works
								</h2>
								<div className="prose prose-invert max-w-none">
									<p className="text-gray-300 mb-4">
										The protocol works through a simple but powerful mechanism:
									</p>

									<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
										<div className="bg-[#2A0A0A]/80 backdrop-blur-sm rounded-lg p-5 border border-red-900/20">
											<h3 className="text-lg font-bold mb-2">1. Deposit</h3>
											<p className="text-gray-300 text-sm">
												Users deposit their tokens into prize vaults. These
												deposits are represented by vault shares (ERC20 tokens).
											</p>
										</div>

										<div className="bg-[#2A0A0A]/80 backdrop-blur-sm rounded-lg p-5 border border-red-900/20">
											<h3 className="text-lg font-bold mb-2">
												2. Yield Generation
											</h3>
											<p className="text-gray-300 text-sm">
												The deposited funds are invested in yield-generating
												protocols to earn interest.
											</p>
										</div>

										<div className="bg-[#2A0A0A]/80 backdrop-blur-sm rounded-lg p-5 border border-red-900/20">
											<h3 className="text-lg font-bold mb-2">
												3. Prize Distribution
											</h3>
											<p className="text-gray-300 text-sm">
												The generated yield is collected and distributed as
												prizes through regular draws.
											</p>
										</div>

										<div className="bg-[#2A0A0A]/80 backdrop-blur-sm rounded-lg p-5 border border-red-900/20">
											<h3 className="text-lg font-bold mb-2">
												4. Withdraw Anytime
											</h3>
											<p className="text-gray-300 text-sm">
												Users can withdraw their original deposit at any time
												without penalties or fees.
											</p>
										</div>
									</div>

									<p className="text-gray-300">
										The probability of winning is proportional to the amount
										deposited, creating a fair system where larger depositors
										have higher chances of winning, but everyone has a chance.
									</p>
								</div>
							</section>

							<section id="contracts" className="mb-12">
								<h2 className="text-2xl font-bold mb-4 text-red-500">
									Smart Contracts
								</h2>
								<div className="prose prose-invert max-w-none">
									<p className="text-gray-300 mb-6">
										VaultQuest smart contracts are deployed on multiple
										blockchains. All contracts have been audited and verified.
									</p>

									<div className="space-y-4">
										<div className="bg-[#2A0A0A]/80 backdrop-blur-sm rounded-lg p-5 border border-red-900/20">
											<div className="flex justify-between items-start mb-2">
												<h3 className="font-bold">Prize Vault (Eth)</h3>
												<div className="flex items-center gap-2">
													<button
														className="text-gray-400 hover:text-white"
														title="Copy address"
													>
														<Copy size={14} />
													</button>
													<a
														href="#"
														className="text-gray-400 hover:text-white"
														title="View on explorer"
													>
														<ExternalLink size={14} />
													</a>
												</div>
											</div>
											<code className="text-sm text-gray-300 font-mono bg-[#1A0505]/70 p-2 rounded block">
												0x1234...5678
											</code>
										</div>

										<div className="bg-[#2A0A0A]/80 backdrop-blur-sm rounded-lg p-5 border border-red-900/20">
											<div className="flex justify-between items-start mb-2">
												<h3 className="font-bold">Prize Pool (Eth)</h3>
												<div className="flex items-center gap-2">
													<button
														className="text-gray-400 hover:text-white"
														title="Copy address"
													>
														<Copy size={14} />
													</button>
													<a
														href="#"
														className="text-gray-400 hover:text-white"
														title="View on explorer"
													>
														<ExternalLink size={14} />
													</a>
												</div>
											</div>
											<code className="text-sm text-gray-300 font-mono bg-[#1A0505]/70 p-2 rounded block">
												0x8765...4321
											</code>
										</div>

										<div className="bg-[#2A0A0A]/80 backdrop-blur-sm rounded-lg p-5 border border-red-900/20">
											<div className="flex justify-between items-start mb-2">
												<h3 className="font-bold">Prize Vault (Cosmos)</h3>
												<div className="flex items-center gap-2">
													<button
														className="text-gray-400 hover:text-white"
														title="Copy address"
													>
														<Copy size={14} />
													</button>
													<a
														href="#"
														className="text-gray-400 hover:text-white"
														title="View on explorer"
													>
														<ExternalLink size={14} />
													</a>
												</div>
											</div>
											<code className="text-sm text-gray-300 font-mono bg-[#1A0505]/70 p-2 rounded block">
												0xabcd...ef01
											</code>
										</div>
									</div>
								</div>
							</section>

							<section id="rest-api" className="mb-12">
								<h2 className="text-2xl font-bold mb-4 text-red-500">
									API Reference
								</h2>
								<div className="prose prose-invert max-w-none">
									<p className="text-gray-300 mb-6">
										VaultQuest provides a comprehensive API for developers to
										integrate with the protocol.
									</p>

									<div className="bg-[#2A0A0A]/80 backdrop-blur-sm rounded-lg p-5 border border-red-900/20 mb-6">
										<div className="flex items-center gap-2 mb-3">
											<span className="bg-green-600 text-white text-xs px-2 py-1 rounded">
												GET
											</span>
											<code className="text-gray-300 font-mono">
												/api/prizes
											</code>
										</div>
										<p className="text-gray-300 text-sm mb-3">
											Returns a list of all active prize pools.
										</p>
										<div className="bg-[#1A0505]/70 p-3 rounded">
											<pre className="text-sm text-gray-300 font-mono overflow-x-auto">
												{`// Response example
{
  "prizes": [
    {
      "id": "prize-123",
      "name": "Daily Prize",
      "amount": 1000,
      "token": "USDC",
      "drawTime": "2023-12-20T00:00:00Z"
    },
    ...
  ]
}`}
											</pre>
										</div>
									</div>

									<div className="bg-[#2A0A0A]/80 backdrop-blur-sm rounded-lg p-5 border border-red-900/20">
										<div className="flex items-center gap-2 mb-3">
											<span className="bg-blue-600 text-white text-xs px-2 py-1 rounded">
												POST
											</span>
											<code className="text-gray-300 font-mono">
												/api/deposit
											</code>
										</div>
										<p className="text-gray-300 text-sm mb-3">
											Initiates a deposit into a prize vault.
										</p>
										<div className="bg-[#1A0505]/70 p-3 rounded">
											<pre className="text-sm text-gray-300 font-mono overflow-x-auto">
												{`// Request body
{
  "vaultId": "vault-456",
  "amount": 100,
  "token": "USDC",
  "wallet": "0x1234...5678"
}`}
											</pre>
										</div>
									</div>
								</div>
							</section>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}
