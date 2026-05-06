import crypto from 'node:crypto'

import type { DAVCalendar, DAVCalendarObject } from 'tsdav'

import type { Calendar } from '../../domain/calendars/calendar.js'
import type { EventDraft, EventUpdate } from '../../domain/events/event-draft.js'
import { buildEventIcs } from '../../domain/events/ics.js'

export type CalendarObjectClient = {
  createCalendarObject(params: { calendar: DAVCalendar, filename: string, iCalString: string }): Promise<unknown>
  updateCalendarObject(params: { calendarObject: DAVCalendarObject }): Promise<unknown>
  deleteCalendarObject(params: { calendarObject: DAVCalendarObject }): Promise<unknown>
}

export type EventObjectServiceOptions = {
  organizerEmail: string
  organizerCommonName?: string
}

export class EventObjectService {
  constructor(
    private readonly client: CalendarObjectClient,
    private readonly options: EventObjectServiceOptions,
  ) {}

  async create(calendar: Calendar, draft: EventDraft): Promise<string> {
    const filename = `${crypto.randomUUID()}.ics`
    const objectUrl = new URL(filename, calendar.url.endsWith('/') ? calendar.url : `${calendar.url}/`).toString()
    const iCalString = buildEventIcs(draft, undefined, this.options.organizerEmail, this.options.organizerCommonName)

    await this.client.createCalendarObject({
      calendar: { url: calendar.url } as DAVCalendar,
      filename,
      iCalString,
    })

    return objectUrl
  }

  async update(update: EventUpdate): Promise<void> {
    const iCalString = buildEventIcs(update, undefined, this.options.organizerEmail, this.options.organizerCommonName)

    await this.client.updateCalendarObject({
      calendarObject: { url: update.url, data: iCalString } as DAVCalendarObject,
    })
  }

  async delete(url: string): Promise<void> {
    await this.client.deleteCalendarObject({ calendarObject: { url } as DAVCalendarObject })
  }
}
