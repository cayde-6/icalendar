import { pickCalendar } from '../../../domain/calendars/calendar.js'
import { buildTimeRange, type TimeRange } from '../../../domain/shared/time-range.js'
import { CliError } from '../../../shared/errors/cli-error.js'
import type { Calendar } from '../../../domain/calendars/calendar.js'
import type { CalendarEvent } from '../../../domain/events/calendar-event.js'
import type { CalendarGatewayPort } from '../../ports/calendar-gateway.port.js'
import type { RuntimeConfig } from '../../ports/config-reader.port.js'

export type ListEventsResult = {
  calendars: Calendar[]
  selectedCalendar?: Calendar
  events: CalendarEvent[]
  timeRange?: TimeRange
}

export const listEvents = async (gateway: CalendarGatewayPort, config: RuntimeConfig): Promise<ListEventsResult> => {
  const calendars = await gateway.listCalendars()
  const selectedCalendar = pickCalendar(calendars, config.calendarName)

  if (!selectedCalendar) {
    if (calendars.length === 0) {
      return { calendars, events: [] }
    }

    throw new CliError('calendar_not_found', `Calendar not found: ${config.calendarName}`)
  }

  const timeRange = buildTimeRange(config.rangeStart, config.rangeEnd)
  const events = await gateway.listEvents({
    calendar: selectedCalendar,
    timeRange,
    expandRecurring: config.expandRecurring,
  })

  return { calendars, selectedCalendar, events, timeRange }
}
