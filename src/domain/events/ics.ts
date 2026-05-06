import crypto from 'node:crypto'

import { CliError } from '../../shared/errors/cli-error.js'
import type { EventAttendee, EventDraft } from './event-draft.js'

const escapeText = (value: string): string => value
  .replace(/\\/g, '\\\\')
  .replace(/\n/g, '\\n')
  .replace(/,/g, '\\,')
  .replace(/;/g, '\\;')

const toUtcStamp = (value: string): string => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new CliError('invalid_datetime', `Invalid datetime: ${value}`)
  }
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
}

const renderAttendee = (attendee: EventAttendee): string => {
  const params = ['CUTYPE=INDIVIDUAL', 'ROLE=REQ-PARTICIPANT', 'PARTSTAT=NEEDS-ACTION', 'RSVP=TRUE']
  if (attendee.commonName) params.unshift(`CN=${escapeText(attendee.commonName)}`)
  return `ATTENDEE;${params.join(';')}:mailto:${attendee.email}`
}

export const buildEventIcs = (draft: EventDraft, uid = crypto.randomUUID(), organizerEmail?: string): string => {
  const now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//cayde-6//icalendar//EN',
    draft.attendees?.length ? 'METHOD:REQUEST' : 'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    'SEQUENCE:0',
    'STATUS:CONFIRMED',
    `DTSTART:${toUtcStamp(draft.start)}`,
    `DTEND:${toUtcStamp(draft.end)}`,
    `SUMMARY:${escapeText(draft.summary)}`,
  ]

  if (organizerEmail) lines.push(`ORGANIZER:mailto:${organizerEmail}`)
  if (draft.description) lines.push(`DESCRIPTION:${escapeText(draft.description)}`)
  if (draft.location) lines.push(`LOCATION:${escapeText(draft.location)}`)
  for (const attendee of draft.attendees || []) lines.push(renderAttendee(attendee))

  lines.push('END:VEVENT', 'END:VCALENDAR')
  return lines.join('\r\n') + '\r\n'
}
