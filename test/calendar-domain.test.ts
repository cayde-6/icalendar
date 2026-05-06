import test from 'node:test'
import assert from 'node:assert/strict'

import { pickCalendar } from '../src/domain/calendars/calendar.js'

const calendars = [
  { id: '1', displayName: 'Personal', url: 'https://example.com/personal' },
  { id: '2', displayName: 'Work', url: 'https://example.com/work' },
]

test('pickCalendar returns first calendar by default', () => {
  const result = pickCalendar(calendars)
  assert.equal(result?.displayName, 'Personal')
})

test('pickCalendar matches case-insensitively by display name', () => {
  const result = pickCalendar(calendars, 'work')
  assert.equal(result?.displayName, 'Work')
})
