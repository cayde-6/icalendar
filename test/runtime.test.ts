import test from 'node:test'
import assert from 'node:assert/strict'

import { runCommand } from '../src/app/commands/runtime.js'
import type { CalendarGatewayPort } from '../src/app/ports/calendar-gateway.port.js'
import type { RuntimeConfig } from '../src/app/ports/config-reader.port.js'

const config: RuntimeConfig = {
  serverUrl: 'https://caldav.example.com',
  username: 'user',
  password: 'pass',
  organizerName: 'Bender',
}

const gateway: CalendarGatewayPort = {
  async listCalendars() {
    return [{ id: '1', displayName: 'Personal', url: 'https://example.com/personal' }]
  },
  async listEvents() {
    return [{ summary: 'Demo event', start: '20260501T000000Z', url: 'https://example.com/event' }]
  },
  async createEvent(input) {
    return { ok: true, calendarName: input.calendar.displayName, url: 'created-url' }
  },
  async updateEvent(input) {
    return { ok: true, calendarName: input.calendar.displayName, url: input.update.url }
  },
  async deleteEvent(input) {
    return { ok: true, calendarName: input.calendar.displayName, url: input.url }
  },
}

const captureStdout = async (fn: () => Promise<void>) => {
  const logs: string[] = []
  const original = console.log
  console.log = (...args) => logs.push(args.join(' '))
  try {
    await fn()
  } finally {
    console.log = original
  }
  return logs.join('\n')
}

test('runCommand handles calendars list', async () => {
  const output = await captureStdout(async () => {
    const handled = await runCommand({ gateway, config, args: ['calendars', 'list'] })
    assert.equal(handled, true)
  })

  assert.match(output, /calendars list: 1 item\(s\)/)
  assert.match(output, /Personal/)
})

test('runCommand handles events list in json mode', async () => {
  const output = await captureStdout(async () => {
    const handled = await runCommand({ gateway, config, args: ['events', 'list', '--json'] })
    assert.equal(handled, true)
  })

  assert.match(output, /"events"/)
  assert.match(output, /Demo event/)
})

test('runCommand defaults to events list when no args are passed', async () => {
  const output = await captureStdout(async () => {
    const handled = await runCommand({ gateway, config, args: [] })
    assert.equal(handled, true)
  })

  assert.match(output, /events list: 1 item\(s\)/)
  assert.match(output, /Demo event/)
})

test('runCommand handles events create in text mode', async () => {
  const output = await captureStdout(async () => {
    const handled = await runCommand({
      gateway,
      config,
      args: ['events', 'create', '--summary', 'Demo', '--start', '2026-05-06T10:00:00Z', '--end', '2026-05-06T11:00:00Z'],
    })
    assert.equal(handled, true)
  })

  assert.match(output, /events create: done/)
  assert.match(output, /created-url/)
})

test('runCommand handles events update in text mode', async () => {
  const output = await captureStdout(async () => {
    const handled = await runCommand({
      gateway,
      config,
      args: ['events', 'update', '--url', 'event-url', '--summary', 'Demo', '--start', '2026-05-06T10:00:00Z', '--end', '2026-05-06T11:00:00Z'],
    })
    assert.equal(handled, true)
  })

  assert.match(output, /events update: done/)
  assert.match(output, /event-url/)
})

test('runCommand handles events delete in text mode', async () => {
  const output = await captureStdout(async () => {
    const handled = await runCommand({ gateway, config, args: ['events', 'delete', 'event-url'] })
    assert.equal(handled, true)
  })

  assert.match(output, /events delete: done/)
  assert.match(output, /event-url/)
})
