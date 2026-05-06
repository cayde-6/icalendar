import type { ListCalendarsResult } from '../../app/use-cases/calendars/list-calendars.js'
import type { ListEventsResult } from '../../app/use-cases/events/list-events.js'
import type { EventMutationResult } from '../../domain/events/event-draft.js'

export const renderCalendarsText = (result: ListCalendarsResult): string => {
  if (result.calendars.length === 0) return 'calendars list: 0 item(s)'

  return [
    `calendars list: ${result.count} item(s)`,
    ...result.calendars.map((calendar) => `- ${calendar.displayName} (${calendar.url})`),
  ].join('\n')
}

export const renderEventsText = (result: ListEventsResult): string => {
  const lines: string[] = []

  lines.push(`events list: ${result.count} item(s)`)

  if (result.selectedCalendar) {
    const rangeLabel = result.timeRange ? ` | range ${result.timeRange.start} → ${result.timeRange.end}` : ''
    lines.push(`calendar: ${result.selectedCalendar.displayName}${rangeLabel}`)
  }

  if (result.events.length === 0) {
    lines.push('- No events found.')
    return lines.join('\n')
  }

  for (const event of result.events) {
    lines.push(`- summary: ${event.summary}`)
    lines.push(`  start: ${event.start ?? '-'}`)
    lines.push(`  end: ${event.end ?? '-'}`)
    lines.push(`  location: ${event.location ?? '-'}`)
    lines.push(`  url: ${event.url}`)
  }

  return lines.join('\n')
}

export const renderEventMutationText = (action: 'create' | 'update' | 'delete', result: EventMutationResult): string => {
  return [
    `events ${action}: done`,
    `calendar: ${result.calendarName}`,
    `url: ${result.url}`,
  ].join('\n')
}
