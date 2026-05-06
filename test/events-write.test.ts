import test from 'node:test'
import assert from 'node:assert/strict'

import { runEventsCreateCommand } from '../src/app/commands/events/create.command.js'
import { runEventsUpdateCommand } from '../src/app/commands/events/update.command.js'
import { runEventsDeleteCommand } from '../src/app/commands/events/delete.command.js'
import type { CalendarGatewayPort } from '../src/app/ports/calendar-gateway.port.js'
import type { RuntimeConfig } from '../src/app/ports/config-reader.port.js'

const config: RuntimeConfig = {
  serverUrl: 'https://caldav.example.com',
  username: 'user',
  password: 'pass',
  organizerName: 'Bender',
}

const calendar = { id: '1', displayName: 'Personal', url: 'https://example.com/personal' }

test('events create delegates to gateway', async () => {
  let receivedSummary = ''
  const gateway: CalendarGatewayPort = {
    async listCalendars() { return [calendar] },
    async listEvents() { return [] },
    async createEvent(input) { receivedSummary = input.draft.summary; return { ok: true, calendarName: input.calendar.displayName, url: 'created-url' } },
    async updateEvent() { throw new Error('unexpected') },
    async deleteEvent() { throw new Error('unexpected') },
  }

  const result = await runEventsCreateCommand(gateway, config, ['events','create','--summary','Demo','--start','2026-05-06T10:00:00Z','--end','2026-05-06T11:00:00Z','--attendees','primary.attendee@example.test'])
  assert.equal(receivedSummary, 'Demo')
  assert.equal(result.url, 'created-url')
})

test('events update delegates to gateway', async () => {
  let receivedUrl = ''
  let receivedAttendees: unknown
  const gateway: CalendarGatewayPort = {
    async listCalendars() { return [calendar] },
    async listEvents() { return [] },
    async createEvent() { throw new Error('unexpected') },
    async updateEvent(input) { receivedUrl = input.update.url; receivedAttendees = input.update.attendees; return { ok: true, calendarName: input.calendar.displayName, url: input.update.url } },
    async deleteEvent() { throw new Error('unexpected') },
  }

  const result = await runEventsUpdateCommand(gateway, config, ['events','update','--url','event-url','--summary','Demo','--start','2026-05-06T10:00:00Z','--end','2026-05-06T11:00:00Z','--attendees','primary.attendee@example.test'])
  assert.equal(receivedUrl, 'event-url')
  assert.deepEqual(receivedAttendees, [{ email: 'primary.attendee@example.test' }])
  assert.equal(result.url, 'event-url')
})

test('events delete delegates to gateway', async () => {
  let receivedUrl = ''
  const gateway: CalendarGatewayPort = {
    async listCalendars() { return [calendar] },
    async listEvents() { return [] },
    async createEvent() { throw new Error('unexpected') },
    async updateEvent() { throw new Error('unexpected') },
    async deleteEvent(input) { receivedUrl = input.url; return { ok: true, calendarName: input.calendar.displayName, url: input.url } },
  }

  const result = await runEventsDeleteCommand(gateway, config, ['events','delete','event-url'])
  assert.equal(receivedUrl, 'event-url')
  assert.equal(result.url, 'event-url')
})
