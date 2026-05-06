import { cac } from 'cac'

import { EnvConfigReader } from './infra/config/env-config.reader.js'
import { TsdavCalendarGateway } from './infra/caldav/tsdav-calendar.gateway.js'
import { runCommand, printError } from './app/commands/runtime.js'

const cli = cac('icalendar')
cli.command('calendars list', 'list available calendars')
cli.command('events list', 'list events for selected calendar/time range')
cli.help()
cli.version('0.1.0')

export const runCli = async (args = process.argv.slice(2)) => {
  const configReader = new EnvConfigReader()
  const config = configReader.readRuntimeConfig()
  const gateway = new TsdavCalendarGateway(config)

  if (!(await runCommand({ gateway, config, args }))) {
    cli.parse()
  }
}

runCli().catch((error) => {
  printError(process.argv.slice(2), error)
  process.exitCode = 1
})
