import { CliError } from '../../../shared/errors/cli-error.js'
import type { CalendarGatewayPort } from '../../ports/calendar-gateway.port.js'
import type { RuntimeConfig } from '../../ports/config-reader.port.js'
import { deleteEvent } from '../../use-cases/events/delete-event.js'

const getFlagValue = (args: string[], name: string): string | undefined => {
  const index = args.indexOf(name)
  if (index === -1) return undefined
  return args[index + 1]?.startsWith('--') ? undefined : args[index + 1]
}

const getPositionalUrl = (args: string[]): string | undefined => args.slice(2).find((arg) => !arg.startsWith('--'))

export const runEventsDeleteCommand = async (gateway: CalendarGatewayPort, config: RuntimeConfig, args: string[]) => {
  const url = getFlagValue(args, '--url') || getPositionalUrl(args)
  if (!url) {
    throw new CliError('missing_flags', 'events delete requires --url <event-url> or events delete <event-url>')
  }

  return deleteEvent(gateway, config, url)
}
