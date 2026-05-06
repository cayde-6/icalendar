import { cac } from 'cac'

import { EnvConfigReader } from './infra/config/env-config.reader.js'
import { TsdavCalendarGateway } from './infra/caldav/tsdav-calendar.gateway.js'
import { runCalendarsListCommand } from './app/commands/calendars/list.command.js'
import { runEventsListCommand } from './app/commands/events/list.command.js'
import { renderCalendarsText, renderEventsText } from './presentation/text/renderers.js'
import { renderJson } from './presentation/json/renderers.js'
import { CliError } from './shared/errors/cli-error.js'

const cli = cac('icalendar')
const args = process.argv.slice(2)
const hasFlag = (name: string): boolean => args.includes(name)
const outputMode = (): 'text' | 'json' => (hasFlag('--json') ? 'json' : 'text')

const print = (value: unknown, renderText: (value: any) => string) => {
  if (outputMode() === 'json') {
    console.log(renderJson(value))
    return
  }

  console.log(renderText(value))
}

const printError = (error: unknown) => {
  if (outputMode() === 'json') {
    const normalized = error instanceof CliError
      ? { ok: false, error: { code: error.code, message: error.message } }
      : { ok: false, error: { message: (error as Error).message } }

    console.error(renderJson(normalized))
    return
  }

  console.error((error as Error).message)
}

export const runCli = async (): Promise<void> => {
  const configReader = new EnvConfigReader()
  const config = configReader.readRuntimeConfig()
  const gateway = new TsdavCalendarGateway(config)

  if (args[0] === 'calendars' && args[1] === 'list') {
    const result = await runCalendarsListCommand(gateway)
    print(result, renderCalendarsText)
    return
  }

  const result = await runEventsListCommand(gateway, config)
  print(result, renderEventsText)
}

cli.command('calendars list', 'list available calendars')
cli.command('events list', 'list events for selected calendar/time range')
cli.help()
cli.version('0.1.0')

const execute = args.length === 0 || args[0] === 'calendars' || args[0] == 'events'
if (execute) {
  runCli().catch((error) => {
    printError(error)
    process.exitCode = 1
  })
} else {
  cli.parse()
}
