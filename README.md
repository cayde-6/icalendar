# icalendar

TypeScript starter for working with **CalDAV** calendars and iCalendar data.

## Stack

- Node.js
- TypeScript
- [`tsdav`](https://www.npmjs.com/package/tsdav) for CalDAV access
- `zod` for env validation

## Quick start

```bash
npm install
cp .env.example .env
npm run dev
```

Fill in your CalDAV credentials in `.env`:

```env
CALDAV_SERVER_URL=https://caldav.example.com/
CALDAV_USERNAME=your-username
CALDAV_PASSWORD=your-password
# optional:
# CALDAV_CALENDAR_NAME=Personal
# CALDAV_RANGE_START=2026-05-03T00:00:00+02:00
# CALDAV_RANGE_END=2026-05-10T00:00:00+02:00
# CALDAV_EXPAND_RECURRING=true
```

## What it does now

- connects to a CalDAV server
- fetches available calendars
- prints them to stdout
- fetches calendar events for a selected calendar and optional time range

## Scripts

- `npm run dev` — run locally with `tsx`
- `npm run check` — type-check
- `npm run build` — compile to `dist/`
- `npm start` — run compiled output

## Output behavior

- If `CALDAV_CALENDAR_NAME` is omitted, the first discovered calendar is used.
- If `CALDAV_RANGE_START` / `CALDAV_RANGE_END` are omitted, it fetches all visible calendar objects the server returns.
- If only `CALDAV_RANGE_START` is set, the end defaults to 30 days later.
- `CALDAV_EXPAND_RECURRING=true` asks the server to expand recurring events in the requested window.

## Next useful steps

1. Add create/update/delete event flows
2. Parse richer event fields (location, attendees, recurrence)
3. Wrap this in a small HTTP API or CLI
