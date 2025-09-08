import Link from "next/link";
import Image from "next/image";

export default function PrizeGrid() {
  const prizes = [
    {
      id: 1,
      name: "Grand Prize",
      amount: 23087.0,
      eth: 0.23,
    },
    {
      id: 2,
      name: "Weekly Prize",
      amount: 12500.0,
      eth: 0.15,
    },
    {
      id: 3,
      name: "Daily Prize",
      amount: 5000.0,
      eth: 0.08,
    },
    {
      id: 4,
      name: "Hourly Prize",
      amount: 1000.0,
      eth: 0.02,
    },
    {
      id: 5,
      name: "Community Prize",
      amount: 7500.0,
      eth: 0.12,
    },
    {
      id: 6,
      name: "Special Prize",
      amount: 15000.0,
      eth: 0.18,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
      {prizes.map((prize) => (
        <Link
          key={prize.id}
          href={`/app/prize/${prize.id}`}
          className="bg-[#1A0808]/70 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-red-900/20 hover:border-red-500/50 transition-colors shadow-lg"
        >
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <span className="text-gray-400 text-sm md:text-base">{prize.name}</span>
            <Image
              height={100}
              width={100}
              alt="eth"
              src="/images/avax.png"
              className="w-5 h-5 md:w-6 md:h-6"
            />
          </div>
          <div className="text-xl md:text-2xl font-bold mb-1">
            $
            {prize.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-gray-400 text-xs md:text-sm mb-3 md:mb-4">+ {prize.eth} AVAX</div>
          <div className="text-red-500 text-xs md:text-sm hover:text-red-400 transition-colors">
            Click to view
          </div>
        </Link>
      ))}
    </div>
  );
}
