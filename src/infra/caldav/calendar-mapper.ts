import type { DAVCalendar } from 'tsdav'

import type { Calendar } from '../../domain/calendars/calendar.js'

export const toCalendar = (calendar: DAVCalendar): Calendar => ({
  id: calendar.url,
  displayName: String(calendar.displayName ?? 'Untitled'),
  url: calendar.url,
})

export const calendarDisplayName = (calendar: Calendar) => calendar.displayName || 'Untitled'
