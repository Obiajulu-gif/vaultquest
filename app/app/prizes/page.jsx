import Link from "next/link";
import PublicStatsBar from "@/components/app/PublicStatsBar";
import RecentWinners from "@/components/app/RecentWinners";

export default function PrizesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-vault-text">Prizes</h1>
      <PublicStatsBar />
      <RecentWinners />
      <p className="text-vault-muted">Browse active prize rounds and past winners.</p>
      <Link href="/app" className="vq-btn-ghost inline-flex">
        ← Back to dashboard
      </Link>
    </div>
  );
}
