# Contributing

Thanks for helping improve VaultQuest. Keep PRs scoped to one issue and link the
issue in the PR body.

## Before opening a PR

Run the checks that match your change:

```bash
npm run build
npm run security:secrets
npm run security:audit:report
```

Backend-only changes should also run:

```bash
npm --prefix backend test
npm --prefix backend run lint
```

Contract changes should also run the commands in `contracts/README.md`.

## Security checks

Follow `docs/SECURITY_WORKFLOW.md` for dependency audits, secret scanning,
environment placeholders, and false-positive handling.

## PR evidence

Fill out `.github/pull_request_template.md`. For UI changes, include screenshots
or a short demo. For configuration, dependency, or CI changes, include the audit
or secret-scan output you reviewed.
