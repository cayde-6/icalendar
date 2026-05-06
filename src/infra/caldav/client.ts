import tsdav from 'tsdav'

import type { RuntimeConfig } from '../../app/ports/config-reader.port.js'
import type { CalendarObjectClient } from './event-object.service.js'

const { createDAVClient } = tsdav as unknown as { createDAVClient: typeof tsdav.createDAVClient }

export type CaldavClient = CalendarObjectClient & {
  fetchCalendars(): Promise<any[]>
  fetchCalendarObjects(params: { calendar: any, timeRange?: unknown, expand?: boolean }): Promise<any[]>
}

export const createCaldavClient = async (config: RuntimeConfig): Promise<CaldavClient> => {
  const client = await createDAVClient({
    serverUrl: config.serverUrl,
    credentials: {
      username: config.username,
      password: config.password,
    },
    authMethod: 'Basic',
    defaultAccountType: 'caldav',
  })

  return client as unknown as CaldavClient
}
