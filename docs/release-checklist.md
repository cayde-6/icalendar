# Release checklist

Use this before sharing the repo with a new consumer or presenting it as release-ready.

## Code quality

- `npm run check`
- `npm run build`
- `npm run test:coverage`
- verify no secrets in staged changes

## CLI behavior

- `--help` works without `.env`
- `--version` works without `.env`
- `calendars list` works against target CalDAV account
- `events create` works against target calendar
- `events update` can change attendees
- `events delete` cleans up the test object

## Invite behavior

- organizer CN is set as expected
- invite arrives in target client(s)
- attendee updates propagate correctly

## Packaging

- `dist/` builds cleanly
- `bin` entry works locally via `npm link` or `node dist/cli.js`
- `README.md` matches actual CLI behavior
- `.env.example` matches current env contract

## Security

- `.env` ignored
- no secrets in README / docs / screenshots
- if a secret was ever committed, rewrite history and rotate it
