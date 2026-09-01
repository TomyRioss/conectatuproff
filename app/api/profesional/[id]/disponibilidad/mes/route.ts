import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveWeeklyWindows } from "@/lib/availability";
import { arDayStart, arDayOfWeek, arDateKey, arInstant, getArParts } from "@/lib/time";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // "YYYY-MM" (mes de pared en AR)
  const serviceId = searchParams.get("serviceId");
  const durationMin = Number(searchParams.get("durationMin") ?? 60);

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: "Parámetro month inválido" }, { status: 400 });
  }
  if (!Number.isFinite(durationMin) || durationMin <= 0 || durationMin > 24 * 60) {
    return NextResponse.json({ error: "Parámetro durationMin inválido" }, { status: 400 });
  }

  // Cálculo en hora de pared argentina (UTC-3), independiente de la TZ del server.
  const [year, monthNum] = month.split("-").map(Number);
  const rangeStart = arDayStart(`${month}-01`);
  const daysInMonth = new Date(Date.UTC(year, monthNum, 0)).getUTCDate();
  const rangeEnd = new Date(rangeStart.getTime() + daysInMonth * 24 * 3600000);
  const now = new Date();

  const [weeklyWindows, blocked, appointments] = await Promise.all([
    resolveWeeklyWindows(id, serviceId),
    prisma.blockedSlot.findMany({
      where: { professionalId: id, startAt: { lt: rangeEnd }, endAt: { gt: rangeStart } },
      select: { startAt: true, endAt: true },
    }),
    prisma.appointment.findMany({
      where: {
        professionalId: id,
        startAt: { gte: rangeStart, lt: rangeEnd },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      select: { startAt: true, durationMin: true },
    }),
  ]);

  const dates: string[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${year}-${String(monthNum).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dayStart = arDayStart(dateKey);
    const dayEnd = new Date(dayStart.getTime() + 24 * 3600000);
    if (dayEnd <= now) continue;

    const windows = weeklyWindows.get(arDayOfWeek(dateKey)) ?? [];
    if (windows.length === 0) continue;

    const busy = [
      ...blocked
        .filter((b) => b.startAt < dayEnd && b.endAt > dayStart)
        .map((b) => ({
          start: b.startAt <= dayStart ? 0 : getArParts(b.startAt).minutes,
          end: b.endAt >= dayEnd ? 24 * 60 : getArParts(b.endAt).minutes,
        })),
      ...appointments
        .filter((a) => a.startAt >= dayStart && a.startAt < dayEnd)
        .map((a) => {
          const start = getArParts(a.startAt).minutes;
          return { start, end: start + (a.durationMin ?? 60) };
        }),
    ];

    const isToday = arDateKey(now) === dateKey;

    const hasSlot = windows.some((w) => {
      for (let t = w.start; t + durationMin <= w.end; t += 30) {
        if (isToday && arInstant(dateKey, t) <= now) continue;
        const overlaps = busy.some((b) => t < b.end && t + durationMin > b.start);
        if (!overlaps) return true;
      }
      return false;
    });

    if (hasSlot) dates.push(dateKey);
  }

  return NextResponse.json({ dates });
}
