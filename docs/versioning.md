# Versioning and changelog policy

`icalendar` uses a lightweight SemVer policy.

## Versioning rules

- **PATCH**: bug fixes, test-only changes, docs-only clarifications, packaging fixes that do not change the CLI contract
- **MINOR**: new backward-compatible commands, flags, output fields, or integration guides
- **MAJOR**: breaking changes to command names, required flags, JSON output shape, environment contract, or packaging contract

## Changelog format

Each release should record:

- Added
- Changed
- Fixed
- Removed
- Security

## Release process

Publishing is a **manual version bump + manual git tag push** — no
changesets, semantic-release, or release-please. See
[`release-checklist.md`](release-checklist.md) for the exact steps.

Use `npm version patch --no-git-tag-version` (or `minor` / `major`) to keep
`package.json` and `package-lock.json` in sync, add a dated section to
`CHANGELOG.md`, run `npm run verify`, tag `vX.Y.Z`, push the tag —
`.github/workflows/release.yml` then verifies again, builds the package
tarball exactly once with `npm pack`, publishes that same tarball to npm
with provenance (via Trusted Publishing — no token involved), and attaches
it to a GitHub release. Building the tarball once and reusing it for both
destinations guarantees `npm install @cayde-6/icalendar` and the GitHub
release download are byte-identical.

The release workflow also:

- fails fast if the pushed tag (without its `v`) doesn't match
  `package.json`'s `version`, before installing anything
- checks whether that version is already on npm
  (`.github/scripts/npm-published.mjs`) and skips `npm publish` instead of
  failing if its integrity matches the verified tarball; registry errors
  or different package contents stop the release
- creates the GitHub release or refreshes its tarball attachment if it
  already exists, allowing retries after transient failures without a new tag

## Development dependency overrides

`test-exclude@8` still requests vulnerable versions of `glob` and
`minimatch`. Scoped overrides select patched `glob@14` and `minimatch@11`
for the coverage tool. `tsup@8` requests `esbuild@0.27`, so its override
selects patched `esbuild@0.28`; upgrading to `tsup@9` would drop Node 20
support. Remove these overrides when upstream supports the patched versions.
`npm run verify` and the packaged CLI smoke test validate these combinations;
CI also runs `npm audit` on Node 24.

Development uses Node 20.19+ or a current Node 22/24/26 release, as required
by `c8@12`. The published CLI continues to support Node 20+. `c8@12` also
avoids the older coverage runner's `yargs` loading error on Node 26.

## CLI compatibility promise

Treat these as stability-sensitive:

- command names
- required flags
- JSON output keys
- env variable names
- behavior of `--help` and `--version`

If any of those break, it is at least a **major** change unless a compatibility path is preserved.
