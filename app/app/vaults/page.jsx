import Link from "next/link";

export default function VaultsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-vault-text">Vaults</h1>
      <p className="text-vault-muted">Manage your pool positions and drip deposits.</p>
      <Link href="/app" className="vq-btn-ghost inline-flex">
        ← Back to dashboard
      </Link>
    </div>
  );
}
