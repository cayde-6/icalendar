import { CliError } from '../../../shared/errors/cli-error.js'
import type { CalendarGatewayPort } from '../../ports/calendar-gateway.port.js'
import type { RuntimeConfig } from '../../ports/config-reader.port.js'
import { createEvent } from '../../use-cases/events/create-event.js'

const getFlagValue = (args: string[], name: string): string | undefined => {
  const index = args.indexOf(name)
  if (index === -1) return undefined
  return args[index + 1]?.startsWith('--') ? undefined : args[index + 1]
}

export const runEventsCreateCommand = async (gateway: CalendarGatewayPort, config: RuntimeConfig, args: string[]) => {
  const summary = getFlagValue(args, '--summary')
  const start = getFlagValue(args, '--start')
  const end = getFlagValue(args, '--end')
  const description = getFlagValue(args, '--description')
  const location = getFlagValue(args, '--location')

  if (!summary || !start || !end) {
    throw new CliError('missing_flags', 'events create requires --summary, --start, and --end')
  }

  return createEvent(gateway, config, { summary, start, end, description, location })
}
