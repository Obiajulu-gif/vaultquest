"use client";

import { Component } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

function logError(error, info) {
  if (typeof window !== "undefined" && window.__sentryReady) {
    try {
      const Sentry = require("@sentry/nextjs");
      Sentry.captureException(error, { extra: { componentStack: info?.componentStack } });
      return;
    } catch {
      // Sentry not available
    }
  }
  console.error("[ErrorBoundary]", error, info?.componentStack);
}

function FallbackUI({ error, onReset }) {
  return (
    <div className="flex min-h-[400px] w-full flex-col items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center backdrop-blur-md">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-red-500/30 bg-red-500/20 text-red-400">
        <AlertTriangle size={32} />
      </div>
      <h2 className="mb-2 text-2xl font-bold text-vault-text">Something went wrong</h2>
      <p className="mb-8 max-w-md text-vault-muted">
        An unexpected error occurred. Our team has been notified. You can try
        reloading this section or return home.
      </p>

      <div className="flex gap-4">
        {onReset && (
          <button
            onClick={onReset}
            className="flex items-center gap-2 rounded-lg bg-red-500/20 px-6 py-3 font-semibold text-red-400 transition-colors hover:bg-red-500/30"
          >
            <RefreshCw size={18} />
            Try again
          </button>
        )}
        <button
          onClick={() => (window.location.href = "/")}
          className="flex items-center gap-2 rounded-lg border border-vault-border bg-vault-surface px-6 py-3 font-semibold text-vault-text transition-colors hover:bg-white/5"
        >
          <Home size={18} />
          Return home
        </button>
      </div>

      {process.env.NODE_ENV === "development" && error && (
        <div className="mt-8 max-w-2xl text-left">
          <p className="mb-2 text-sm font-semibold text-red-400">Developer details:</p>
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

export default class RouteErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
    this.reset = this.reset.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    logError(error, info);
  }

  reset() {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }
      return <FallbackUI error={this.state.error} onReset={this.reset} />;
    }
    return this.props.children;
  }
}
