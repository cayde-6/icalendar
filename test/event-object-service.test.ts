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

test('EventObjectService.update fetches existing object and updates it with If-Match', async () => {
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
  assert.equal(updatedObject?.etag, 'etag-1')
  assert.deepEqual(updatedHeaders, { 'If-Match': 'etag-1' })
  assert.match(String(updatedObject?.data), /UID:stable-uid/)
  assert.match(String(updatedObject?.data), /TRIGGER:-PT1H/)
  assert.match(String(updatedObject?.data), /secondary\.attendee@example\.test/)
})
