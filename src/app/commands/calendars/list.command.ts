import { listCalendars } from '../../use-cases/calendars/list-calendars.js'
import type { CalendarGatewayPort } from '../../ports/calendar-gateway.port.js'

export const runCalendarsListCommand = async (gateway: CalendarGatewayPort) => {
  return listCalendars(gateway)
}
