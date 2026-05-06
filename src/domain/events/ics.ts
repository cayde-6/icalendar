import crypto from 'node:crypto'

import { CliError } from '../../shared/errors/cli-error.js'
import type { EventDraft } from './event-draft.js'

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

export const buildEventIcs = (draft: EventDraft, uid = crypto.randomUUID()): string => {
  const now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//cayde-6//icalendar//EN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${toUtcStamp(draft.start)}`,
    `DTEND:${toUtcStamp(draft.end)}`,
    `SUMMARY:${escapeText(draft.summary)}`,
  ]

  if (draft.description) lines.push(`DESCRIPTION:${escapeText(draft.description)}`)
  if (draft.location) lines.push(`LOCATION:${escapeText(draft.location)}`)

  lines.push('END:VEVENT', 'END:VCALENDAR')
  return lines.join('\r\n') + '\r\n'
}
