import { prisma } from "@/lib/prisma";
import { DEFAULT_START, DEFAULT_END, DEFAULT_DAYS, toMinutes } from "@/lib/time";
import type { TimeWindow } from "@/lib/time";

export { DEFAULT_START, DEFAULT_END, DEFAULT_DAYS, toMinutes, addMinutes } from "@/lib/time";
export type { TimeWindow } from "@/lib/time";

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
