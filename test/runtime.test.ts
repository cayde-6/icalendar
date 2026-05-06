import test from 'node:test'
import assert from 'node:assert/strict'

import { runCommand } from '../src/app/commands/runtime.js'
import type { CalendarGatewayPort } from '../src/app/ports/calendar-gateway.port.js'
import type { RuntimeConfig } from '../src/app/ports/config-reader.port.js'

const config: RuntimeConfig = {
  serverUrl: 'https://caldav.example.com',
  username: 'user',
  password: 'pass',
}

const gateway: CalendarGatewayPort = {
  async listCalendars() {
    return [{ id: '1', displayName: 'Personal', url: 'https://example.com/personal' }]
  },
  async listEvents() {
    return [{ summary: 'Demo event', start: '20260501T000000Z', url: 'https://example.com/event' }]
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

  assert.match(output, /Calendars:/)
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
