# Unified CLI Architecture — icalendar

`icalendar` follows a layered CLI shape:

```text
cli -> app(commands/use-cases) -> domain -> infra -> presentation -> shared
```

The goal is simple: keep CalDAV/ICS plumbing at the edges, keep use-cases readable, and make the repo easier to extend without turning it into provider-coupled spaghetti.

## Current layer map

### Entrypoint
- `src/cli.ts`
- `src/index.ts`

Responsibilities:
- bootstrap the process
- wire runtime dependencies
- allow `--help` / `--version` without requiring credentials

### App layer
- `src/app/commands/*`
- `src/app/use-cases/*`
- `src/app/ports/*`

Responsibilities:
- parse CLI input into DTOs
- orchestrate calendar/event flows
- depend on ports, not SDKs

### Domain layer
- `src/domain/calendars/*`
- `src/domain/events/*`
- `src/domain/shared/*`

Responsibilities:
- calendar selection rules
- event draft/update models
- ICS generation rules
- time-range defaults and validation

### Infra layer
- `src/infra/config/*`
- `src/infra/caldav/*`
- `src/infra/parsing/*`

Responsibilities:
- env parsing
- CalDAV client construction
- provider object mapping
- event object create/update/delete operations
- ICS parsing

### Presentation layer
- `src/presentation/text/*`
- `src/presentation/json/*`

Responsibilities:
- human-readable output
- machine-readable JSON output

### Shared layer
- `src/shared/errors/*`
- `src/shared/utils/*`

Responsibilities:
- small cross-cutting primitives only

## CalDAV adapter split

The original single CalDAV gateway file was split into smaller responsibilities:

- `infra/caldav/client.ts` — runtime-safe `tsdav` client construction
- `infra/caldav/calendar-mapper.ts` — `DAVCalendar -> Calendar`
- `infra/caldav/event-object.service.ts` — create/update/delete calendar objects
- `infra/caldav/tsdav-calendar.gateway.ts` — thin orchestration wrapper implementing `CalendarGatewayPort`

This keeps the `tsdav` edge easier to test and reason about.

## Boundary rules

### Command -> Use-case
Commands may parse argv and validate flags, but they do not talk to `tsdav`.

### Use-case -> Ports + Domain
Use-cases orchestrate behavior and rely on domain rules plus ports.

### Infra -> External providers
Only infra knows about `tsdav`, ICS raw data, and environment variables.

### Presentation -> DTOs
Renderers format results only. No network, no env, no provider logic.

## Runtime contract

Supported commands:

- `calendars list`
- `events list`
- `events create`
- `events update`
- `events delete`

Both text and JSON output are supported. Machine consumers should prefer `--json`.

## Config contract

Required:
- `CALDAV_SERVER_URL`
- `CALDAV_USERNAME`
- `CALDAV_PASSWORD`

Optional:
- `CALDAV_CALENDAR_NAME`
- `CALDAV_RANGE_START`
- `CALDAV_RANGE_END`
- `CALDAV_EXPAND_RECURRING`
- `CALDAV_ORGANIZER_NAME`

## Testing strategy

The current test suite covers:

- calendar selection
- time range rules
- command parsing
- runtime output + error output
- env parsing
- ICS generation and parsing
- event write DTO mapping

For live validation, the repo was also smoke-tested against a real iCloud CalDAV account.

## Definition of done for new features

A feature is architecturally correct when:

1. CLI parsing lives in `app/commands/*`
2. orchestration lives in one use-case
3. provider SDK usage stays inside `infra/*`
4. output formatting stays inside `presentation/*`
5. config parsing does not leak into business logic
6. tests cover the new boundary you touched
