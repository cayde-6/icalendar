export { runCli } from './cli.js'

// Domain types
export type { Calendar } from './domain/calendars/calendar.js'
export type { CalendarEvent } from './domain/events/calendar-event.js'
export type { EventDraft, EventAttendee, EventMutationResult, EventUpdate } from './domain/events/event-draft.js'
export type { TimeRange } from './domain/shared/time-range.js'

// ICS generation
export { buildEventIcs } from './domain/events/ics.js'

// Port interfaces
export type { CalendarGatewayPort, ListEventsInput, CreateEventInput, UpdateEventInput, DeleteEventInput } from './app/ports/calendar-gateway.port.js'
export type { RuntimeConfig } from './app/ports/config-reader.port.js'

// Default CalDAV implementation
export { TsdavCalendarGateway } from './infra/caldav/tsdav-calendar.gateway.js'

// Error handling
export { CliError } from './shared/errors/cli-error.js'
