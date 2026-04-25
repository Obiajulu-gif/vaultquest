#!/usr/bin/env bash
# Cost-measurement runner for #27.
#
# Runs the lifecycle harness with Soroban's built-in cost reporting and
# prints a one-block-per-test summary. Intended to be re-run any time
# storage layout, event payloads, or hot-path code changes — paste the
# resulting numbers into `docs/CONTRACT_COSTS.md` and explain the delta
# in "Recent changes".
#
# Usage:
#   ./scripts/measure_costs.sh           # human-readable summary
#   ./scripts/measure_costs.sh --raw     # full cargo output (for diffs)

set -euo pipefail

cd "$(dirname "$0")/.."

if [[ "${1:-}" == "--raw" ]]; then
    exec cargo test --package drip-pool -- --nocapture --test-threads=1
fi

# When the contract grows, switch this to:
#   cargo test ... -- -Z unstable-options --report-time --nocapture
# combined with the soroban-sdk `budget()` instrumentation, which prints
# CPU instructions and memory bytes per test. For now we emit the raw
# pass/fail summary so the script always exits 0/1 in CI.

cargo test --package drip-pool --quiet 2>&1 | tail -20

cat <<'EOF'

# ── cost reporting ─────────────────────────────────────────────────────
# Re-run with --raw to see the full per-test trace. Once the real
# contract lands the script will parse `env.budget()` snapshots and
# print:
#   create(admin)              cpu=…  mem=…  reads=…  writes=…
#   drip(who, amount)          cpu=…  mem=…  reads=…  writes=…
#   ...
# Track the deltas in docs/CONTRACT_COSTS.md.
EOF
