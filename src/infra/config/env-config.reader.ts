import 'dotenv/config'
import { z } from 'zod'
import type { ConfigReaderPort, RuntimeConfig } from '../../app/ports/config-reader.port.js'

const envSchema = z.object({
  CALDAV_SERVER_URL: z.string().url(),
  CALDAV_USERNAME: z.string().min(1),
  CALDAV_PASSWORD: z.string().min(1),
  CALDAV_CALENDAR_NAME: z.string().min(1).optional(),
  CALDAV_RANGE_START: z.string().datetime({ offset: true }).optional(),
  CALDAV_RANGE_END: z.string().datetime({ offset: true }).optional(),
  CALDAV_EXPAND_RECURRING: z.enum(['true', 'false']).optional().transform((value) => value === 'true'),
})

export class EnvConfigReader implements ConfigReaderPort {
  readRuntimeConfig(): RuntimeConfig {
    const env = envSchema.parse(process.env)

    return {
      serverUrl: env.CALDAV_SERVER_URL,
      username: env.CALDAV_USERNAME,
      password: env.CALDAV_PASSWORD,
      calendarName: env.CALDAV_CALENDAR_NAME,
      rangeStart: env.CALDAV_RANGE_START,
      rangeEnd: env.CALDAV_RANGE_END,
      expandRecurring: env.CALDAV_EXPAND_RECURRING,
    }
  }
}
