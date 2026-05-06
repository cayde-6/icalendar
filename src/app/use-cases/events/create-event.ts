import type { EventDraft, EventMutationResult } from '../../../domain/events/event-draft.js'
import type { CalendarGatewayPort } from '../../ports/calendar-gateway.port.js'
import type { RuntimeConfig } from '../../ports/config-reader.port.js'
import { resolveCalendar } from './helpers.js'

export const createEvent = async (gateway: CalendarGatewayPort, config: RuntimeConfig, draft: EventDraft): Promise<EventMutationResult> => {
  const calendars = await gateway.listCalendars()
  const calendar = await resolveCalendar(calendars, config.calendarName)
  return gateway.createEvent({ calendar, draft })
}
