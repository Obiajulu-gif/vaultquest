import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Wallet, TrendingUp, Droplets, Trophy } from "lucide-react";

export default function AccountSummaryCards({ totalDeposits, totalInterestEarned, userPositions }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <Card className="bg-[#1A0808]/70 backdrop-blur-sm border border-blue-900/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
            <Wallet className="w-4 h-4 mr-2" />
            Total Deposits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${totalDeposits.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500 mt-1">Across all pools</div>
        </CardContent>
      </Card>
      <Card className="bg-[#1A0808]/70 backdrop-blur-sm border border-blue-900/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
            <TrendingUp className="w-4 h-4 mr-2" />
            Interest Earned
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-400">
            ${totalInterestEarned.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500 mt-1">Total earnings</div>
        </CardContent>
      </Card>
      <Card className="bg-[#1A0808]/70 backdrop-blur-sm border border-blue-900/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
            <Droplets className="w-4 h-4 mr-2" />
            Active Positions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{userPositions.length}</div>
          <div className="text-xs text-gray-500 mt-1">Current pools</div>
        </CardContent>
      </Card>
      <Card className="bg-[#1A0808]/70 backdrop-blur-sm border border-blue-900/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
            <Trophy className="w-4 h-4 mr-2" />
            Prize Eligibility
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-400">
            {userPositions.filter(pos => pos.isEligibleForPrize).length}
          </div>
          <div className="text-xs text-gray-500 mt-1">Eligible pools</div>
        </CardContent>
      </Card>
    </div>
  );
}
