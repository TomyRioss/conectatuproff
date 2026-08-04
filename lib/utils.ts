import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRelativeTime(date: Date | null): string {
  if (!date) return "Nunca"
  const diffMs = Date.now() - new Date(date).getTime()
  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 60) return "Hace instantes"
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `Hace ${diffMin} ${diffMin === 1 ? "minuto" : "minutos"}`
  const diffHrs = Math.floor(diffMin / 60)
  if (diffHrs < 24) return `Hace ${diffHrs} ${diffHrs === 1 ? "hora" : "horas"}`
  const diffDays = Math.floor(diffHrs / 24)
  if (diffDays < 30) return `Hace ${diffDays} ${diffDays === 1 ? "día" : "días"}`
  const diffMonths = Math.floor(diffDays / 30)
  if (diffMonths < 12) return `Hace ${diffMonths} ${diffMonths === 1 ? "mes" : "meses"}`
  const diffYears = Math.floor(diffMonths / 12)
  return `Hace ${diffYears} ${diffYears === 1 ? "año" : "años"}`
}
