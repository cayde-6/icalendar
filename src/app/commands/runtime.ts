import type { CalendarGatewayPort } from '../ports/calendar-gateway.port.js'
import type { RuntimeConfig } from '../ports/config-reader.port.js'
import { runCalendarsListCommand } from './calendars/list.command.js'
import { runEventsListCommand } from './events/list.command.js'
import { runEventsCreateCommand } from './events/create.command.js'
import { runEventsUpdateCommand } from './events/update.command.js'
import { runEventsDeleteCommand } from './events/delete.command.js'
import { renderCalendarsText, renderEventMutationText, renderEventsText } from '../../presentation/text/renderers.js'
import { renderJson } from '../../presentation/json/renderers.js'
import { CliError } from '../../shared/errors/cli-error.js'

export type RuntimeDeps = {
  gateway: CalendarGatewayPort
  config: RuntimeConfig
  args: string[]
}

const hasFlag = (args: string[], name: string): boolean => args.includes(name)

const print = (args: string[], value: unknown, renderText: (value: any) => string) => {
  if (hasFlag(args, '--json')) {
    console.log(renderJson(value))
    return
  }

  console.log(renderText(value))
}

export const printError = (args: string[], error: unknown) => {
  if (hasFlag(args, '--json')) {
    const normalized = error instanceof CliError
      ? { ok: false, error: { code: error.code, message: error.message } }
      : { ok: false, error: { message: (error as Error).message } }

    console.error(renderJson(normalized))
    return
  }

  console.error((error as Error).message)
}

export const runCommand = async ({ gateway, config, args }: RuntimeDeps): Promise<boolean> => {
  if (args.length === 0) {
    const result = await runEventsListCommand(gateway, config)
    print(args, result, renderEventsText)
    return true
  }

  if (args[0] === 'calendars' && args[1] === 'list') {
    const result = await runCalendarsListCommand(gateway)
    print(args, result, renderCalendarsText)
    return true
  }

  if (args[0] === 'events' && args[1] === 'list') {
    const result = await runEventsListCommand(gateway, config)
    print(args, result, renderEventsText)
    return true
  }

  if (args[0] === 'events' && args[1] === 'create') {
    const result = await runEventsCreateCommand(gateway, config, args)
    print(args, result, (value) => renderEventMutationText('create', value))
    return true
  }

  if (args[0] === 'events' && args[1] === 'update') {
    const result = await runEventsUpdateCommand(gateway, config, args)
    print(args, result, (value) => renderEventMutationText('update', value))
    return true
  }

  if (args[0] === 'events' && args[1] === 'delete') {
    const result = await runEventsDeleteCommand(gateway, config, args)
    print(args, result, (value) => renderEventMutationText('delete', value))
    return true
  }

  return false
}
