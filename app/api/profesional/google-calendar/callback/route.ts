import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOAuthClient } from "@/lib/googleCalendar";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const professionalId = searchParams.get("state");
  const agendaUrl = new URL("/profesional/agenda", req.url);

  if (!code || !professionalId) {
    agendaUrl.searchParams.set("google", "error");
    return NextResponse.redirect(agendaUrl);
  }

  try {
    const client = getOAuthClient();
    const { tokens } = await client.getToken(code);

    await prisma.professional.update({
      where: { id: professionalId },
      data: {
        googleAccessToken: tokens.access_token ?? null,
        googleRefreshToken: tokens.refresh_token ?? undefined,
        googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        googleCalendarId: "primary",
        googleConnected: true,
      },
    });

    agendaUrl.searchParams.set("google", "connected");
  } catch (e) {
    console.error("GET /api/profesional/google-calendar/callback", e);
    agendaUrl.searchParams.set("google", "error");
  }

  return NextResponse.redirect(agendaUrl);
}
