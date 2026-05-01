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
```

## What it does now

- connects to a CalDAV server
- fetches available calendars
- prints them to stdout

## Scripts

- `npm run dev` — run locally with `tsx`
- `npm run check` — type-check
- `npm run build` — compile to `dist/`
- `npm start` — run compiled output

## Next useful steps

1. Add calendar event listing for a time range
2. Add create/update/delete event flows
3. Wrap this in a small HTTP API or CLI
