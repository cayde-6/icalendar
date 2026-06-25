import crypto from 'node:crypto'

import type { DAVCalendar, DAVCalendarObject } from 'tsdav'

import type { Calendar } from '../../domain/calendars/calendar.js'
import type { EventAttendee, EventDraft, EventUpdate } from '../../domain/events/event-draft.js'
import { buildEventIcs } from '../../domain/events/ics.js'

export type CalendarObjectClient = {
  createCalendarObject(params: { calendar: DAVCalendar, filename: string, iCalString: string }): Promise<unknown>
  fetchCalendarObjects(params: { calendar: DAVCalendar, objectUrls?: string[], useMultiGet?: boolean }): Promise<DAVCalendarObject[]>
  updateCalendarObject(params: { calendarObject: DAVCalendarObject, headers?: Record<string, string> }): Promise<unknown>
  deleteCalendarObject(params: { calendarObject: DAVCalendarObject }): Promise<unknown>
}

export type EventObjectServiceOptions = {
  organizerEmail: string
  organizerCommonName?: string
}

const escapeText = (value: string): string => value
  .replace(/\\/g, '\\\\')
  .replace(/\n/g, '\\n')
  .replace(/,/g, '\\,')
  .replace(/;/g, '\\;')

const toUtcStamp = (value: string): string => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid datetime: ${value}`)
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
}

const normalizeCalendarData = (data: string): string => data.replace(/\r?\n/g, '\r\n')

const unfoldLines = (data: string): string[] => normalizeCalendarData(data)
  .split('\r\n')
  .filter((line) => line.length > 0)
  .reduce<string[]>((lines, line) => {
    if (/^[ \t]/.test(line) && lines.length > 0) {
      lines[lines.length - 1] += line.slice(1)
    } else {
      lines.push(line)
    }
    return lines
  }, [])

const replaceOrInsertBeforeEndEvent = (lines: string[], name: string, value: string): string[] => {
  const index = lines.findIndex((line) => line.toUpperCase().startsWith(`${name.toUpperCase()}:`))
  if (index >= 0) {
    lines[index] = `${name}:${value}`
    return lines
  }

  const endEventIndex = lines.findIndex((line) => line.toUpperCase() === 'END:VEVENT')
  lines.splice(endEventIndex >= 0 ? endEventIndex : lines.length, 0, `${name}:${value}`)
  return lines
}

const attendeeEmail = (line: string): string | undefined => {
  const match = line.match(/(?:mailto:|EMAIL=)([^;:\s]+)/i)
  return match?.[1]?.toLowerCase()
}

const renderAttendee = (attendee: EventAttendee): string => {
  const params = ['CUTYPE=INDIVIDUAL', 'ROLE=REQ-PARTICIPANT', 'PARTSTAT=NEEDS-ACTION', 'RSVP=TRUE']
  if (attendee.commonName) params.unshift(`CN=${escapeText(attendee.commonName)}`)
  return `ATTENDEE;${params.join(';')}:mailto:${attendee.email}`
}

const insertAttendee = (lines: string[], attendee: EventAttendee): string[] => {
  const email = attendee.email.toLowerCase()
  if (lines.some((line) => line.toUpperCase().startsWith('ATTENDEE') && attendeeEmail(line) === email)) return lines

  let insertIndex = -1
  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i].toUpperCase().startsWith('ATTENDEE')) insertIndex = i + 1
  }
  if (insertIndex < 0) {
    const organizerIndex = lines.findIndex((line) => line.toUpperCase().startsWith('ORGANIZER'))
    insertIndex = organizerIndex >= 0 ? organizerIndex + 1 : lines.findIndex((line) => line.toUpperCase() === 'END:VEVENT')
  }
  lines.splice(insertIndex >= 0 ? insertIndex : lines.length, 0, renderAttendee(attendee))
  return lines
}

const ensureRequestMethod = (lines: string[]): string[] => {
  const methodIndex = lines.findIndex((line) => line.toUpperCase().startsWith('METHOD:'))
  if (methodIndex >= 0) {
    lines[methodIndex] = 'METHOD:REQUEST'
    return lines
  }
  const versionIndex = lines.findIndex((line) => line.toUpperCase() === 'VERSION:2.0')
  lines.splice(versionIndex >= 0 ? versionIndex + 1 : 1, 0, 'METHOD:REQUEST')
  return lines
}

const incrementSequence = (lines: string[]): string[] => {
  const sequenceIndex = lines.findIndex((line) => line.toUpperCase().startsWith('SEQUENCE:'))
  if (sequenceIndex < 0) return replaceOrInsertBeforeEndEvent(lines, 'SEQUENCE', '1')

  const value = Number.parseInt(lines[sequenceIndex].slice('SEQUENCE:'.length), 10)
  lines[sequenceIndex] = `SEQUENCE:${Number.isFinite(value) ? value + 1 : 1}`
  return lines
}

export const patchExistingEventIcs = (existingIcs: string, update: EventUpdate): string => {
  const lines = unfoldLines(existingIcs)

  replaceOrInsertBeforeEndEvent(lines, 'DTSTART', toUtcStamp(update.start))
  replaceOrInsertBeforeEndEvent(lines, 'DTEND', toUtcStamp(update.end))
  replaceOrInsertBeforeEndEvent(lines, 'SUMMARY', escapeText(update.summary))
  if (update.description !== undefined) replaceOrInsertBeforeEndEvent(lines, 'DESCRIPTION', escapeText(update.description))
  if (update.location !== undefined) replaceOrInsertBeforeEndEvent(lines, 'LOCATION', escapeText(update.location))

  for (const attendee of update.attendees || []) insertAttendee(lines, attendee)
  if (update.attendees?.length) ensureRequestMethod(lines)
  incrementSequence(lines)

  return `${lines.join('\r\n')}\r\n`
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

  async update(calendar: Calendar, update: EventUpdate): Promise<void> {
    const [existingObject] = await this.client.fetchCalendarObjects({
      calendar: { url: calendar.url } as DAVCalendar,
      objectUrls: [update.url],
      useMultiGet: true,
    })
    const existingData = typeof existingObject?.data === 'string' ? existingObject.data : ''
    const iCalString = existingData
      ? patchExistingEventIcs(existingData, update)
      : buildEventIcs(update, undefined, this.options.organizerEmail, this.options.organizerCommonName)

    await this.client.updateCalendarObject({
      calendarObject: { url: update.url, data: iCalString, etag: existingObject?.etag } as DAVCalendarObject,
      headers: existingObject?.etag ? { 'If-Match': existingObject.etag } : undefined,
    })
  }

  async delete(url: string): Promise<void> {
    await this.client.deleteCalendarObject({ calendarObject: { url } as DAVCalendarObject })
  }
}
