"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import AgendaDiaModal from "./AgendaDiaModal"
import type { AgendaData } from "./types"

const DIAS = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"]

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export default function AgendaCalendario() {
  const [cursor, setCursor] = useState(() => new Date())
  const [data, setData] = useState<AgendaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const monthParam = `${year}-${String(month + 1).padStart(2, "0")}`

  useEffect(() => {
    setLoading(true)
    fetch(`/api/profesional/agenda?month=${monthParam}`)
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error || "Error al cargar agenda")
        return res.json()
      })
      .then(setData)
      .catch((e) => {
        console.error(e)
        toast.error(e.message || "Error al cargar agenda")
        setData({ appointments: [], blockedSlots: [] })
      })
      .finally(() => setLoading(false))
  }, [monthParam])

  const eventsByDay = useMemo(() => {
    const map = new Map<string, { hasAppointment: boolean; hasBlocked: boolean }>()
    if (!data) return map
    for (const a of data.appointments) {
      const key = toDateKey(new Date(a.startAt))
      const entry = map.get(key) || { hasAppointment: false, hasBlocked: false }
      entry.hasAppointment = true
      map.set(key, entry)
    }
    for (const b of data.blockedSlots) {
      const key = toDateKey(new Date(b.startAt))
      const entry = map.get(key) || { hasAppointment: false, hasBlocked: false }
      entry.hasBlocked = true
      map.set(key, entry)
    }
    return map
  }, [data])

  const firstDayOfMonth = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startWeekday = firstDayOfMonth.getDay()
  const cells: (Date | null)[] = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ]

  const today = new Date()
  const isToday = (d: Date) =>
    d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate()

  const refresh = () => {
    fetch(`/api/profesional/agenda?month=${monthParam}`)
      .then((res) => res.json())
      .then(setData)
      .catch((e) => {
        console.error(e)
        toast.error("Error al recargar agenda")
      })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Button variant="outline" size="icon" onClick={() => setCursor(new Date(year, month - 1, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold text-brand-dark capitalize">
          {cursor.toLocaleDateString("es-AR", { month: "long", year: "numeric" })}
        </h2>
        <Button variant="outline" size="icon" onClick={() => setCursor(new Date(year, month + 1, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-brand-gray mb-2">
        {DIAS.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-brand-gray py-12">Cargando...</div>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (!d) return <div key={i} />
            const key = toDateKey(d)
            const ev = eventsByDay.get(key)
            return (
              <button
                key={key}
                onClick={() => setSelectedDay(d)}
                className={`aspect-square rounded-lg border border-gray-200 bg-white p-1 flex flex-col items-center justify-start hover:border-brand-violet transition-colors ${
                  isToday(d) ? "ring-2 ring-brand-green" : ""
                }`}
              >
                <span className="text-sm text-brand-dark">{d.getDate()}</span>
                <div className="flex gap-0.5 mt-1">
                  {ev?.hasAppointment && <span className="h-1.5 w-1.5 rounded-full bg-brand-violet" />}
                  {ev?.hasBlocked && <span className="h-1.5 w-1.5 rounded-full bg-brand-gray" />}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {selectedDay && data && (
        <AgendaDiaModal
          day={selectedDay}
          data={data}
          onClose={() => setSelectedDay(null)}
          onChanged={refresh}
        />
      )}
    </div>
  )
}
