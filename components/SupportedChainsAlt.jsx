import Image from "next/image";

export default function SupportedChainsAlt() {
	// Blockchain data with logos and names
	const blockchains = [
		{
			name: "Eth",
			logo: "/placeholder.svg?height=40&width=40",
			color: "bg-gradient-to-r from-purple-500 to-green-500",
		},
		{
			name: "Cosmos",
			logo: "/placeholder.svg?height=40&width=40",
			color: "bg-gradient-to-r from-blue-500 to-indigo-500",
		},
		{
			name: "Polygon",
			logo: "/placeholder.svg?height=40&width=40",
			color: "bg-gradient-to-r from-purple-600 to-purple-400",
		},
		{
			name: "Starknet",
			logo: "/placeholder.svg?height=40&width=40",
			color: "bg-gradient-to-r from-blue-600 to-blue-400",
		},
		{
			name: "Arbitrum",
			logo: "/placeholder.svg?height=40&width=40",
			color: "bg-gradient-to-r from-blue-700 to-indigo-600",
		},
		{
			name: "Optimism",
			logo: "/placeholder.svg?height=40&width=40",
			color: "bg-gradient-to-r from-red-500 to-red-600",
		},
		{
			name: "Avalanche",
			logo: "/placeholder.svg?height=40&width=40",
			color: "bg-gradient-to-r from-red-600 to-red-500",
		},
		{
			name: "Base",
			logo: "/placeholder.svg?height=40&width=40",
			color: "bg-gradient-to-r from-blue-500 to-blue-600",
		},
	];

	return (
		<div className="py-8 overflow-hidden bg-[#1A0808]/30 backdrop-blur-sm border-y border-red-900/20">
			<div className="container mx-auto px-4 mb-4">
				<h3 className="text-center text-xl font-bold">Supported Blockchains</h3>
			</div>

			<div className="relative overflow-hidden">
				<div className="marquee-mask">
					<div className="marquee">
						{/* First set of items */}
						{blockchains.map((blockchain, index) => (
							<div
								key={`${blockchain.name}-${index}`}
								className="marquee-item flex flex-col items-center justify-center bg-[#1A0808]/70 backdrop-blur-sm rounded-xl p-4 border border-red-900/20 shadow-lg min-w-[160px]"
							>
								<div
									className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${blockchain.color}`}
								>
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
								className="marquee-item flex flex-col items-center justify-center bg-[#1A0808]/70 backdrop-blur-sm rounded-xl p-4 border border-red-900/20 shadow-lg min-w-[160px]"
							>
								<div
									className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${blockchain.color}`}
								>
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
		</div>
	);
}
