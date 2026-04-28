import Image from "next/image";
import { ExternalLink } from "lucide-react";

export default function PrizeDetails() {
	return (
		<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
			<div className="bg-[#1A0808]/70 backdrop-blur-sm rounded-xl p-6 border border-red-900/20 shadow-lg">
				<div className="flex items-center gap-2 mb-4">
					<Image src="/images/avax.png" height={20} width={20} alt="stellar" />
					<span className="text-sm text-gray-400">Last 24h Deposits</span>
				</div>
				<div className="text-3xl font-bold">
					$ 4,330<span className="text-sm">.00</span>
				</div>
			</div>

			<div className="bg-[#1A0808]/70 backdrop-blur-sm rounded-xl p-6 border border-red-900/20 shadow-lg">
				<div className="flex items-center gap-2 mb-4">
					<span className="text-sm text-gray-400">Total Deposited</span>
				</div>
				<div className="text-3xl font-bold">$2.3M</div>
				<div className="text-sm text-gray-400 mt-1">$2,324,058 in TVL</div>
			</div>

			<div className="bg-[#1A0808]/70 backdrop-blur-sm rounded-xl p-6 border border-red-900/20 shadow-lg">
				<div className="flex items-center gap-2 mb-4">
					<span className="text-sm text-gray-400">Protocol</span>
				</div>
				<div className="text-3xl font-bold">Drip Wave</div>
				<div className="text-sm text-gray-400 mt-1 flex items-center gap-1">
					<a
						href="https://dripwave.io"
						target="_blank"
						rel="noopener noreferrer"
						className="hover:text-white transition-colors flex items-center gap-1"
					>
						dripwave.io
						<ExternalLink className="h-3 w-3" />
					</a>
				</div>
				<div className="text-sm text-gray-400 mt-2">Stellar</div>
			</div>
		</div>
	);
}
