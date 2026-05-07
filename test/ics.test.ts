import test from 'node:test'
import assert from 'node:assert/strict'

import { buildEventIcs } from '../src/domain/events/ics.js'
import { parseCalendarEvent } from '../src/infra/parsing/ics-parser.js'
import { CliError } from '../src/shared/errors/cli-error.js'

test('buildEventIcs renders organizer CN and attendees', () => {
  const ics = buildEventIcs({
    summary: 'Demo',
    start: '2026-05-07T18:00:00+02:00',
    end: '2026-05-07T18:30:00+02:00',
    description: 'Line 1\nLine 2',
    location: 'Belgrade',
    attendees: [{ email: 'primary.attendee@example.test' }, { email: 'secondary.attendee@example.test', commonName: 'Anna' }],
  }, 'uid-1', 'primary.attendee@example.test', 'Bender')

  assert.match(ics, /METHOD:REQUEST/)
  assert.match(ics, /ORGANIZER;CN=Bender:mailto:primary\.attendee@example\.test/)
  assert.match(ics, /ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:primary\.attendee@example\.test/)
  assert.match(ics, /ATTENDEE;CN=Anna;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:secondary\.attendee@example\.test/)
})

test('buildEventIcs renders publish method and organizer without CN when optional fields are absent', () => {
  const ics = buildEventIcs({
    summary: 'Comma, semicolon; slash \\',
    start: '2026-05-07T18:00:00+02:00',
    end: '2026-05-07T18:30:00+02:00',
  }, 'uid-2', 'primary.attendee@example.test')

  assert.match(ics, /METHOD:PUBLISH/)
  assert.match(ics, /ORGANIZER:mailto:primary\.attendee@example\.test/)
  assert.doesNotMatch(ics, /DESCRIPTION:/)
  assert.doesNotMatch(ics, /LOCATION:/)
  assert.ok(ics.includes('SUMMARY:Comma\\, semicolon\\; slash \\\\'))
})

test('buildEventIcs throws on invalid datetime', () => {
  assert.throws(
    () => buildEventIcs({ summary: 'Demo', start: 'wat', end: '2026-05-07T18:30:00+02:00' }, 'uid-3'),
    (error: unknown) => error instanceof CliError && error.code === 'invalid_datetime',
  )
})

test('parseCalendarEvent reads unfolded ICS fields', () => {
  const raw = [
    'BEGIN:VCALENDAR',
    'BEGIN:VEVENT',
    'SUMMARY:Project sync',
    'DESCRIPTION:Line 1\\n',
    ' Line 2',
    'LOCATION:Belgrade',
    'DTSTART:20260507T160000Z',
    'DTEND:20260507T163000Z',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')

  const event = parseCalendarEvent(raw, 'https://example.com/event.ics')
  assert.equal(event.summary, 'Project sync')
  assert.equal(event.location, 'Belgrade')
  assert.equal(event.start, '20260507T160000Z')
  assert.equal(event.end, '20260507T163000Z')
  assert.equal(event.url, 'https://example.com/event.ics')
})

test('parseCalendarEvent falls back for non-string or malformed ICS fields', () => {
  const raw = [
    'BEGIN:VCALENDAR',
    'BEGIN:VEVENT',
    'SUMMARY;LANGUAGE=en',
    'LOCATION',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')

  const malformed = parseCalendarEvent(raw, 'https://example.com/malformed.ics')
  const fromNonString = parseCalendarEvent({ no: 'ics' }, 'https://example.com/empty.ics')

  assert.equal(malformed.summary, 'Untitled event')
  assert.equal(malformed.location, undefined)
  assert.equal(fromNonString.summary, 'Untitled event')
  assert.equal(fromNonString.start, undefined)
})
