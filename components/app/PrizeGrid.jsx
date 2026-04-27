import Link from "next/link";
import Image from "next/image";
import { Clock, Wallet, Trophy } from "lucide-react";

export default function PrizeGrid() {
  const prizes = [
    {
      id: 1,
      name: "Grand Prize",
      protocol: "Drip Wave",
      amount: 23087.0,
      token: "XLM",
      tokenAmount: 0.23,
      cadence: "Monthly",
      participants: 1247,
      nextDraw: "in 5 days",
    },
    {
      id: 2,
      name: "Weekly Prize",
      protocol: "Drip Wave",
      amount: 12500.0,
      token: "XLM",
      tokenAmount: 0.15,
      cadence: "Weekly",
      participants: 892,
      nextDraw: "in 2 days",
    },
    {
      id: 3,
      name: "Daily Prize",
      protocol: "Drip Wave",
      amount: 5000.0,
      token: "XLM",
      tokenAmount: 0.08,
      cadence: "Daily",
      participants: 456,
      nextDraw: "in 12 hours",
    },
    {
      id: 4,
      name: "Hourly Prize",
      protocol: "Drip Wave",
      amount: 1000.0,
      token: "XLM",
      tokenAmount: 0.02,
      cadence: "Hourly",
      participants: 234,
      nextDraw: "in 45 minutes",
    },
    {
      id: 5,
      name: "Community Prize",
      protocol: "Drip Wave",
      amount: 7500.0,
      token: "XLM",
      tokenAmount: 0.12,
      cadence: "Weekly",
      participants: 678,
      nextDraw: "in 4 days",
    },
    {
      id: 6,
      name: "Special Prize",
      protocol: "Drip Wave",
      amount: 15000.0,
      token: "XLM",
      tokenAmount: 0.18,
      cadence: "Monthly",
      participants: 1023,
      nextDraw: "in 8 days",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
      {prizes.map((prize) => (
        <Link
          key={prize.id}
          href={`/app/prize/${prize.id}`}
          className="bg-[#1A0808]/70 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-red-900/20 hover:border-red-500/50 transition-all shadow-lg"
        >
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className="flex items-center gap-2">
              <Image
                height={1000}
                width={1000}
                alt="stellar"
                src="/images/avax.png"
                className="w-8 h-8 md:w-10 md:h-10"
              />
              <div>
                <div className="font-medium text-sm md:text-base">{prize.name}</div>
                <div className="text-xs text-gray-400">{prize.protocol}</div>
              </div>
            </div>
            <div className="bg-red-900/20 text-red-500 px-2 py-1 rounded text-xs">
              {prize.cadence}
            </div>
          </div>
          <div className="text-xl md:text-2xl font-bold mb-1">
            $
            {prize.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-gray-400 text-xs md:text-sm mb-3 md:mb-4">+ {prize.tokenAmount} {prize.token}</div>
          <div className="space-y-2 mb-3 md:mb-4">
            <div className="flex justify-between items-center text-xs">
              <div className="text-gray-400 flex items-center gap-1">
                <Wallet size={12} /> {prize.participants}
              </div>
              <div className="text-gray-400 flex items-center gap-1">
                <Clock size={12} /> {prize.nextDraw}
              </div>
            </div>
          </div>
          <div className="text-red-500 text-xs md:text-sm hover:text-red-400 transition-colors">
            View Details
          </div>
        </Link>
      ))}
    </div>
  );
}
