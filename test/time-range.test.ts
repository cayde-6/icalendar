import test from 'node:test'
import assert from 'node:assert/strict'

import { addDays, buildTimeRange, toCalDavTime } from '../src/domain/shared/time-range.js'

test('buildTimeRange creates bounded range from start only', () => {
  const range = buildTimeRange('2026-05-01T00:00:00+00:00')
  assert.ok(range)
  assert.match(range!.start, /^20260501T000000Z$/)
  assert.match(range!.end, /^20260531T000000Z$/)
})

test('toCalDavTime formats dates in UTC calendar form', () => {
  assert.equal(toCalDavTime(new Date('2026-05-01T12:34:56.000Z')), '20260501T123456Z')
})

test('addDays returns a shifted UTC date', () => {
  const shifted = addDays(new Date('2026-05-01T00:00:00.000Z'), 2)
  assert.equal(shifted.toISOString(), '2026-05-03T00:00:00.000Z')
})


test('buildTimeRange creates bounded range from end only', () => {
  const range = buildTimeRange(undefined, '2026-05-31T00:00:00+00:00')
  assert.ok(range)
  assert.match(range!.start, /^\d{8}T\d{6}Z$/)
  assert.equal(range!.end, '20260531T000000Z')
})
