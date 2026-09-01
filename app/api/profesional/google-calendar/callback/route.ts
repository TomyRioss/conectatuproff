import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOAuthClient } from "@/lib/googleCalendar";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const agendaUrl = new URL("/profesional/agenda", req.url);

  // CSRF protection: the state must match the professional profile of the
  // authenticated user completing this OAuth flow — never trust it alone.
  const session = await auth();
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PROFESSIONAL") {
    agendaUrl.searchParams.set("google", "error");
    return NextResponse.redirect(agendaUrl);
  }

  if (!code || !state) {
    agendaUrl.searchParams.set("google", "error");
    return NextResponse.redirect(agendaUrl);
  }

  try {
    const pro = await prisma.professional.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!pro || pro.id !== state) {
      agendaUrl.searchParams.set("google", "error");
      return NextResponse.redirect(agendaUrl);
    }

    const client = getOAuthClient(new URL(req.url).origin);
    const { tokens } = await client.getToken(code);

    await prisma.professional.update({
      where: { id: pro.id },
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
