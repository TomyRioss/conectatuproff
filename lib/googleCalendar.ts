import { google } from "googleapis";
import { prisma } from "@/lib/prisma";

const SCOPES = ["https://www.googleapis.com/auth/calendar.events"];

export function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CALENDAR_CLIENT_ID,
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
    process.env.GOOGLE_CALENDAR_REDIRECT_URI
  );
}

export function getAuthUrl(state: string) {
  const client = getOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
    state,
  });
}

type ProTokens = {
  id: string;
  googleAccessToken: string | null;
  googleRefreshToken: string | null;
  googleTokenExpiry: Date | null;
  googleCalendarId: string | null;
};

async function getValidClient(pro: ProTokens) {
  if (!pro.googleRefreshToken) return null;

  const client = getOAuthClient();
  client.setCredentials({
    access_token: pro.googleAccessToken ?? undefined,
    refresh_token: pro.googleRefreshToken,
    expiry_date: pro.googleTokenExpiry?.getTime(),
  });

  const isExpired = !pro.googleTokenExpiry || pro.googleTokenExpiry.getTime() < Date.now() + 60_000;
  if (isExpired) {
    const { credentials } = await client.refreshAccessToken();
    client.setCredentials(credentials);
    await prisma.professional.update({
      where: { id: pro.id },
      data: {
        googleAccessToken: credentials.access_token ?? null,
        googleTokenExpiry: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
      },
    });
  }

  return client;
}

export async function createGoogleEvent(
  pro: ProTokens,
  event: { summary: string; description?: string; start: Date; end: Date }
) {
  const client = await getValidClient(pro);
  if (!client) return null;

  const calendar = google.calendar({ version: "v3", auth: client });
  const res = await calendar.events.insert({
    calendarId: pro.googleCalendarId ?? "primary",
    requestBody: {
      summary: event.summary,
      description: event.description,
      start: { dateTime: event.start.toISOString() },
      end: { dateTime: event.end.toISOString() },
    },
  });
  return res.data.id ?? null;
}

export async function updateGoogleEvent(
  pro: ProTokens,
  eventId: string,
  event: { summary: string; description?: string; start: Date; end: Date }
) {
  const client = await getValidClient(pro);
  if (!client) return;

  const calendar = google.calendar({ version: "v3", auth: client });
  await calendar.events.patch({
    calendarId: pro.googleCalendarId ?? "primary",
    eventId,
    requestBody: {
      summary: event.summary,
      description: event.description,
      start: { dateTime: event.start.toISOString() },
      end: { dateTime: event.end.toISOString() },
    },
  });
}

export async function deleteGoogleEvent(pro: ProTokens, eventId: string) {
  const client = await getValidClient(pro);
  if (!client) return;

  const calendar = google.calendar({ version: "v3", auth: client });
  try {
    await calendar.events.delete({ calendarId: pro.googleCalendarId ?? "primary", eventId });
  } catch (e) {
    console.error("deleteGoogleEvent", e);
  }
}

export async function listGoogleEvents(pro: ProTokens, timeMin: Date, timeMax: Date) {
  const client = await getValidClient(pro);
  if (!client) return [];

  const calendar = google.calendar({ version: "v3", auth: client });
  const res = await calendar.events.list({
    calendarId: pro.googleCalendarId ?? "primary",
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
  });
  return (res.data.items ?? []).filter((ev) => ev.start?.dateTime && ev.end?.dateTime);
}

const SYNC_INTERVAL_MS = 60_000;

export async function syncGoogleEventsToBlockedSlots(
  pro: ProTokens & { googleConnected: boolean; googleLastSyncAt: Date | null },
  start: Date,
  end: Date
) {
  if (!pro.googleConnected) return;
  if (pro.googleLastSyncAt && Date.now() - pro.googleLastSyncAt.getTime() < SYNC_INTERVAL_MS) return;

  const events = await listGoogleEvents(pro, start, end);

  await prisma.$transaction([
    prisma.blockedSlot.deleteMany({
      where: { professionalId: pro.id, googleEventId: { not: null }, startAt: { gte: start, lt: end } },
    }),
    ...events.map((ev) =>
      prisma.blockedSlot.create({
        data: {
          professionalId: pro.id,
          startAt: new Date(ev.start!.dateTime!),
          endAt: new Date(ev.end!.dateTime!),
          reason: "OTHER",
          note: ev.summary || "Evento de Google Calendar",
          googleEventId: ev.id,
        },
      })
    ),
    prisma.professional.update({ where: { id: pro.id }, data: { googleLastSyncAt: new Date() } }),
  ]);
}
