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
    const t = setTimeout(() => {
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
    }, 0)
    return () => clearTimeout(t)
  }, [monthParam])

  const eventsByDay = useMemo(() => {
    const map = new Map<string, string[]>()
    if (!data) return map
    for (const a of data.appointments) {
      const key = toDateKey(new Date(a.startAt))
      const name = a.service?.title || `${a.client.firstName} ${a.client.lastName}`
      map.set(key, [...(map.get(key) || []), name])
    }
    for (const b of data.blockedSlots) {
      const key = toDateKey(new Date(b.startAt))
      const name = b.note || "Bloqueado"
      map.set(key, [...(map.get(key) || []), name])
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
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <Button variant="outline" size="icon" onClick={() => setCursor(new Date(year, month - 1, 1))} className="min-h-[44px] min-w-[44px]" aria-label="Mes anterior">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-base sm:text-lg font-semibold text-brand-dark capitalize">
          {cursor.toLocaleDateString("es-AR", { month: "long", year: "numeric" })}
        </h2>
        <Button variant="outline" size="icon" onClick={() => setCursor(new Date(year, month + 1, 1))} className="min-h-[44px] min-w-[44px]" aria-label="Mes siguiente">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 lg:gap-2 text-center text-[11px] sm:text-xs lg:text-sm font-medium text-brand-gray mb-2">
        {DIAS.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-brand-gray py-12">Cargando...</div>
      ) : (
        <div className="grid grid-cols-7 gap-1 lg:gap-2">
          {cells.map((d, i) => {
            if (!d) return <div key={i} />
            const key = toDateKey(d)
            const names = eventsByDay.get(key) || []
            return (
              <button
                key={key}
                onClick={() => setSelectedDay(d)}
                className={`min-h-[56px] sm:min-h-24 lg:min-h-32 rounded-lg border border-gray-200 bg-white p-0.5 sm:p-1 lg:p-2 flex flex-col items-center hover:border-brand-violet active:bg-brand-bg transition-colors min-w-0 ${
                  isToday(d) ? "ring-2 ring-brand-green" : ""
                }`}
              >
                <span className="text-[13px] sm:text-sm lg:text-base text-brand-dark">{d.getDate()}</span>
                {names.length > 0 && names.length <= 3 && (
                  <>
                    <div className="mt-1 hidden sm:block w-full space-y-0.5 lg:space-y-1">
                      {names.map((n, idx) => (
                        <p
                          key={idx}
                          className="text-[10px] lg:text-xs leading-tight text-brand-dark truncate border border-gray-200 rounded px-1 py-0.5 bg-brand-bg"
                        >
                          {n}
                        </p>
                      ))}
                    </div>
                    <div className="mt-1 flex sm:hidden items-center gap-1" aria-hidden>
                      {names.map((_, idx) => (
                        <span key={idx} className="h-1.5 w-1.5 rounded-full bg-brand-violet" />
                      ))}
                    </div>
                  </>
                )}
                {names.length > 3 && (
                  <p className="mt-1 text-[10px] sm:text-[10px] lg:text-xs leading-tight text-brand-violet font-medium border border-brand-violet/30 rounded px-1 py-0.5 max-w-full truncate">
                    {names.length} turnos
                  </p>
                )}
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
