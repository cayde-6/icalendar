# AGENTS.md — icalendar

## Purpose

TypeScript CalDAV / iCalendar tooling.

## Security rules for every agent

1. **Never commit credentials**
   - Do not commit `.env`, app passwords, CalDAV usernames/passwords, session exports, or private calendar URLs.
   - Keep only sanitized values in `.env.example`.

2. **Calendar data is sensitive**
   - Treat event titles, descriptions, locations, attendees, meeting links, and invite metadata as private user data.
   - Never paste real calendar content into tests, docs, commits, or public issues.

3. **Use sanitized fixtures only**
   - If tests need ICS or CalDAV samples, create synthetic data.
   - Remove real names, emails, URLs, tokens, and event text.

4. **No credential logging**
   - Do not print `CALDAV_PASSWORD`, Authorization headers, Basic auth payloads, or full request dumps.
   - Prefer logging hostname, calendar count, time range, and sanitized error summaries.

5. **Protect local config**
   - `.env` must stay untracked.
   - If new config keys are introduced, update `.env.example` with placeholders, not real values.

6. **Before commit**
   - Review staged diff for secrets or personal calendar data.
   - Search for `PASSWORD`, `Authorization`, `BEGIN:VCALENDAR`, attendee emails, and meeting URLs if relevant.

## Repo-specific guardrails

- Default to read-only work unless the task explicitly requires create/update/delete flows.
- Do not add automatic sync, writeback, or destructive calendar mutations without clear confirmation and safeguards.
- Keep sample output short and sanitized.

## Safe file conventions

- Tracked: `.env.example`, synthetic ICS examples, redacted docs.
- Untracked only: `.env`, local exports, downloaded calendars, debug dumps.

## If you discover a leak

1. Remove the secret or private calendar data from the working tree.
2. Update ignore/example files if needed.
3. If it was committed, clean history before considering the repo safe.
4. Tell the human which credentials or accounts need rotation.

## Minimal verification before finishing

```bash
npm run check
npm run build
```

If a live CalDAV test would require real credentials, do not run it unless explicitly asked.
