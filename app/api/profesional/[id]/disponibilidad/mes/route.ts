import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveWeeklyWindows } from "@/lib/availability";

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // "YYYY-MM"
  const serviceId = searchParams.get("serviceId");
  const durationMin = Number(searchParams.get("durationMin") ?? 60);

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: "Parámetro month inválido" }, { status: 400 });
  }

  const [year, monthNum] = month.split("-").map(Number);
  const rangeStart = new Date(year, monthNum - 1, 1);
  const rangeEnd = new Date(year, monthNum, 1);
  const today = new Date(new Date().setHours(0, 0, 0, 0));

  const [weeklyWindows, blocked, appointments] = await Promise.all([
    resolveWeeklyWindows(id, serviceId),
    prisma.blockedSlot.findMany({
      where: { professionalId: id, startAt: { lt: rangeEnd }, endAt: { gt: rangeStart } },
    }),
    prisma.appointment.findMany({
      where: { professionalId: id, startAt: { gte: rangeStart, lt: rangeEnd }, status: { in: ["PENDING", "CONFIRMED"] } },
      select: { startAt: true, durationMin: true },
    }),
  ]);

  const dates: string[] = [];
  const daysInMonth = new Date(year, monthNum, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const dayStart = new Date(year, monthNum - 1, day, 0, 0, 0);
    const dayEnd = new Date(year, monthNum - 1, day, 23, 59, 59);
    if (dayStart < today) continue;

    const windows = weeklyWindows.get(dayStart.getDay()) ?? [];
    if (windows.length === 0) continue;

    const busy = [
      ...blocked
        .filter((b) => b.startAt < dayEnd && b.endAt > dayStart)
        .map((b) => ({
          start: b.startAt <= dayStart ? 0 : b.startAt.getHours() * 60 + b.startAt.getMinutes(),
          end: b.endAt >= dayEnd ? 24 * 60 : b.endAt.getHours() * 60 + b.endAt.getMinutes(),
        })),
      ...appointments
        .filter((a) => a.startAt >= dayStart && a.startAt <= dayEnd)
        .map((a) => {
          const start = a.startAt.getHours() * 60 + a.startAt.getMinutes();
          return { start, end: start + (a.durationMin ?? 60) };
        }),
    ];

    const isToday = dayStart.toDateString() === new Date().toDateString();
    const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();

    const hasSlot = windows.some((w) => {
      for (let t = w.start; t + durationMin <= w.end; t += 30) {
        if (isToday && t <= nowMinutes) continue;
        const overlaps = busy.some((b) => t < b.end && t + durationMin > b.start);
        if (!overlaps) return true;
      }
      return false;
    });

    if (hasSlot) dates.push(toDateKey(dayStart));
  }

  return NextResponse.json({ dates });
}
