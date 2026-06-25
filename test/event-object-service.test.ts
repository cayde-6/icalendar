import test from 'node:test'
import assert from 'node:assert/strict'

import type { DAVCalendarObject } from 'tsdav'

import { EventObjectService, patchExistingEventIcs, type CalendarObjectClient } from '../src/infra/caldav/event-object.service.js'

const existingIcs = [
  'BEGIN:VCALENDAR',
  'VERSION:2.0',
  'METHOD:REQUEST',
  'BEGIN:VEVENT',
  'UID:stable-uid',
  'DTSTAMP:20260625T120000Z',
  'SEQUENCE:2',
  'STATUS:CONFIRMED',
  'DTSTART:20260626T173000Z',
  'DTEND:20260626T183000Z',
  'SUMMARY:Original',
  'ORGANIZER;CN=Bender:mailto:organizer@example.test',
  'ATTENDEE;CN=Primary;EMAIL=primary.attendee@example.test;PARTSTAT=ACCEPTED:/principal/primary',
  'BEGIN:VALARM',
  'ACTION:DISPLAY',
  'TRIGGER:-PT1H',
  'END:VALARM',
  'END:VEVENT',
  'END:VCALENDAR',
].join('\r\n') + '\r\n'

test('patchExistingEventIcs preserves UID, VALARM, and accepted attendee metadata while adding attendees', () => {
  const patched = patchExistingEventIcs(existingIcs, {
    url: 'event-url',
    summary: 'Updated',
    start: '2026-06-26T20:30:00+02:00',
    end: '2026-06-26T21:30:00+02:00',
    location: 'https://maps.example.test/place',
    description: 'Synthetic event',
    attendees: [{ email: 'secondary.attendee@example.test', commonName: 'Secondary' }],
  })

  assert.match(patched, /UID:stable-uid/)
  assert.match(patched, /SEQUENCE:3/)
  assert.match(patched, /BEGIN:VALARM\r\nACTION:DISPLAY\r\nTRIGGER:-PT1H\r\nEND:VALARM/)
  assert.match(patched, /ATTENDEE;CN=Primary;EMAIL=primary\.attendee@example\.test;PARTSTAT=ACCEPTED:\/principal\/primary/)
  assert.match(patched, /ATTENDEE;CN=Secondary;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:secondary\.attendee@example\.test/)
  assert.match(patched, /DTSTART:20260626T183000Z/)
  assert.match(patched, /DTEND:20260626T193000Z/)
  assert.match(patched, /SUMMARY:Updated/)
})

test('patchExistingEventIcs removes requested attendees without dropping alarms', () => {
  const patched = patchExistingEventIcs(existingIcs, {
    url: 'event-url',
    summary: 'Updated',
    start: '2026-06-26T20:30:00+02:00',
    end: '2026-06-26T21:30:00+02:00',
    removeAttendees: ['primary.attendee@example.test'],
  })

  assert.doesNotMatch(patched, /primary\.attendee@example\.test/)
  assert.match(patched, /UID:stable-uid/)
  assert.match(patched, /SEQUENCE:3/)
  assert.match(patched, /TRIGGER:-PT1H/)
})

test('patchExistingEventIcs does not duplicate existing attendees', () => {
  const patched = patchExistingEventIcs(existingIcs, {
    url: 'event-url',
    summary: 'Updated',
    start: '2026-06-26T20:30:00+02:00',
    end: '2026-06-26T21:30:00+02:00',
    attendees: [{ email: 'primary.attendee@example.test' }],
  })

  const attendeeMatches = patched.match(/primary\.attendee@example\.test/g) || []
  assert.equal(attendeeMatches.length, 1)
  assert.match(patched, /ATTENDEE;CN=Primary;EMAIL=primary\.attendee@example\.test;PARTSTAT=ACCEPTED:\/principal\/primary/)
  assert.match(patched, /TRIGGER:-PT1H/)
})

test('patchExistingEventIcs unfolds folded attendee lines before matching removals', () => {
  const foldedIcs = existingIcs.replace(
    'ATTENDEE;CN=Primary;EMAIL=primary.attendee@example.test;PARTSTAT=ACCEPTED:/principal/primary',
    'ATTENDEE;CN=Primary;EMAIL=primary.attendee@example.test;PARTSTAT=ACCEPTED:\r\n /principal/primary',
  )
  const patched = patchExistingEventIcs(foldedIcs, {
    url: 'event-url',
    summary: 'Updated',
    start: '2026-06-26T20:30:00+02:00',
    end: '2026-06-26T21:30:00+02:00',
    removeAttendees: ['primary.attendee@example.test'],
  })

  assert.doesNotMatch(patched, /primary\.attendee@example\.test/)
  assert.match(patched, /TRIGGER:-PT1H/)
})

test('patchExistingEventIcs adds METHOD:REQUEST and SEQUENCE when missing', () => {
  const bareIcs = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'BEGIN:VEVENT',
    'UID:bare-uid',
    'DTSTART:20260626T173000Z',
    'DTEND:20260626T183000Z',
    'SUMMARY:Original',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n') + '\r\n'

  const patched = patchExistingEventIcs(bareIcs, {
    url: 'event-url',
    summary: 'Updated',
    start: '2026-06-26T20:30:00+02:00',
    end: '2026-06-26T21:30:00+02:00',
    attendees: [{ email: 'secondary.attendee@example.test' }],
  })

  assert.match(patched, /VERSION:2\.0\r\nMETHOD:REQUEST/)
  assert.match(patched, /SEQUENCE:1/)
  assert.match(patched, /UID:bare-uid/)
})

test('EventObjectService.update fetches existing object and preserves metadata on update', async () => {
  let updatedObject: DAVCalendarObject | undefined
  let updatedHeaders: Record<string, string> | undefined
  const client: CalendarObjectClient = {
    async createCalendarObject() { throw new Error('unexpected') },
    async fetchCalendarObjects(params) {
      assert.deepEqual(params.objectUrls, ['https://caldav.example.com/cal/event.ics'])
      assert.equal(params.useMultiGet, true)
      return [{ url: 'https://caldav.example.com/cal/event.ics', data: existingIcs, etag: 'etag-1' } as DAVCalendarObject]
    },
    async updateCalendarObject(params) {
      updatedObject = params.calendarObject
      updatedHeaders = params.headers
    },
    async deleteCalendarObject() { throw new Error('unexpected') },
  }

  const service = new EventObjectService(client, { organizerEmail: 'organizer@example.test', organizerCommonName: 'Bender' })
  await service.update({ id: 'cal', displayName: 'Calendar', url: 'https://caldav.example.com/cal/' }, {
    url: 'https://caldav.example.com/cal/event.ics',
    summary: 'Updated',
    start: '2026-06-26T20:30:00+02:00',
    end: '2026-06-26T21:30:00+02:00',
    attendees: [{ email: 'secondary.attendee@example.test' }],
  })

  assert.equal(updatedObject?.url, 'https://caldav.example.com/cal/event.ics')
  assert.equal(updatedObject?.etag, undefined)
  assert.deepEqual(updatedHeaders, undefined)
  assert.match(String(updatedObject?.data), /UID:stable-uid/)
  assert.match(String(updatedObject?.data), /TRIGGER:-PT1H/)
  assert.match(String(updatedObject?.data), /secondary\.attendee@example\.test/)
})
