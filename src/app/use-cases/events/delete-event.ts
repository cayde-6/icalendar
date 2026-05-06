import type { EventMutationResult } from '../../../domain/events/event-draft.js'
import type { CalendarGatewayPort } from '../../ports/calendar-gateway.port.js'
import type { RuntimeConfig } from '../../ports/config-reader.port.js'
import { resolveCalendar } from './helpers.js'

export const deleteEvent = async (gateway: CalendarGatewayPort, config: RuntimeConfig, url: string): Promise<EventMutationResult> => {
  const calendars = await gateway.listCalendars()
  const calendar = await resolveCalendar(calendars, config.calendarName)
  return gateway.deleteEvent({ calendar, url })
}
