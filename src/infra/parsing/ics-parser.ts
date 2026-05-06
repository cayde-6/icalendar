import type { CalendarEvent } from '../../domain/events/calendar-event.js'

const unfoldIcsLines = (ics: string): string[] => {
  return ics
    .replace(/\r\n[ \t]/g, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
}

const readIcsField = (ics: string, fieldName: string): string | undefined => {
  const lines = unfoldIcsLines(ics)
  const line = lines.find((entry) => entry.startsWith(`${fieldName}:`) || entry.startsWith(`${fieldName};`))
  if (!line) return undefined

  const separatorIndex = line.indexOf(':')
  return separatorIndex === -1 ? undefined : line.slice(separatorIndex + 1).trim()
}

export const parseCalendarEvent = (raw: unknown, url: string): CalendarEvent => {
  const ics = typeof raw === 'string' ? raw : ''

  return {
    summary: readIcsField(ics, 'SUMMARY') ?? 'Untitled event',
    start: readIcsField(ics, 'DTSTART'),
    end: readIcsField(ics, 'DTEND'),
    description: readIcsField(ics, 'DESCRIPTION'),
    location: readIcsField(ics, 'LOCATION'),
    url,
  }
}
