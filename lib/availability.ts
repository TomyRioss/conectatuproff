import { prisma } from "@/lib/prisma";

export const DEFAULT_START = "09:00";
export const DEFAULT_END = "18:00";
export const DEFAULT_DAYS = [1, 2, 3, 4, 5, 6]; // ponytail: fallback Lun-Sáb 9-18 cuando nadie configuró nada

export type TimeWindow = { start: number; end: number };

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function addMinutes(hhmm: string, minutes: number): string {
  const total = toMinutes(hhmm) + minutes;
  const hh = String(Math.floor(total / 60) % 24).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

/**
 * Resuelve las ventanas horarias de cada día de la semana (0=Dom..6=Sáb).
 * Prioridad: horario propio del servicio (si tiene alguna fila configurada,
 * reemplaza por completo, día por día) > horario general del profesional >
 * fallback hardcodeado Lun-Sáb 9-18.
 */
export async function resolveWeeklyWindows(
  professionalId: string,
  serviceId?: string | null
): Promise<Map<number, TimeWindow[]>> {
  let rows: { dayOfWeek: number; startTime: string; endTime: string }[] = [];

  if (serviceId) {
    rows = await prisma.serviceAvailability.findMany({
      where: { serviceId },
      select: { dayOfWeek: true, startTime: true, endTime: true },
    });
  }

  const usingFallback = rows.length === 0;
  if (rows.length === 0) {
    rows = await prisma.professionalAvailability.findMany({
      where: { professionalId },
      select: { dayOfWeek: true, startTime: true, endTime: true },
    });
  }

  const map = new Map<number, TimeWindow[]>();
  for (let day = 0; day <= 6; day++) {
    const dayRows = rows.filter((r) => r.dayOfWeek === day);
    if (dayRows.length > 0) {
      map.set(
        day,
        dayRows.map((r) => ({ start: toMinutes(r.startTime), end: toMinutes(r.endTime) }))
      );
    } else if (rows.length === 0 && usingFallback && DEFAULT_DAYS.includes(day)) {
      map.set(day, [{ start: toMinutes(DEFAULT_START), end: toMinutes(DEFAULT_END) }]);
    } else {
      map.set(day, []);
    }
  }
  return map;
}
