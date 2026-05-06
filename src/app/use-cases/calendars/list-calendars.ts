import type { Calendar } from '../../../domain/calendars/calendar.js'
import type { CalendarGatewayPort } from '../../ports/calendar-gateway.port.js'

export type ListCalendarsResult = {
  ok: boolean
  calendars: Calendar[]
  count: number
}

export const listCalendars = async (gateway: CalendarGatewayPort): Promise<ListCalendarsResult> => {
  const calendars = await gateway.listCalendars()
  return { ok: true, calendars, count: calendars.length }
}
