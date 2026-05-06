import type { EventMutationResult, EventUpdate } from '../../../domain/events/event-draft.js'
import type { CalendarGatewayPort } from '../../ports/calendar-gateway.port.js'
import type { RuntimeConfig } from '../../ports/config-reader.port.js'
import { resolveCalendar } from './helpers.js'

export const updateEvent = async (gateway: CalendarGatewayPort, config: RuntimeConfig, update: EventUpdate): Promise<EventMutationResult> => {
  const calendars = await gateway.listCalendars()
  const calendar = await resolveCalendar(calendars, config.calendarName)
  return gateway.updateEvent({ calendar, update })
}
