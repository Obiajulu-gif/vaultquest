# Environment Variable Inventory

Reference for configuration used by the VaultQuest frontend.

## Classification

| Class | Prefix / location | Exposed to browser? | Committed? |
|-------|-------------------|---------------------|------------|
| Public frontend config | `NEXT_PUBLIC_*` in `.env.local` | Yes — inlined into the browser bundle at build time | No — `.env.local` is git-ignored |

Anything without the `NEXT_PUBLIC_` prefix is server-only and must never be
referenced in frontend code. If it has `NEXT_PUBLIC_`, assume anyone who loads
the site can read it.

## Frontend variables

Copy `.env.example` to `.env.local` before running `npm run dev`.

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | Yes | WalletConnect / RainbowKit project ID. Get one free at [cloud.walletconnect.com](https://cloud.walletconnect.com). |

Validation lives in `lib/env.ts` (Zod). The app throws at startup with a clear
error message if the variable is missing or is still the literal placeholder
`YOUR_PROJECT_ID`.

## Per-environment setup

| Environment | Setup |
|-------------|-------|
| Local dev | Copy `.env.example` → `.env.local`, fill in your WalletConnect project ID. |
| CI builds | `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is provided by `.github/workflows/frontend.yml` from a repo secret (falls back to a non-placeholder string so the build passes). |
| Preview / production | Set `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` as a secret in the hosting provider (Vercel, etc.). Use a separate WalletConnect project per environment if you want isolated analytics. |

## CI placeholder guard

`.github/workflows/config-guard.yml` fails any pull request that commits the
literal string `YOUR_PROJECT_ID` in a JS/TS source file. This prevents the old
placeholder from silently sneaking back into the codebase.

