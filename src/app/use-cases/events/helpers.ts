import { pickCalendar } from '../../../domain/calendars/calendar.js'
import { CliError } from '../../../shared/errors/cli-error.js'
import type { Calendar } from '../../../domain/calendars/calendar.js'

export const resolveCalendar = async (calendars: Calendar[], calendarName?: string): Promise<Calendar> => {
  const selectedCalendar = pickCalendar(calendars, calendarName)

  if (!selectedCalendar) {
    if (calendars.length === 0) {
      throw new CliError('calendar_missing', 'No calendars found')
    }

    throw new CliError('calendar_not_found', `Calendar not found: ${calendarName}`)
  }

  return selectedCalendar
}
