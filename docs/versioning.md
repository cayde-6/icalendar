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

## Release checklist

1. Update version in `package.json`
2. Add a dated section in `CHANGELOG.md`
3. Run `npm run verify`
4. If live credentials exist, trigger `Smoke iCloud CalDAV`
5. Tag the release as `vX.Y.Z`
6. Push the tag
7. If npm publishing is enabled, publish `@cayde-6/icalendar` with public access

## CLI compatibility promise

Treat these as stability-sensitive:

- command names
- required flags
- JSON output keys
- env variable names
- behavior of `--help` and `--version`

If any of those break, it is at least a **major** change unless a compatibility path is preserved.
