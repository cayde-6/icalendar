import type { Calendar } from '../../../domain/calendars/calendar.js'
import type { CalendarGatewayPort } from '../../ports/calendar-gateway.port.js'

export type ListCalendarsResult = {
  calendars: Calendar[]
}

export const listCalendars = async (gateway: CalendarGatewayPort): Promise<ListCalendarsResult> => {
  const calendars = await gateway.listCalendars()
  return { calendars }
}
