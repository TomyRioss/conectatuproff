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
