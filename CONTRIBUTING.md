# Contributing

Thanks for taking a look at `icalendar`.

## Before opening a PR

1. fork the repo
2. create a focused branch
3. run:

```bash
npm ci
npm run verify
```

## Design rules

- keep CLI parsing in `src/app/commands/*`
- keep orchestration in use-cases
- keep CalDAV/provider code in `src/infra/*`
- keep output formatting in `src/presentation/*`
- prefer stable JSON output for machine consumers

## Pull request expectations

- keep changes narrow and explain the user-facing impact
- add or update tests for touched behavior
- update `README.md` / docs if the CLI contract changed
- update `CHANGELOG.md` for user-visible changes

## Reporting bugs

Please include:

- command you ran
- expected behavior
- actual behavior
- environment details (Node version, provider, redacted config shape)

Do not include secrets, CalDAV passwords, or private calendar URLs in issues.
