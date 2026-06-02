"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import PublicStatsBar from "@/components/app/PublicStatsBar";
import RecentWinners from "@/components/app/RecentWinners";
import TicketDistributionGrid from "@/components/app/TicketDistributionGrid";

// Mock ticket data - replace with actual API call
const generateMockTickets = (count) => {
  return Array.from({ length: count }, (_, i) => ({
    ticketNumber: 10000 + i,
    ownerAddress: i % 10 === 0
      ? "0xYourAddress1234567890abcdef1234567890"
      : `0x${Math.random().toString(16).substr(2, 40)}`,
    winProbability: Math.random() * 0.001,
  }));
};

export default function PrizesPage() {
  const { address } = useAccount();
  const mockTickets = generateMockTickets(1500);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-vault-text">Prizes</h1>
      <PublicStatsBar />
      <RecentWinners />
      <TicketDistributionGrid
        tickets={mockTickets}
        userAddress={address}
        onTicketClick={(ticket) => console.log("Clicked ticket:", ticket)}
      />
      <p className="text-vault-muted">Browse active prize rounds and past winners.</p>
      <Link href="/app" className="vq-btn-ghost inline-flex">
        ← Back to dashboard
      </Link>
    </div>
  );
}
