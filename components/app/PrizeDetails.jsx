import { EthIcon } from "@/components/icons/EthIcon";

export default function PrizeDetails() {
	return (
		<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
			<div className="bg-[#1A0808] rounded-xl p-6 border border-red-900/20">
				<div className="flex items-center gap-2 mb-4">
					<EthIcon className="w-5 h-5" />
					<span className="text-sm text-gray-400">Last 24h Deposits</span>
				</div>
				<div className="text-3xl font-bold">
					$ 4,330<span className="text-sm">.00</span>
				</div>
			</div>

			<div className="bg-[#1A0808] rounded-xl p-6 border border-red-900/20">
				<div className="flex items-center gap-2 mb-4">
					<span className="text-sm text-gray-400">Total Deposited</span>
				</div>
				<div className="text-3xl font-bold">$2.3M</div>
				<div className="text-sm text-gray-400 mt-1">$2,324,058 in TVL</div>
			</div>

			<div className="bg-[#1A0808] rounded-xl p-6 border border-red-900/20">
				<div className="flex items-center gap-2 mb-4">
					<span className="text-sm text-gray-400">Protocol</span>
				</div>
				<div className="text-3xl font-bold">Cosmos</div>
				<div className="text-sm text-gray-400 mt-1">https://cosmos.network/</div>
			</div>
		</div>
	);
}
