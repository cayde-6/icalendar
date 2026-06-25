export type EventAttendee = {
  email: string
  commonName?: string
}

export type EventDraft = {
  summary: string
  start: string
  end: string
  description?: string
  location?: string
  attendees?: EventAttendee[]
}

export type EventUpdate = EventDraft & {
  url: string
  removeAttendees?: string[]
}

export type EventMutationResult = {
  ok: boolean
  calendarName: string
  url: string
}
