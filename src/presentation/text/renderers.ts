import type { ListCalendarsResult } from '../../app/use-cases/calendars/list-calendars.js'
import type { ListEventsResult } from '../../app/use-cases/events/list-events.js'

export const renderCalendarsText = (result: ListCalendarsResult): string => {
  if (result.calendars.length === 0) return 'No calendars found.'

  return ['Calendars:', ...result.calendars.map((calendar) => `- ${calendar.displayName} (${calendar.url})`)].join('\n')
}

export const renderEventsText = (result: ListEventsResult): string => {
  const lines: string[] = []

  if (result.calendars.length === 0) {
    return 'No calendars found.'
  }

  lines.push('Calendars:')
  for (const calendar of result.calendars) {
    lines.push(`- ${calendar.displayName} (${calendar.url})`)
  }

  if (!result.selectedCalendar) {
    return lines.join('\n')
  }

  const rangeLabel = result.timeRange ? ` for ${result.timeRange.start} → ${result.timeRange.end}` : ''
  lines.push('', `Events in ${result.selectedCalendar.displayName}${rangeLabel}:`)

  if (result.events.length === 0) {
    lines.push('- No events found.')
    return lines.join('\n')
  }

  for (const event of result.events) {
    lines.push(`- ${event.summary} | ${event.start ?? 'unknown start'} | ${event.url}`)
  }

  return lines.join('\n')
}
