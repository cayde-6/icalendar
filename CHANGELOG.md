# Changelog

All notable changes to this project should be documented in this file.

The format is inspired by Keep a Changelog, with lightweight SemVer rules documented in [`docs/versioning.md`](./docs/versioning.md).

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
