import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveWeeklyWindows } from "@/lib/availability";
import { arDayStart, arDayOfWeek, arDateKey, arInstant, getArParts } from "@/lib/time";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date"); // "YYYY-MM-DD" (fecha de pared en AR)
  const durationMin = Number(searchParams.get("durationMin") ?? 60);
  const serviceId = searchParams.get("serviceId");

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Parámetro date inválido" }, { status: 400 });
  }
  if (!Number.isFinite(durationMin) || durationMin <= 0 || durationMin > 24 * 60) {
    return NextResponse.json({ error: "Parámetro durationMin inválido" }, { status: 400 });
  }

  // Todo el cálculo se hace contra hora de pared argentina (UTC-3), nunca
  // contra la TZ local del servidor.
  const dayOfWeek = arDayOfWeek(date);
  const dayStart = arDayStart(date);
  const dayEnd = new Date(dayStart.getTime() + 24 * 3600000);

  const now = new Date();
  if (dayEnd <= now) {
    return NextResponse.json({ slots: [] });
  }
  const isToday = arDateKey(now) === date;

  const [weeklyWindows, blocked, appointments] = await Promise.all([
    resolveWeeklyWindows(id, serviceId),
    prisma.blockedSlot.findMany({
      where: { professionalId: id, startAt: { lt: dayEnd }, endAt: { gt: dayStart } },
      select: { startAt: true, endAt: true },
    }),
    prisma.appointment.findMany({
      where: {
        professionalId: id,
        startAt: { gte: dayStart, lt: dayEnd },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      select: { startAt: true, durationMin: true },
    }),
  ]);

  const windows = weeklyWindows.get(dayOfWeek) ?? [];

  const busy = [
    ...blocked.map((b) => ({
      start: b.startAt <= dayStart ? 0 : getArParts(b.startAt).minutes,
      end: b.endAt >= dayEnd ? 24 * 60 : getArParts(b.endAt).minutes,
    })),
    ...appointments.map((a) => {
      const start = getArParts(a.startAt).minutes;
      return { start, end: start + (a.durationMin ?? 60) };
    }),
  ];

  const slots: string[] = [];
  const step = 30;

  for (const w of windows) {
    for (let t = w.start; t + durationMin <= w.end; t += step) {
      if (isToday && arInstant(date, t) <= now) continue;
      const overlaps = busy.some((b) => t < b.end && t + durationMin > b.start);
      if (overlaps) continue;
      const h = String(Math.floor(t / 60)).padStart(2, "0");
      const m = String(t % 60).padStart(2, "0");
      slots.push(`${h}:${m}`);
    }
  }

  return NextResponse.json({ slots });
}
