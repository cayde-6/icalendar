# Changelog

All notable changes to this project should be documented in this file.

The format is inspired by Keep a Changelog, with lightweight SemVer rules documented in [`docs/versioning.md`](./docs/versioning.md).

## [Unreleased]

### Added
- `CONTRIBUTING.md` with contributor workflow and architectural guardrails
- `SECURITY.md` with private vulnerability reporting guidance and secret-handling expectations

### Changed
- removed self-referential internal placeholders from public docs in favor of generic examples
- removed the large hero asset from the published npm package to keep installs leaner
- cleaned README and release docs so automation guidance matches the workflows that actually exist

## [0.1.5] - 2026-05-07

### Fixed
- `events delete --json <url>` now works correctly when `--json` appears before the positional event URL

## [0.1.4] - 2026-05-07

### Fixed
- restored a real executable Node shebang in the published CLI entrypoint so global npm installs can run `icalendar` directly
- made `--version` read the packaged version instead of a stale hardcoded value

## [0.1.3] - 2026-05-07

### Changed
- replaced the GitHub Release action step with `gh release create` to remove the deprecated Node 20 action runtime warning
- expanded automated coverage around runtime routing, ICS generation/parsing, renderers, and time-range helpers

### Fixed
- release automation no longer depends on `softprops/action-gh-release`

## [0.1.2] - 2026-05-07

### Fixed
- aligned GitHub Actions npm Trusted Publishing setup with npm docs by adding `registry-url` and modern action/runtime versions

## [0.1.1] - 2026-05-07

### Changed
- switched release automation from token-based npm publishing to npm Trusted Publishing via GitHub OIDC
- refreshed README badges and install/release guidance for the public npm package

### Fixed
- removed README internal automation details that do not belong in the public-facing docs

## [0.1.0] - 2026-05-06

### Added
- layered CLI architecture aligned with `threads-cli`
- CalDAV event create/update/delete flows
- attendee invite support for create and update
- organizer common name support through `CALDAV_ORGANIZER_NAME`
- JSON and text renderers
- CI workflow, release workflow, and optional live smoke workflow scaffold
- agent integration, architecture, release, and versioning docs
- hero and demo assets for GitHub presentation

### Changed
- CalDAV gateway split into smaller infrastructure modules
- README rewritten for public and agent-facing usage
- packaging hardened with exports, files, engines, verify, and coverage scripts

### Fixed
- runtime-safe `tsdav` integration for live execution
- `--help` and `--version` behavior without requiring CalDAV credentials
