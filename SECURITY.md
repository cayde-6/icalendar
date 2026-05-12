# Security Policy

## Supported versions

Until a stricter policy is defined, only the latest published release receives fixes.

## Reporting a vulnerability

Please do **not** open a public issue for security problems.

Instead, report it privately via GitHub security advisories or by contacting the maintainer directly through GitHub.

When reporting, include:

- affected version
- reproduction steps
- impact assessment
- whether credentials, attendee data, or calendar URLs may be exposed

## Secrets and privacy expectations

- never commit real `.env` files
- use app-specific passwords for iCloud / Apple Calendar
- redact CalDAV usernames, passwords, calendar URLs, and attendee emails in logs and screenshots
