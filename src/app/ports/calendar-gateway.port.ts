import type { Calendar } from '../../domain/calendars/calendar.js'
import type { CalendarEvent } from '../../domain/events/calendar-event.js'
import type { EventDraft, EventMutationResult, EventUpdate } from '../../domain/events/event-draft.js'
import type { TimeRange } from '../../domain/shared/time-range.js'

export type ListEventsInput = {
  calendar: Calendar
  timeRange?: TimeRange
  expandRecurring?: boolean
}

export type CreateEventInput = {
  calendar: Calendar
  draft: EventDraft
}

export type UpdateEventInput = {
  calendar: Calendar
  update: EventUpdate
}

export type DeleteEventInput = {
  calendar: Calendar
  url: string
}

export interface CalendarGatewayPort {
  listCalendars(): Promise<Calendar[]>
  listEvents(input: ListEventsInput): Promise<CalendarEvent[]>
  createEvent(input: CreateEventInput): Promise<EventMutationResult>
  updateEvent(input: UpdateEventInput): Promise<EventMutationResult>
  deleteEvent(input: DeleteEventInput): Promise<EventMutationResult>
}
