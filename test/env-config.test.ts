import test from 'node:test'
import assert from 'node:assert/strict'

import { EnvConfigReader } from '../src/infra/config/env-config.reader.js'

test('EnvConfigReader reads required and optional config', () => {
  const previous = { ...process.env }
  process.env.CALDAV_SERVER_URL = 'https://caldav.example.com/'
  process.env.CALDAV_USERNAME = 'user@example.com'
  process.env.CALDAV_PASSWORD = 'app-password'
  process.env.CALDAV_CALENDAR_NAME = 'Personal'
  process.env.CALDAV_RANGE_START = '2026-05-07T00:00:00+02:00'
  process.env.CALDAV_RANGE_END = '2026-05-08T00:00:00+02:00'
  process.env.CALDAV_EXPAND_RECURRING = 'true'
  process.env.CALDAV_ORGANIZER_NAME = 'Bender'

  try {
    const config = new EnvConfigReader().readRuntimeConfig()
    assert.equal(config.serverUrl, 'https://caldav.example.com/')
    assert.equal(config.username, 'user@example.com')
    assert.equal(config.password, 'app-password')
    assert.equal(config.calendarName, 'Personal')
    assert.equal(config.rangeStart, '2026-05-07T00:00:00+02:00')
    assert.equal(config.rangeEnd, '2026-05-08T00:00:00+02:00')
    assert.equal(config.expandRecurring, true)
    assert.equal(config.organizerName, 'Bender')
  } finally {
    process.env = previous
  }
})
