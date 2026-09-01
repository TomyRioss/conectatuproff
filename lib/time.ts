export const DEFAULT_START = "09:00";
export const DEFAULT_END = "18:00";
export const DEFAULT_DAYS = [1, 2, 3, 4, 5, 6]; // fallback Lun-Sáb 9-18 cuando nadie configuró nada

export const AR_TIMEZONE = "America/Argentina/Buenos_Aires";
// Argentina no usa DST desde 2019: offset fijo UTC-3.
const AR_OFFSET_MIN = 180;

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

export type ArParts = {
  year: number;
  month: number; // 1-12
  day: number;
  dayOfWeek: number; // 0=Dom..6=Sáb
  minutes: number; // minutos desde medianoche (hora de pared AR)
};

/** Partes de calendario de un instante, en hora de pared argentina. */
export function getArParts(d: Date): ArParts {
  const shifted = new Date(d.getTime() - AR_OFFSET_MIN * 60000);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    dayOfWeek: shifted.getUTCDay(),
    minutes: shifted.getUTCHours() * 60 + shifted.getUTCMinutes(),
  };
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** "YYYY-MM-DD" en hora AR para un instante dado. */
export function arDateKey(d: Date): string {
  const p = getArParts(d);
  return `${p.year}-${pad2(p.month)}-${pad2(p.day)}`;
}

/** Instante UTC del inicio (medianoche) de una fecha de pared AR "YYYY-MM-DD". */
export function arDayStart(dateKey: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d) + AR_OFFSET_MIN * 60000);
}

/** Día de semana (0=Dom..6=Sáb) de una fecha de pared AR "YYYY-MM-DD". */
export function arDayOfWeek(dateKey: string): number {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** Instante UTC de una hora de pared AR: fecha "YYYY-MM-DD" + minutos desde medianoche. */
export function arInstant(dateKey: string, minutes: number): Date {
  return new Date(arDayStart(dateKey).getTime() + minutes * 60000);
}
