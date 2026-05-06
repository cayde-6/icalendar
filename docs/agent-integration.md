# Agent integration guide

This page is for agents, automations, and other repos that want to **use `icalendar` as a dependable CLI building block**.

## What you get

`icalendar` is a small CalDAV/iCalendar command surface with stable behavior:

- `calendars list`
- `events list`
- `events create`
- `events update`
- `events delete`

For machine consumers, pass `--json` whenever possible.

## Install flow

```bash
git clone https://github.com/cayde-6/icalendar.git
cd icalendar
npm install
cp .env.example .env
npm run build
```

## Required env

```env
CALDAV_SERVER_URL=https://caldav.icloud.com/
CALDAV_USERNAME=your-icloud-address@example.com
CALDAV_PASSWORD=your-app-specific-password
```

## Recommended env

```env
CALDAV_CALENDAR_NAME=OpenClaw Test
CALDAV_ORGANIZER_NAME=Bender
CALDAV_EXPAND_RECURRING=true
```

## Consumption patterns

### 1. Human-facing CLI

```bash
icalendar calendars list
icalendar events list
```

### 2. Agent-safe JSON mode

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
  "calendarName": "OpenClaw Test",
  "url": "https://.../event.ics"
}
```

### Successful list

```json
{
  "ok": true,
  "selectedCalendar": {
    "displayName": "OpenClaw Test"
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
CALDAV_ORGANIZER_NAME=Bender
```

This writes `ORGANIZER;CN=Bender:mailto:...` into the generated ICS. Calendar clients may still choose their own UI rendering rules.

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
