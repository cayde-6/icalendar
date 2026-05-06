import { listEvents } from '../../use-cases/events/list-events.js'
import type { CalendarGatewayPort } from '../../ports/calendar-gateway.port.js'
import type { RuntimeConfig } from '../../ports/config-reader.port.js'

export const runEventsListCommand = async (gateway: CalendarGatewayPort, config: RuntimeConfig) => {
  return listEvents(gateway, config)
}
