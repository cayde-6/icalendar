export type Calendar = {
  id: string
  displayName: string
  url: string
}

export const pickCalendar = (calendars: Calendar[], calendarName?: string): Calendar | undefined => {
  if (calendars.length === 0) return undefined
  if (!calendarName) return calendars[0]

  const normalizedTarget = calendarName.trim().toLowerCase()
  return calendars.find((calendar) => calendar.displayName.trim().toLowerCase() == normalizedTarget)
}
