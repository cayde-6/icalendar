import { CliError } from '../../../shared/errors/cli-error.js'
import type { CalendarGatewayPort } from '../../ports/calendar-gateway.port.js'
import type { RuntimeConfig } from '../../ports/config-reader.port.js'
import { updateEvent } from '../../use-cases/events/update-event.js'

const getFlagValue = (args: string[], name: string): string | undefined => {
  const index = args.indexOf(name)
  if (index === -1) return undefined
  return args[index + 1]?.startsWith('--') ? undefined : args[index + 1]
}

const parseAttendees = (value?: string) => {
  if (!value) return undefined
  const attendees = value.split(',').map((entry) => entry.trim()).filter(Boolean)
  return attendees.length ? attendees.map((email) => ({ email })) : undefined
}

export const runEventsUpdateCommand = async (gateway: CalendarGatewayPort, config: RuntimeConfig, args: string[]) => {
  const url = getFlagValue(args, '--url')
  const summary = getFlagValue(args, '--summary')
  const start = getFlagValue(args, '--start')
  const end = getFlagValue(args, '--end')
  const description = getFlagValue(args, '--description')
  const location = getFlagValue(args, '--location')
  const attendees = parseAttendees(getFlagValue(args, '--attendees'))

  if (!url || !summary || !start || !end) {
    throw new CliError('missing_flags', 'events update requires --url, --summary, --start, and --end')
  }

  return updateEvent(gateway, config, { url, summary, start, end, description, location, attendees })
}
