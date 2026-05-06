export type RuntimeConfig = {
  serverUrl: string
  username: string
  password: string
  calendarName?: string
  rangeStart?: string
  rangeEnd?: string
  expandRecurring?: boolean
}

export interface ConfigReaderPort {
  readRuntimeConfig(): RuntimeConfig
}
