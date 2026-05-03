import 'dotenv/config';
import { createDAVClient, type DAVCalendar, type DAVCalendarObject } from 'tsdav';
import { z } from 'zod';

const envSchema = z.object({
  CALDAV_SERVER_URL: z.string().url(),
  CALDAV_USERNAME: z.string().min(1),
  CALDAV_PASSWORD: z.string().min(1),
  CALDAV_CALENDAR_NAME: z.string().min(1).optional(),
  CALDAV_RANGE_START: z.string().datetime({ offset: true }).optional(),
  CALDAV_RANGE_END: z.string().datetime({ offset: true }).optional(),
  CALDAV_EXPAND_RECURRING: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
});

async function main() {
  const env = envSchema.parse(process.env);

  const client = await createDAVClient({
    serverUrl: env.CALDAV_SERVER_URL,
    credentials: {
      username: env.CALDAV_USERNAME,
      password: env.CALDAV_PASSWORD,
    },
    authMethod: 'Basic',
    defaultAccountType: 'caldav',
  });

  const calendars = await client.fetchCalendars();
  printCalendars(calendars);

  const selectedCalendar = pickCalendar(calendars, env.CALDAV_CALENDAR_NAME);
  if (!selectedCalendar) {
    return;
  }

  const timeRange = buildTimeRange(env.CALDAV_RANGE_START, env.CALDAV_RANGE_END);
  const objects = await client.fetchCalendarObjects({
    calendar: selectedCalendar,
    timeRange,
    expand: env.CALDAV_EXPAND_RECURRING,
  });

  printCalendarObjects(selectedCalendar, objects, timeRange);
}

function printCalendars(calendars: DAVCalendar[]) {
  if (calendars.length === 0) {
    console.log('No calendars found.');
    return;
  }

  console.log('Calendars:');
  for (const calendar of calendars) {
    console.log(`- ${calendar.displayName ?? 'Untitled'} (${calendar.url})`);
  }
}

function pickCalendar(calendars: DAVCalendar[], calendarName?: string) {
  if (calendars.length === 0) {
    return undefined;
  }

  if (!calendarName) {
    return calendars[0];
  }

  const normalizedTarget = calendarName.trim().toLowerCase();
  return calendars.find((calendar) => {
    const displayName = String(calendar.displayName ?? '').trim().toLowerCase();
    return displayName === normalizedTarget;
  });
}

function buildTimeRange(start?: string, end?: string) {
  if (!start && !end) {
    return undefined;
  }

  const startDate = start ? new Date(start) : new Date();
  const endDate = end ? new Date(end) : addDays(startDate, 30);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throw new Error('Invalid CALDAV_RANGE_START/CALDAV_RANGE_END value');
  }

  if (startDate >= endDate) {
    throw new Error('CALDAV_RANGE_START must be earlier than CALDAV_RANGE_END');
  }

  return {
    start: toCalDavTime(startDate),
    end: toCalDavTime(endDate),
  };
}

function printCalendarObjects(
  calendar: DAVCalendar,
  objects: DAVCalendarObject[],
  timeRange?: { start: string; end: string },
) {
  const label = calendar.displayName ?? 'Untitled';
  const rangeLabel = timeRange ? ` for ${timeRange.start} → ${timeRange.end}` : '';

  console.log(`\nEvents in ${label}${rangeLabel}:`);

  if (objects.length === 0) {
    console.log('- No events found.');
    return;
  }

  for (const object of objects) {
    const event = parseEvent(object.data);
    console.log(`- ${event.summary} | ${event.start ?? 'unknown start'} | ${object.url}`);
  }
}

function parseEvent(raw: unknown) {
  const ics = typeof raw === 'string' ? raw : '';
  return {
    summary: readIcsField(ics, 'SUMMARY') ?? 'Untitled event',
    start: readIcsField(ics, 'DTSTART'),
  };
}

function readIcsField(ics: string, fieldName: string) {
  const lines = unfoldIcsLines(ics);
  const prefix = `${fieldName}:`;

  const line = lines.find((entry) => entry.startsWith(prefix) || entry.startsWith(`${fieldName};`));
  if (!line) {
    return undefined;
  }

  const separatorIndex = line.indexOf(':');
  return separatorIndex === -1 ? undefined : line.slice(separatorIndex + 1).trim();
}

function unfoldIcsLines(ics: string) {
  return ics
    .replace(/\r\n[ \t]/g, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function toCalDavTime(date: Date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

main().catch((error) => {
  console.error('Failed to connect to CalDAV:', error);
  process.exitCode = 1;
});
