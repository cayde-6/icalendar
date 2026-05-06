import test from 'node:test'
import assert from 'node:assert/strict'

import { buildTimeRange } from '../src/domain/shared/time-range.js'

test('buildTimeRange creates bounded range from start only', () => {
  const range = buildTimeRange('2026-05-01T00:00:00+00:00')
  assert.ok(range)
  assert.match(range!.start, /^20260501T000000Z$/)
  assert.match(range!.end, /^20260531T000000Z$/)
})
