import test from 'node:test'
import assert from 'node:assert/strict'

import { renderCalendarsText, renderEventsText, renderEventMutationText } from '../src/presentation/text/renderers.js'

test('renderCalendarsText includes count headline', () => {
  const text = renderCalendarsText({
    ok: true,
    count: 2,
    calendars: [
      { id: '1', displayName: 'Personal', url: 'u1' },
      { id: '2', displayName: 'Work', url: 'u2' },
    ],
  })

  assert.match(text, /calendars list: 2 item\(s\)/)
  assert.match(text, /Personal/)
})

test('renderEventsText includes count and richer event fields', () => {
  const text = renderEventsText({
    ok: true,
    count: 1,
    calendars: [],
    selectedCalendar: { id: '1', displayName: 'Personal', url: 'u1' },
    timeRange: { start: 'A', end: 'B' },
    events: [{ summary: 'Demo', start: 'S', end: 'E', location: 'Belgrade', url: 'event-url' }],
  })

  assert.match(text, /events list: 1 item\(s\)/)
  assert.match(text, /calendar: Personal/)
  assert.match(text, /location: Belgrade/)
  assert.match(text, /url: event-url/)
})

test('renderEventsText omits range label when only selected calendar is present', () => {
  const text = renderEventsText({
    ok: true,
    count: 1,
    calendars: [],
    selectedCalendar: { id: '1', displayName: 'Personal', url: 'u1' },
    events: [{ summary: 'Demo', url: 'event-url' }],
  })

  assert.match(text, /^events list: 1 item\(s\)/)
  assert.match(text, /calendar: Personal$/m)
  assert.doesNotMatch(text, /range/)
  assert.match(text, /start: -/)
  assert.match(text, /end: -/)
  assert.match(text, /location: -/)
})

test('renderEventMutationText stays compact', () => {
  const text = renderEventMutationText('create', { ok: true, calendarName: 'Personal', url: 'event-url' })
  assert.match(text, /events create: done/)
  assert.match(text, /calendar: Personal/)
})
