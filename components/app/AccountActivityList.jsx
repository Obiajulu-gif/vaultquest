import { Clock, CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react";
import { TRANSACTION_STATUS_LABELS } from "@/lib/types";

function getTransactionIcon(status) {
  switch (status) {
    case 'confirmed':
      return <CheckCircle className="w-4 h-4 text-green-400" />;
    case 'failed':
    case 'reverted':
      return <XCircle className="w-4 h-4 text-red-400" />;
    case 'pending':
    case 'submitted':
      return <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />;
    default:
      return <AlertCircle className="w-4 h-4 text-gray-400" />;
  }
}

function getTransactionColor(status) {
  switch (status) {
    case 'confirmed':
      return 'text-green-400';
    case 'failed':
    case 'reverted':
      return 'text-red-400';
    case 'pending':
    case 'submitted':
      return 'text-yellow-400';
    default:
      return 'text-gray-400';
  }
}

export default function AccountActivityList({ transactions, loading }) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="animate-spin w-6 h-6 mr-2" />
        <span>Loading transactions...</span>
      </div>
    );
  }
  if (!transactions.length) {
    return (
      <div className="text-center py-8">
        <Clock className="w-12 h-12 text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No Transactions Yet</h3>
        <p className="text-gray-400">Your transaction history will appear here</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {transactions.map((tx) => (
        <div key={tx.id} className="bg-[#1A0808]/70 rounded-lg p-4 border border-blue-900/20">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              {getTransactionIcon(tx.status)}
              <div>
                <div className="font-medium capitalize">{tx.type.replace('_', ' ')}</div>
                <div className="text-sm text-gray-400">{new Date(tx.timestamp).toLocaleString()}</div>
              </div>
            </div>
            <div className="text-right">
              <div className={`font-medium ${getTransactionColor(tx.status)}`}>{TRANSACTION_STATUS_LABELS[tx.status]}</div>
              {tx.amount && <div className="text-sm text-gray-400">{tx.amount}</div>}
            </div>
          </div>
          {tx.txHash && (
            <div className="mt-2 text-xs text-gray-500">TX: {tx.txHash.slice(0, 10)}...{tx.txHash.slice(-8)}</div>
          )}
        </div>
      ))}
    </div>
  );
}
