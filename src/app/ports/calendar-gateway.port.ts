import type { Calendar } from '../../domain/calendars/calendar.js'
import type { CalendarEvent } from '../../domain/events/calendar-event.js'
import type { TimeRange } from '../../domain/shared/time-range.js'

export type ListEventsInput = {
  calendar: Calendar
  timeRange?: TimeRange
  expandRecurring?: boolean
}

export interface CalendarGatewayPort {
  listCalendars(): Promise<Calendar[]>
  listEvents(input: ListEventsInput): Promise<CalendarEvent[]>
}
