import { CliError } from '../../shared/errors/cli-error.js'

export type TimeRange = {
  start: string
  end: string
}

export const toCalDavTime = (date: Date): string => {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
}

export const addDays = (date: Date, days: number): Date => {
  const next = new Date(date)
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

export const buildTimeRange = (start?: string, end?: string): TimeRange | undefined => {
  if (!start && !end) return undefined

  const startDate = start ? new Date(start) : new Date()
  const endDate = end ? new Date(end) : addDays(startDate, 30)

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throw new CliError('invalid_time_range', 'Invalid CALDAV_RANGE_START/CALDAV_RANGE_END value')
  }

  if (startDate >= endDate) {
    throw new CliError('invalid_time_range', 'CALDAV_RANGE_START must be earlier than CALDAV_RANGE_END')
  }

  return {
    start: toCalDavTime(startDate),
    end: toCalDavTime(endDate),
  }
}
