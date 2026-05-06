import * as tsdav from 'tsdav'
import type { CalendarGatewayPort, CreateEventInput, DeleteEventInput, ListEventsInput, UpdateEventInput } from '../../app/ports/calendar-gateway.port.js'
import type { RuntimeConfig } from '../../app/ports/config-reader.port.js'
import type { Calendar } from '../../domain/calendars/calendar.js'
import type { CalendarEvent } from '../../domain/events/calendar-event.js'
import type { EventMutationResult } from '../../domain/events/event-draft.js'
import { buildEventIcs } from '../../domain/events/ics.js'
import { parseCalendarEvent } from '../parsing/ics-parser.js'

const toCalendar = (calendar: tsdav.DAVCalendar): Calendar => ({
  id: calendar.url,
  displayName: String(calendar.displayName ?? 'Untitled'),
  url: calendar.url,
})

const calendarDisplayName = (calendar: Calendar) => calendar.displayName || 'Untitled'

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

  async createEvent(input: CreateEventInput): Promise<EventMutationResult> {
    const client = await this.clientPromise
    const filename = `${crypto.randomUUID()}.ics`
    const objectUrl = new URL(filename, input.calendar.url.endsWith('/') ? input.calendar.url : `${input.calendar.url}/`).toString()
    const iCalString = buildEventIcs(input.draft)

    await client.createCalendarObject({
      calendar: { url: input.calendar.url } as tsdav.DAVCalendar,
      filename,
      iCalString,
    })

    return { ok: true, calendarName: calendarDisplayName(input.calendar), url: objectUrl }
  }

  async updateEvent(input: UpdateEventInput): Promise<EventMutationResult> {
    const client = await this.clientPromise
    const iCalString = buildEventIcs(input.update)

    await client.updateCalendarObject({
      calendarObject: { url: input.update.url, data: iCalString } as tsdav.DAVCalendarObject,
    })

    return { ok: true, calendarName: calendarDisplayName(input.calendar), url: input.update.url }
  }

  async deleteEvent(input: DeleteEventInput): Promise<EventMutationResult> {
    const client = await this.clientPromise
    await client.deleteCalendarObject({ calendarObject: { url: input.url } as tsdav.DAVCalendarObject })
    return { ok: true, calendarName: calendarDisplayName(input.calendar), url: input.url }
  }
}
