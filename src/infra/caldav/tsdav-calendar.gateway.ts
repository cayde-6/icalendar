import * as tsdav from 'tsdav'
import type { CalendarGatewayPort, ListEventsInput } from '../../app/ports/calendar-gateway.port.js'
import type { RuntimeConfig } from '../../app/ports/config-reader.port.js'
import type { Calendar } from '../../domain/calendars/calendar.js'
import type { CalendarEvent } from '../../domain/events/calendar-event.js'
import { parseCalendarEvent } from '../parsing/ics-parser.js'

const toCalendar = (calendar: tsdav.DAVCalendar): Calendar => ({
  id: calendar.url,
  displayName: String(calendar.displayName ?? 'Untitled'),
  url: calendar.url,
})

export class TsdavCalendarGateway implements CalendarGatewayPort {
  private clientPromise

  constructor(private readonly config: RuntimeConfig) {
    this.clientPromise = tsdav.createDAVClient({
      serverUrl: config.serverUrl,
      credentials: {
        username: config.username,
        password: config.password,
      },
      authMethod: 'Basic',
      defaultAccountType: 'caldav',
    })
  }

  async listCalendars(): Promise<Calendar[]> {
    const client = await this.clientPromise
    const calendars = await client.fetchCalendars()
    return calendars.map(toCalendar)
  }

  async listEvents(input: ListEventsInput): Promise<CalendarEvent[]> {
    const client = await this.clientPromise
    const calendars = await client.fetchCalendars()
    const calendar = calendars.find((entry) => entry.url === input.calendar.url)

    if (!calendar) return []

    const objects = await client.fetchCalendarObjects({
      calendar,
      timeRange: input.timeRange,
      expand: input.expandRecurring,
    })

    return objects.map((object: tsdav.DAVCalendarObject) => parseCalendarEvent(object.data, object.url))
  }
}
