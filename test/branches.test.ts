import test from 'node:test'
import assert from 'node:assert/strict'

import { runCommand } from '../src/app/commands/runtime.js'
import { runEventsCreateCommand } from '../src/app/commands/events/create.command.js'
import { runEventsUpdateCommand } from '../src/app/commands/events/update.command.js'
import { runEventsDeleteCommand } from '../src/app/commands/events/delete.command.js'
import { resolveCalendar } from '../src/app/use-cases/events/helpers.js'
import { buildTimeRange } from '../src/domain/shared/time-range.js'
import { renderCalendarsText, renderEventsText } from '../src/presentation/text/renderers.js'
import { CliError } from '../src/shared/errors/cli-error.js'
import type { CalendarGatewayPort } from '../src/app/ports/calendar-gateway.port.js'
import type { RuntimeConfig } from '../src/app/ports/config-reader.port.js'

const config: RuntimeConfig = {
  serverUrl: 'https://caldav.example.com',
  username: 'user',
  password: 'pass',
  organizerName: 'Bender',
}

const calendar = { id: '1', displayName: 'Personal', url: 'https://example.com/personal' }

const gateway: CalendarGatewayPort = {
  async listCalendars() { return [calendar] },
  async listEvents() { return [] },
  async createEvent() { return { ok: true, calendarName: 'Personal', url: 'created-url' } },
  async updateEvent(input) { return { ok: true, calendarName: 'Personal', url: input.update.url } },
  async deleteEvent(input) { return { ok: true, calendarName: 'Personal', url: input.url } },
}

test('runCommand returns false for unknown commands', async () => {
  const handled = await runCommand({ gateway, config, args: ['wat', 'now'] })
  assert.equal(handled, false)
})

test('events create throws on missing required flags', async () => {
  await assert.rejects(
    () => runEventsCreateCommand(gateway, config, ['events', 'create', '--summary', 'Demo']),
    (error: unknown) => error instanceof CliError && error.code === 'missing_flags',
  )
})

test('events update throws on missing required flags', async () => {
  await assert.rejects(
    () => runEventsUpdateCommand(gateway, config, ['events', 'update', '--url', 'u', '--summary', 'Demo']),
    (error: unknown) => error instanceof CliError && error.code === 'missing_flags',
  )
})

test('events delete throws without url', async () => {
  await assert.rejects(
    () => runEventsDeleteCommand(gateway, config, ['events', 'delete']),
    (error: unknown) => error instanceof CliError && error.code === 'missing_flags',
  )
})

test('resolveCalendar throws when no calendars exist', async () => {
  await assert.rejects(
    () => resolveCalendar([], undefined),
    (error: unknown) => error instanceof CliError && error.code === 'calendar_missing',
  )
})

test('resolveCalendar throws when named calendar is absent', async () => {
  await assert.rejects(
    () => resolveCalendar([calendar], 'Work'),
    (error: unknown) => error instanceof CliError && error.code === 'calendar_not_found',
  )
})

test('buildTimeRange returns undefined when no bounds are provided', () => {
  assert.equal(buildTimeRange(), undefined)
})

test('buildTimeRange throws on invalid bounds', () => {
  assert.throws(
    () => buildTimeRange('not-a-date', '2026-05-08T00:00:00+00:00'),
    (error: unknown) => error instanceof CliError && error.code === 'invalid_time_range',
  )
})

test('buildTimeRange throws when start is after end', () => {
  assert.throws(
    () => buildTimeRange('2026-05-09T00:00:00+00:00', '2026-05-08T00:00:00+00:00'),
    (error: unknown) => error instanceof CliError && error.code === 'invalid_time_range',
  )
})

test('renderCalendarsText handles empty state', () => {
  assert.equal(renderCalendarsText({ ok: true, count: 0, calendars: [] }), 'calendars list: 0 item(s)')
})

test('renderEventsText handles empty state without selection', () => {
  const text = renderEventsText({ ok: true, count: 0, calendars: [], events: [] })
  assert.match(text, /events list: 0 item\(s\)/)
  assert.match(text, /No events found/)
})
