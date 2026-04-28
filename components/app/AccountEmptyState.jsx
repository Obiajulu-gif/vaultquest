import { Wallet, Droplets, Clock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function NoWalletState() {
  return (
    <div className="bg-[#1A0808]/50 backdrop-blur-sm border border-blue-900/20 p-12 text-center">
      <Wallet className="w-16 h-16 text-gray-500 mx-auto mb-4" />
      <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
      <p className="text-gray-400 mb-6">Connect your wallet to view your account details and positions</p>
    </div>
  );
}

export function NoPositionsState() {
  return (
    <div className="text-center py-8">
      <Droplets className="w-12 h-12 text-gray-500 mx-auto mb-4" />
      <h3 className="text-lg font-medium mb-2">No Positions Yet</h3>
      <p className="text-gray-400 mb-6">Start by joining a savings pool to earn interest and win prizes</p>
      <Link href="/app/pools">
        <Button className="bg-blue-600 hover:bg-blue-700">Browse Pools</Button>
      </Link>
    </div>
  );
}

export function NoTransactionsState() {
  return (
    <div className="text-center py-8">
      <Clock className="w-12 h-12 text-gray-500 mx-auto mb-4" />
      <h3 className="text-lg font-medium mb-2">No Transactions Yet</h3>
      <p className="text-gray-400">Your transaction history will appear here</p>
    </div>
  );
}
