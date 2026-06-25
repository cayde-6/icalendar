# Automation integration guide

This page is for automations, scripts, agents, and other repos that want to **use `icalendar` as a dependable CLI building block**.

## What you get

`icalendar` is a small CalDAV/iCalendar command surface with stable behavior:

- `calendars list`
- `events list`
- `events create`
- `events update`
- `events delete`

For machine consumers, pass `--json` whenever possible.

## Install flow

### From npm (recommended)

```bash
npm install -g @cayde-6/icalendar
```

### From source

```bash
git clone https://github.com/cayde-6/icalendar.git
cd icalendar
npm install
npm run build
```

Then configure your environment:

```bash
cp .env.example .env
```

## Required env

```env
CALDAV_SERVER_URL=https://caldav.icloud.com/
CALDAV_USERNAME=your-icloud-address@example.com
CALDAV_PASSWORD=your-app-specific-password
```

## Recommended env

```env
CALDAV_CALENDAR_NAME=Example Calendar
CALDAV_ORGANIZER_NAME=Calendar Bot
CALDAV_EXPAND_RECURRING=true
```

## Consumption patterns

### 1. Human-facing CLI

```bash
icalendar calendars list
icalendar events list
```

### 2. JSON mode for automations

```bash
icalendar events list --json
icalendar events create --summary "Standup" --start "2026-05-07T10:00:00+02:00" --end "2026-05-07T10:15:00+02:00" --json
```

### 3. Use compiled build in production

```bash
node dist/cli.js events list --json
```

Prefer `dist/cli.js` for repeatable production runs. Use `src/cli.ts` with `tsx` for local development only.

## Output contract

### Successful mutation

```json
{
  "ok": true,
  "calendarName": "Example Calendar",
  "url": "https://.../event.ics"
}
```

### Successful list

```json
{
  "ok": true,
  "selectedCalendar": {
    "displayName": "Example Calendar"
  },
  "events": [],
  "count": 0
}
```

### Error shape in JSON mode

```json
{
  "ok": false,
  "error": {
    "code": "missing_flags",
    "message": "events create requires --summary, --start, and --end"
  }
}
```

## Invite flows

Attendees are passed as a comma-separated list:

```bash
icalendar events create \
  --summary "Family sync" \
  --start "2026-05-07T18:00:00+02:00" \
  --end "2026-05-07T18:30:00+02:00" \
  --attendees "esta@example.com,anna@example.com"
```

Organizer display name is controlled by:

```env
CALDAV_ORGANIZER_NAME=Calendar Bot
```

This writes `ORGANIZER;CN=Calendar Bot:mailto:...` into the generated ICS. Calendar clients may still choose their own UI rendering rules.

## Event update semantics

`events update` edits an existing CalDAV object in place instead of replacing the event with a freshly generated VEVENT.

Required flags for every update:

```bash
--url "https://caldav.example.com/calendars/personal/event.ics"
--summary "Family sync"
--start "2026-05-07T18:00:00+02:00"
--end "2026-05-07T18:45:00+02:00"
```

### Add attendees

`--attendees` ensures the listed attendees exist. It does not replace the full attendee list.

```bash
icalendar events update \
  --url "https://caldav.example.com/calendars/personal/event.ics" \
  --summary "Family sync" \
  --start "2026-05-07T18:00:00+02:00" \
  --end "2026-05-07T18:45:00+02:00" \
  --attendees "secondary.attendee@example.test"
```

### Remove attendees

`--remove-attendees` removes matching attendee email addresses while preserving all other attendees and provider metadata.

```bash
icalendar events update \
  --url "https://caldav.example.com/calendars/personal/event.ics" \
  --summary "Family sync" \
  --start "2026-05-07T18:00:00+02:00" \
  --end "2026-05-07T18:45:00+02:00" \
  --remove-attendees "old.attendee@example.test"
```

### Add and remove in one update

```bash
icalendar events update \
  --url "https://caldav.example.com/calendars/personal/event.ics" \
  --summary "Family sync" \
  --start "2026-05-07T18:00:00+02:00" \
  --end "2026-05-07T18:45:00+02:00" \
  --attendees "new.attendee@example.test" \
  --remove-attendees "old.attendee@example.test"
```

### Preservation guarantees

For existing objects, the CLI reads the current `.ics`, patches the VEVENT, and writes it back to the same URL. It preserves:

- `UID`
- `VALARM` reminder blocks
- `ORGANIZER` metadata
- existing attendee lines and provider-added attendee/principal metadata
- unrelated VEVENT properties that are not explicitly updated

It updates:

- `SUMMARY`
- `DTSTART`
- `DTEND`
- `DESCRIPTION`, when provided
- `LOCATION`, when provided
- requested attendee additions/removals
- `SEQUENCE`, incremented on every update

### Verification advice

For automation workflows, re-fetch the raw `.ics` after mutation and verify:

- `UID` stayed the same
- `SEQUENCE` increased
- expected `ATTENDEE` lines are present or absent
- `VALARM` blocks are still present if reminders matter
- the returned mutation URL is unchanged

Provider caveat: raw `VALARM` preservation does not guarantee that every calendar client will show user-visible reminders. iCloud invite flows may treat visible alerts as per-user/client state, even when the organizer CalDAV object still contains `VALARM` blocks.

## Operational advice

- For iCloud, always use an app-specific password.
- Prefer a dedicated test calendar for smoke tests.
- Use `events update` instead of creating duplicate test events.
- Clean up test events after validation.
- Never commit real `.env` files.

## Validation checklist for adopters

```bash
npm run verify
node dist/cli.js --help
node dist/cli.js calendars list --json
```

## Embedding in other repos

Common patterns:

- shell out from an agent runner
- wrap the CLI in a task/job worker
- expose it behind your own HTTP API
- use JSON mode as the integration boundary

If you need richer programmatic APIs later, keep the CLI behavior stable first and add library-facing wrappers second.
