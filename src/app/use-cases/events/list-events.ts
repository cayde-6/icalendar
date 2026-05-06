import { buildTimeRange, type TimeRange } from '../../../domain/shared/time-range.js'
import type { Calendar } from '../../../domain/calendars/calendar.js'
import type { CalendarEvent } from '../../../domain/events/calendar-event.js'
import type { CalendarGatewayPort } from '../../ports/calendar-gateway.port.js'
import type { RuntimeConfig } from '../../ports/config-reader.port.js'
import { resolveCalendar } from './helpers.js'

export type ListEventsResult = {
  ok: boolean
  calendars: Calendar[]
  selectedCalendar?: Calendar
  events: CalendarEvent[]
  count: number
  timeRange?: TimeRange
}

export const listEvents = async (gateway: CalendarGatewayPort, config: RuntimeConfig): Promise<ListEventsResult> => {
  const calendars = await gateway.listCalendars()
  const selectedCalendar = await resolveCalendar(calendars, config.calendarName)
  const timeRange = buildTimeRange(config.rangeStart, config.rangeEnd)
  const events = await gateway.listEvents({
    calendar: selectedCalendar,
    timeRange,
    expandRecurring: config.expandRecurring,
  })

  return { ok: true, calendars, selectedCalendar, events, count: events.length, timeRange }
}
