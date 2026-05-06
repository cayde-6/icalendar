# Unified CLI Architecture — icalendar

## Goal

`icalendar` should follow the same architectural shape as `threads-cli`.

The point is not just code style symmetry. The point is to make both repos:

- navigable in the same way
- refactorable by the same rules
- testable at the same boundaries
- easy to extend without turning into provider-coupled spaghetti

This document defines the target architecture for `icalendar`.

---

## Architectural principles

1. **Same layers in every CLI repo**
2. **One file = one clear reason to change**
3. **Provider SDKs stay at the edges**
4. **Use-cases orchestrate; domain models decide**
5. **Presentation never talks directly to CalDAV/ICS libraries**
6. **Config parsing is not business logic**
7. **Every external dependency sits behind a port/interface**

---

## Target layer model

### 1. Entrypoint layer
Process boot only.

Examples:
- load env file if needed
- boot runtime
- wire dependencies
- set exit code

### 2. Command layer
CLI contracts only.

Examples:
- `calendar list`
- `events list`
- later: `events create`, `events update`, `events delete`
- parse args/options
- validate command input shape

### 3. Application layer
Use-cases only.

Examples:
- `list-calendars`
- `list-events`
- `get-calendar`
- later write flows

Rules:
- no raw `process.env`
- no direct `tsdav` calls
- no terminal formatting

### 4. Domain layer
Calendar meaning and invariants.

Examples:
- entities: `Calendar`, `CalendarEvent`
- value objects: `CalendarName`, `CalendarUrl`, `TimeRange`, `EventSummary`
- policies: range validation, calendar selection rules, recurrence expansion rules

Rules:
- no SDK imports
- no stdout/stderr
- no filesystem access

### 5. Infrastructure layer
Provider/machine-specific adapters.

Examples:
- CalDAV client adapter over `tsdav`
- env/config loader
- ICS parser adapter
- local credential/config source

### 6. Presentation layer
Output renderers only.

Examples:
- calendar list renderer
- event list renderer
- json/text output adapters

### 7. Shared layer
Small cross-cutting primitives only.

Examples:
- errors
- result types
- date helpers
- schema helpers

---

## Canonical folder layout

`icalendar` should converge toward this exact layout so it mirrors `threads-cli`:

```text
src/
  cli.ts
  app/
    commands/
      calendars/
        list.command.ts
      events/
        list.command.ts
    use-cases/
      calendars/
      events/
    ports/
      calendar-gateway.port.ts
      config-reader.port.ts
      ics-parser.port.ts
  domain/
    calendars/
    events/
    shared/
  infra/
    config/
      env-config.reader.ts
    caldav/
      tsdav-calendar.gateway.ts
    parsing/
      ics-parser.ts
  presentation/
    text/
    json/
  shared/
    errors/
    result/
    utils/
```

---

## Boundary rules

### Command -> Application
Commands call use-cases and know nothing about `tsdav` internals.

### Application -> Domain + Ports
Use-cases coordinate selection, validation, fetch flow, and output DTO composition.

### Infrastructure -> Ports
`tsdav` and raw ICS parsing stay here.

### Presentation -> Application result DTOs
Format only.

### Domain
Provider-agnostic and import-safe.

---

## icalendar domain map

### Calendar subdomain
- `Calendar`
- `CalendarCollection`
- `CalendarSelector`

### Event subdomain
- `CalendarEvent`
- `EventInstance`
- `EventSummary`
- `EventTime`

### Query subdomain
- `TimeRange`
- `EventListQuery`
- validation rules for range defaults and ordering

### Diagnostics/config subdomain
- `ConnectionStatus`
- config validation results

---

## Port model for icalendar

Target ports:

- `CalendarGatewayPort`
  - `listCalendars()`
  - `listEvents(query)`
  - later: `createEvent()`, `updateEvent()`, `deleteEvent()`

- `ConfigReaderPort`
  - `readRuntimeConfig()`

- `IcsParserPort`
  - `parseEvent(rawIcs)`

This keeps `tsdav` and ICS line parsing from leaking into command code.

---

## Migration from current structure

Current state is mostly a monolith in `src/index.ts`.

Split it in this order:

1. move env parsing to `infra/config`
2. move CalDAV connection/fetch code to `infra/caldav`
3. move calendar selection + time range logic to `domain` + `app/use-cases`
4. move ICS parsing to `infra/parsing` behind `IcsParserPort`
5. move printing to `presentation/text`
6. replace `src/index.ts` with `src/cli.ts` + command runtime

---

## Test strategy by layer

- **domain tests**: time range defaults, selection rules, invariants
- **use-case tests**: mocked gateway/parser ports
- **infra tests**: `tsdav` mapping, ICS parsing
- **command tests**: argv -> DTO mapping
- **presentation tests**: formatted text/json outputs

---

## Definition of architectural done

A feature is architecturally correct when:

1. CLI parsing lives in `app/commands/*`
2. one use-case owns orchestration
3. `tsdav` is only used inside infra adapters
4. text output lives in `presentation/*`
5. calendar/time-range rules are not buried inside the entrypoint
