import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveWeeklyWindows } from "@/lib/availability";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date"); // "YYYY-MM-DD"
  const durationMin = Number(searchParams.get("durationMin") ?? 60);
  const serviceId = searchParams.get("serviceId");

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Parámetro date inválido" }, { status: 400 });
  }

  const [year, month, day] = date.split("-").map(Number);
  const dayStart = new Date(year, month - 1, day, 0, 0, 0);
  const dayEnd = new Date(year, month - 1, day, 23, 59, 59);
  const dayOfWeek = dayStart.getDay();

  if (dayStart < new Date(new Date().setHours(0, 0, 0, 0))) {
    return NextResponse.json({ slots: [] });
  }

  const [weeklyWindows, blocked, appointments] = await Promise.all([
    resolveWeeklyWindows(id, serviceId),
    prisma.blockedSlot.findMany({ where: { professionalId: id, startAt: { lt: dayEnd }, endAt: { gt: dayStart } } }),
    prisma.appointment.findMany({
      where: { professionalId: id, startAt: { gte: dayStart, lte: dayEnd }, status: { in: ["PENDING", "CONFIRMED"] } },
      select: { startAt: true, durationMin: true },
    }),
  ]);

  const windows = weeklyWindows.get(dayOfWeek) ?? [];

  const busy = [
    ...blocked.map((b) => ({
      start: b.startAt <= dayStart ? 0 : b.startAt.getHours() * 60 + b.startAt.getMinutes(),
      end: b.endAt >= dayEnd ? 24 * 60 : b.endAt.getHours() * 60 + b.endAt.getMinutes(),
    })),
    ...appointments.map((a) => {
      const start = a.startAt.getHours() * 60 + a.startAt.getMinutes();
      return { start, end: start + (a.durationMin ?? 60) };
    }),
  ];

  const slots: string[] = [];
  const step = 30;
  const isToday = dayStart.toDateString() === new Date().toDateString();
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();

  for (const w of windows) {
    for (let t = w.start; t + durationMin <= w.end; t += step) {
      if (isToday && t <= nowMinutes) continue;
      const overlaps = busy.some((b) => t < b.end && t + durationMin > b.start);
      if (overlaps) continue;
      const h = String(Math.floor(t / 60)).padStart(2, "0");
      const m = String(t % 60).padStart(2, "0");
      slots.push(`${h}:${m}`);
    }
  }

  return NextResponse.json({ slots });
}
