import type { DAVCalendarObject } from 'tsdav'

import type { CalendarGatewayPort, CreateEventInput, DeleteEventInput, ListEventsInput, UpdateEventInput } from '../../app/ports/calendar-gateway.port.js'
import type { RuntimeConfig } from '../../app/ports/config-reader.port.js'
import type { Calendar } from '../../domain/calendars/calendar.js'
import type { CalendarEvent } from '../../domain/events/calendar-event.js'
import type { EventMutationResult } from '../../domain/events/event-draft.js'
import { parseCalendarEvent } from '../parsing/ics-parser.js'
import { calendarDisplayName, toCalendar } from './calendar-mapper.js'
import { createCaldavClient } from './client.js'
import { EventObjectService } from './event-object.service.js'

export class TsdavCalendarGateway implements CalendarGatewayPort {
  private readonly clientPromise

  constructor(private readonly config: RuntimeConfig) {
    this.clientPromise = createCaldavClient(config)
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

    return objects.map((object: DAVCalendarObject) => parseCalendarEvent(object.data, object.url))
  }

  async createEvent(input: CreateEventInput): Promise<EventMutationResult> {
    const client = await this.clientPromise
    const service = new EventObjectService(client, {
      organizerEmail: this.config.username,
      organizerCommonName: this.config.organizerName,
    })

    const url = await service.create(input.calendar, input.draft)
    return { ok: true, calendarName: calendarDisplayName(input.calendar), url }
  }

  async updateEvent(input: UpdateEventInput): Promise<EventMutationResult> {
    const client = await this.clientPromise
    const service = new EventObjectService(client, {
      organizerEmail: this.config.username,
      organizerCommonName: this.config.organizerName,
    })

    await service.update(input.update)
    return { ok: true, calendarName: calendarDisplayName(input.calendar), url: input.update.url }
  }

  async deleteEvent(input: DeleteEventInput): Promise<EventMutationResult> {
    const client = await this.clientPromise
    const service = new EventObjectService(client, {
      organizerEmail: this.config.username,
      organizerCommonName: this.config.organizerName,
    })

    await service.delete(input.url)
    return { ok: true, calendarName: calendarDisplayName(input.calendar), url: input.url }
  }
}
