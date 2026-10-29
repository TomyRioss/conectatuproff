"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { CalendarCheck, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatDuration } from "@/lib/time"

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmado",
  CANCELLED: "Cancelado",
  COMPLETED: "Completado",
  NO_SHOW: "No asistió",
}

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-brand-green/10 text-brand-green",
  CANCELLED: "bg-red-100 text-red-600",
  COMPLETED: "bg-brand-violet/10 text-brand-violet",
  NO_SHOW: "bg-gray-100 text-brand-gray",
}

type Cita = {
  id: string
  startAt: string
  durationMin: number | null
  status: string
  serviceName: string | null
  clientName: string
}

function fmtFecha(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })
}

function fmtHora(iso: string) {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

// Listado plano de todas las citas del profesional (pasadas y futuras) para
// administrarlas desde la agenda, no solo día por día en el calendario.
export default function AgendaCitasPanel() {
  const [citas, setCitas] = useState<Cita[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/profesional/agenda/citas")
      .then((r) => (r.ok ? r.json() : { citas: [] }))
      .then((data) => setCitas(data.citas ?? []))
      .catch(() => toast.error("No se pudieron cargar tus citas"))
      .finally(() => setLoading(false))
  }, [])

  async function cambiarEstado(id: string, status: string) {
    setUpdatingId(id)
    try {
      const res = await fetch(`/api/profesional/agenda/turno/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error((await res.json()).error || "Error al actualizar")
      setCitas((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)))
      toast.success("Cita actualizada")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al actualizar")
    } finally {
      setUpdatingId(null)
    }
  }

  const activas = citas.filter((c) => c.status === "PENDING" || c.status === "CONFIRMED")
  const historial = citas.filter((c) => c.status !== "PENDING" && c.status !== "CONFIRMED")

  return (
    <section className="bg-white rounded-2xl border border-gray-200 p-5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 text-left"
      >
        <span className="flex items-center gap-2 text-lg font-bold text-brand-dark font-display">
          <CalendarCheck size={18} className="text-brand-violet" />
          Mis citas agendadas
          {activas.length > 0 && (
            <span className="text-xs rounded-full bg-brand-violet text-white h-5 min-w-5 px-1.5 flex items-center justify-center">
              {activas.length}
            </span>
          )}
        </span>
        {open ? <ChevronUp size={18} className="text-brand-gray" /> : <ChevronDown size={18} className="text-brand-gray" />}
      </button>

      {open && (
        <div className="mt-4">
          {loading ? (
            <p className="text-sm text-brand-gray py-4">Cargando citas...</p>
          ) : citas.length === 0 ? (
            <p className="text-sm text-brand-gray py-4">Todavía no tenés citas agendadas.</p>
          ) : (
            <div className="flex flex-col gap-6">
              <div>
                <p className="text-xs font-semibold text-brand-gray uppercase tracking-wider mb-2">Próximas citas</p>
                {activas.length === 0 ? (
                  <p className="text-sm text-brand-gray">No hay citas próximas.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {activas.map((c) => (
                      <CitaRow key={c.id} cita={c} updatingId={updatingId} onStatus={cambiarEstado} />
                    ))}
                  </div>
                )}
              </div>

              {historial.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-brand-gray uppercase tracking-wider mb-2">Historial</p>
                  <div className="flex flex-col gap-2">
                    {historial.map((c) => (
                      <CitaRow key={c.id} cita={c} updatingId={updatingId} onStatus={cambiarEstado} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  )
}

function CitaRow({
  cita,
  updatingId,
  onStatus,
}: {
  cita: Cita
  updatingId: string | null
  onStatus: (id: string, status: string) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border border-gray-200 rounded-xl p-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-brand-dark capitalize">
          {fmtFecha(cita.startAt)} · {fmtHora(cita.startAt)} hs
        </p>
        <p className="text-xs text-brand-gray truncate">
          {cita.clientName}
          {cita.serviceName ? ` · ${cita.serviceName}` : ""}
          {cita.durationMin ? ` · ${formatDuration(cita.durationMin)}` : ""}
        </p>
      </div>
      <span className={`text-xs font-medium rounded-full px-2.5 py-1 ${STATUS_STYLE[cita.status] ?? "bg-gray-100"}`}>
        {STATUS_LABEL[cita.status] ?? cita.status}
      </span>
      {(cita.status === "PENDING" || cita.status === "CONFIRMED") && (
        <div className="flex gap-2">
          {cita.status === "PENDING" && (
            <Button
              size="sm"
              variant="outline"
              disabled={updatingId === cita.id}
              onClick={() => onStatus(cita.id, "CONFIRMED")}
              className="min-h-[40px]"
            >
              Confirmar
            </Button>
          )}
          {cita.status === "CONFIRMED" && (
            <Button
              size="sm"
              variant="outline"
              disabled={updatingId === cita.id}
              onClick={() => onStatus(cita.id, "COMPLETED")}
              className="min-h-[40px]"
            >
              Completar
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            disabled={updatingId === cita.id}
            onClick={() => onStatus(cita.id, "CANCELLED")}
            className="min-h-[40px] text-red-600"
          >
            Cancelar
          </Button>
        </div>
      )}
    </div>
  )
}
