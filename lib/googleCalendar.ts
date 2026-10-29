import { google } from "googleapis";
import { prisma } from "@/lib/prisma";
import { arDayStart } from "@/lib/time";

const SCOPES = ["https://www.googleapis.com/auth/calendar.events"];

// redirect_uri debe coincidir exacto entre connect y callback. Si hay origin del
// request lo usamos (cualquier puerto); si no, cae al env (scripts/cron).
function redirectUri(origin?: string) {
  return origin
    ? `${origin}/api/profesional/google-calendar/callback`
    : process.env.GOOGLE_CALENDAR_REDIRECT_URI;
}

export function getOAuthClient(origin?: string) {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CALENDAR_CLIENT_ID,
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
    redirectUri(origin)
  );
}

export function getAuthUrl(state: string, origin?: string) {
  const client = getOAuthClient(origin);
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
  if (!client) return false;

  const calendar = google.calendar({ version: "v3", auth: client });
  try {
    await calendar.events.delete({ calendarId: pro.googleCalendarId ?? "primary", eventId });
    return true;
  } catch (e) {
    console.error("deleteGoogleEvent", e);
    return false;
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
  return (res.data.items ?? []).filter(
    (ev) =>
      ev.id &&
      (ev.start?.dateTime || ev.start?.date) &&
      (ev.end?.dateTime || ev.end?.date)
  );
}

export async function syncGoogleEventsToBlockedSlots(
  pro: ProTokens & { googleConnected: boolean; googleLastSyncAt: Date | null },
  start: Date,
  end: Date
) {
  if (!pro.googleConnected) return;
  if (!pro.googleRefreshToken) throw new Error("Google Calendar necesita reconectarse");

  const events = await listGoogleEvents(pro, start, end);

  await prisma.$transaction([
    prisma.blockedSlot.deleteMany({
      where: {
        professionalId: pro.id,
        googleEventId: { not: null },
        startAt: { lt: end },
        endAt: { gt: start },
      },
    }),
    ...events.map((ev) =>
      prisma.blockedSlot.create({
        data: {
          professionalId: pro.id,
          startAt: ev.start!.dateTime ? new Date(ev.start!.dateTime) : arDayStart(ev.start!.date!),
          endAt: ev.end!.dateTime ? new Date(ev.end!.dateTime) : arDayStart(ev.end!.date!),
          reason: "OTHER",
          note: ev.summary || "Evento de Google Calendar",
          googleEventId: ev.id,
        },
      })
    ),
    prisma.professional.update({ where: { id: pro.id }, data: { googleLastSyncAt: new Date() } }),
  ]);
}

export async function syncProfessionalAppointmentsToGoogleCalendar(professionalId: string) {
  const pro = await prisma.professional.findUnique({
    where: { id: professionalId },
    select: {
      id: true,
      googleAccessToken: true,
      googleRefreshToken: true,
      googleTokenExpiry: true,
      googleCalendarId: true,
      googleConnected: true,
    },
  });
  if (!pro || !pro.googleConnected || !pro.googleRefreshToken) {
    throw new Error("Google Calendar no está conectado");
  }

  const now = new Date();
  const appointments = await prisma.appointment.findMany({
    where: {
      professionalId,
      OR: [
        { status: { in: ["PENDING", "CONFIRMED"] }, startAt: { gte: now } },
        { googleEventId: { not: null } },
      ],
    },
    select: {
      id: true,
      startAt: true,
      durationMin: true,
      status: true,
      googleEventId: true,
      client: { select: { firstName: true, lastName: true } },
      service: { select: { title: true } },
    },
    orderBy: { startAt: "asc" },
  });

  let created = 0;
  let updated = 0;
  let deleted = 0;

  for (const appointment of appointments) {
    const isActive =
      (appointment.status === "PENDING" || appointment.status === "CONFIRMED") &&
      appointment.startAt >= now;

    if (!isActive) {
      if (appointment.googleEventId) {
        const removed = await deleteGoogleEvent(pro, appointment.googleEventId);
        if (!removed) throw new Error("No se pudo quitar un turno cancelado de Google Calendar");
        await prisma.appointment.update({
          where: { id: appointment.id },
          data: { googleEventId: null },
        });
        deleted += 1;
      }
      continue;
    }

    const clientName = appointment.client
      ? `${appointment.client.firstName} ${appointment.client.lastName}`.trim()
      : "Cliente";
    const event = {
      summary: `${appointment.service?.title ?? "Turno"} · ${clientName}`,
      description: "Turno agendado desde Conecta Tu Proff",
      start: appointment.startAt,
      end: new Date(appointment.startAt.getTime() + (appointment.durationMin ?? 60) * 60_000),
    };

    if (appointment.googleEventId) {
      await updateGoogleEvent(pro, appointment.googleEventId, event);
      updated += 1;
    } else {
      const eventId = await createGoogleEvent(pro, event);
      if (eventId) {
        await prisma.appointment.update({
          where: { id: appointment.id },
          data: { googleEventId: eventId },
        });
        created += 1;
      }
    }
  }

  return { created, updated, deleted };
}
