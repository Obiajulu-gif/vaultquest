"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

function reportError(error) {
  if (typeof window !== "undefined") {
    try {
      const Sentry = require("@sentry/nextjs");
      Sentry.captureException(error);
      return;
    } catch {
      // Sentry not installed
    }
  }
  console.error("[app/error]", error);
}

export default function ErrorBoundary({ error, reset }) {
  useEffect(() => {
    reportError(error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] w-full flex-col items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center backdrop-blur-md">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
        <AlertTriangle size={32} />
      </div>
      <h2 className="mb-2 text-2xl font-bold text-vault-text">Something went wrong</h2>
      <p className="mb-8 max-w-md text-vault-muted">
        We encountered an unexpected error while loading this section. Our team has been notified. 
        You can try reloading the view or contact support if the issue persists.
      </p>
      
      <div className="flex gap-4">
        <button
          onClick={() => reset()}
          className="flex items-center gap-2 rounded-lg bg-red-500/20 px-6 py-3 font-semibold text-red-400 transition-colors hover:bg-red-500/30"
        >
          <RefreshCw size={18} />
          Try Again
        </button>
        <button
          onClick={() => window.location.href = '/'}
          className="flex items-center gap-2 rounded-lg border border-vault-border bg-vault-surface px-6 py-3 font-semibold text-vault-text transition-colors hover:bg-white/5"
        >
          Return Home
        </button>
      </div>

      {process.env.NODE_ENV === "development" && (
        <div className="mt-8 max-w-2xl text-left">
          <p className="mb-2 text-sm font-semibold text-red-400">Developer Details:</p>
          <pre className="overflow-auto rounded-lg bg-black/50 p-4 text-xs text-red-300">
            {error.message}
            {"\n"}
            {error.stack}
          </pre>
        </div>
      )}
    </div>
  );
}
