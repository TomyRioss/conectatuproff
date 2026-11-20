// Formato ARS: 1500000 -> "$1.500.000". Vacío si no es un número > 0.
export function formatPrice(value: unknown) {
  if (value === null || value === undefined || value === "") return ""
  const n = Math.round(Number(String(value)))
  return Number.isFinite(n) && n > 0 ? `$${n.toLocaleString("es-AR")}` : ""
}

// Rango "$1.000-$2.000" (o un solo valor si min === max).
export function formatPriceRange(min: number | null | undefined, max: number | null | undefined) {
  const lo = formatPrice(min)
  const hi = formatPrice(max)
  if (!lo || !hi || lo === hi) return lo || hi
  return `${lo}-${hi}`
}
