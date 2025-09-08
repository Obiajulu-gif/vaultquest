"use client";

import Image from "next/image";

export default function RecentDeposits({ deposits = [] }) {
  return (
    <div>
      <h3 className="text-xl font-bold mb-4">Recent Deposits</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-gray-400 text-sm border-b border-red-900/10">
              <th className="text-left pb-4 font-normal">Vault</th>
              <th className="text-left pb-4 font-normal">Address</th>
              <th className="text-left pb-4 font-normal">Amount</th>
            </tr>
          </thead>
          <tbody>
            {deposits.length > 0 ? (
              deposits.map((deposit, i) => (
                <tr key={`${deposit.vaultId}-${deposit.address}-${i}`} className="border-b border-red-900/10">
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      <Image src="/images/avax.png" height={1000} width={1000} alt="avax logo" className="w-6 h-6" />
                      <span>{deposit.vaultName}</span>
                    </div>
                  </td>
                  <td className="py-4 font-mono">{deposit.address}</td>
                  <td className="py-4">{deposit.amount.toFixed(4)} {deposit.amount !== 0 ? "AVAX" : ""}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="py-6 text-center text-gray-400">No deposits found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
