import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Droplets, CheckCircle } from "lucide-react";
import { NoPositionsState } from "./AccountEmptyState";

export default function AccountPositionsList({ userPositions, loading }) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <svg className="animate-spin w-6 h-6 mr-2 text-blue-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
        </svg>
        <span>Loading positions...</span>
      </div>
    );
  }
  if (!userPositions.length) {
    return <NoPositionsState />;
  }
  return (
    <div className="space-y-4">
      {userPositions.map((position) => (
        <div key={position.poolId} className="bg-[#1A0808]/70 rounded-lg p-4 border border-blue-900/20">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h4 className="font-semibold">{position.poolName}</h4>
              <p className="text-sm text-gray-400">{position.tokenSymbol}</p>
            </div>
            {position.isEligibleForPrize && (
              <div className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded text-xs">Prize Eligible</div>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Principal:</span>
              <div className="font-medium">{parseFloat(position.principalAmount).toFixed(4)} {position.tokenSymbol}</div>
            </div>
            <div>
              <span className="text-gray-400">Interest:</span>
              <div className="font-medium text-green-400">{parseFloat(position.interestEarned).toFixed(4)} {position.tokenSymbol}</div>
            </div>
            <div>
              <span className="text-gray-400">Total:</span>
              <div className="font-medium">{parseFloat(position.totalAmount).toFixed(4)} {position.tokenSymbol}</div>
            </div>
            <div>
              <span className="text-gray-400">Deposited:</span>
              <div className="font-medium">{new Date(position.depositTimestamp).toLocaleDateString()}</div>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Link href={`/app/pools/${position.poolId}`}>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">View Pool</Button>
            </Link>
            {position.hasClaimed && (
              <div className="bg-green-900/20 text-green-400 px-3 py-1 rounded text-sm flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Claimed
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
