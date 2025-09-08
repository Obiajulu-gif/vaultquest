import { EthIcon } from "@/components/icons/EthIcon";

export default function UserDepositsList({ deposits = [], vaults = [] }) {
	// Map vault IDs to vault objects for easy lookup
	const vaultMap = vaults.reduce((acc, vault) => {
		acc[vault.id] = vault;
		return acc;
	}, {});

	return (
		<div className="overflow-x-auto">
			<table className="w-full">
				<thead>
					<tr className="text-gray-400 text-sm border-b border-red-900/10">
						<th className="text-left pb-4 font-normal">Vault</th>
						<th className="text-left pb-4 font-normal">Address</th>
						<th className="text-left pb-4 font-normal">Amount</th>
						<th className="text-left pb-4 font-normal">Date</th>
					</tr>
				</thead>
				<tbody>
					{deposits.length > 0 ? (
						deposits.map((deposit, i) => (
							<tr key={i} className="border-b border-red-900/10">
								<td className="py-4">
									<div className="flex items-center gap-2">
										<div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
											<EthIcon className="w-5 h-5" />
										</div>
										<span>
											{vaultMap[deposit.vaultId]?.name || "Unknown Vault"}
										</span>
									</div>
								</td>
								<td className="py-4 font-mono">{deposit.address}</td>
								<td className="py-4">${deposit.amount.toLocaleString()}</td>
								<td className="py-4">{deposit.date}</td>
							</tr>
						))
					) : (
						<tr>
							<td colSpan={4} className="py-8 text-center text-gray-400">
								No deposits found
							</td>
						</tr>
					)}
				</tbody>
			</table>
		</div>
	);
}
