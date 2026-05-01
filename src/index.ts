import 'dotenv/config';
import { createDAVClient, type DAVCalendar } from 'tsdav';
import { z } from 'zod';

const envSchema = z.object({
  CALDAV_SERVER_URL: z.string().url(),
  CALDAV_USERNAME: z.string().min(1),
  CALDAV_PASSWORD: z.string().min(1),
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
}

function printCalendars(calendars: DAVCalendar[]) {
  if (calendars.length === 0) {
    console.log('No calendars found.');
    return;
  }

  for (const calendar of calendars) {
    console.log(`- ${calendar.displayName ?? 'Untitled'} (${calendar.url})`);
  }
}

main().catch((error) => {
  console.error('Failed to connect to CalDAV:', error);
  process.exitCode = 1;
});
