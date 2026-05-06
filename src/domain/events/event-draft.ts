export type EventDraft = {
  summary: string
  start: string
  end: string
  description?: string
  location?: string
}

export type EventUpdate = EventDraft & {
  url: string
}

export type EventMutationResult = {
  ok: boolean
  calendarName: string
  url: string
}
