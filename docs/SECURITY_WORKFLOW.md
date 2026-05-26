# Security contributor workflow

VaultQuest handles wallet, contract, backend, and deployment configuration. Run
the checks below before opening a PR that changes dependencies, environment
configuration, CI, deployment files, or authentication/payment code.

## Local checks

Install the secret scanner once:

```bash
brew install gitleaks
```

Run the blocking secret scan:

```bash
npm run security:secrets
```

Generate dependency audit output:

```bash
npm run security:audit:report
```

`security:audit` exits non-zero when moderate or higher advisories are present.
The repository currently keeps `security:audit:report` as the contributor
workflow so existing baseline advisories are visible without blocking unrelated
documentation or CI work. PRs that add or upgrade dependencies should summarize
the new audit output and explain whether any advisories are newly introduced.

## Manual security gate

Run these checks locally before requesting review:

- `npm run security:secrets` is the blocking secret scan.
- `npm run security:audit:report` prints the dependency audit baseline so
  maintainers can compare dependency-changing PRs against current advisories.

These commands are CI-ready and can be wired into a GitHub Actions workflow once
maintainers decide whether dependency advisories should be blocking or
report-only for the current baseline.

## False positives

Do not silence a finding by weakening a rule globally. Use this process:

1. Confirm the value is not a real credential, token, private key, mnemonic, or
   webhook secret.
2. Replace realistic-looking sample values with obvious placeholders such as
   `replace-with-walletconnect-project-id`.
3. If the value must remain, add a narrowly scoped allowlist entry in
   `.gitleaks.toml` and document why in the PR.
4. Rotate the credential immediately if a real secret was committed, even if
   the commit is later reverted.

## Environment examples

- Keep real values in `.env.local`, `.env`, or the deployment provider only.
- Commit only empty values, localhost development URLs, or obvious placeholders.
- Do not expose server-side secrets with `NEXT_PUBLIC_`.
- Add every new environment variable to `docs/env-inventory.md`.

## PR checklist

Before requesting review, include the commands you ran in the PR validation
section and note any dependency audit findings that need maintainer follow-up.
