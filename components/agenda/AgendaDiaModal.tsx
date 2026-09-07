"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import BloqueoForm from "./BloqueoForm"
import type { AgendaData, AppointmentStatus } from "./types"

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmado",
  CANCELLED: "Cancelado",
  COMPLETED: "Completado",
  NO_SHOW: "No asistió",
}

const STATUS_COLOR: Record<AppointmentStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-brand-green/20 text-brand-dark",
  CANCELLED: "bg-red-100 text-red-800",
  COMPLETED: "bg-brand-violet/20 text-brand-dark",
  NO_SHOW: "bg-gray-200 text-brand-gray",
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export default function AgendaDiaModal({
  day,
  data,
  onClose,
  onChanged,
}: {
  day: Date
  data: AgendaData
  onClose: () => void
  onChanged: () => void
}) {
  const [showBloqueoForm, setShowBloqueoForm] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [deletingBloqueoId, setDeletingBloqueoId] = useState<string | null>(null)

  const dayAppointments = data.appointments.filter((a) => sameDay(new Date(a.startAt), day))
  const dayBlocked = data.blockedSlots.filter((b) => sameDay(new Date(b.startAt), day))

  const changeStatus = async (id: string, status: AppointmentStatus) => {
    setUpdatingId(id)
    try {
      const res = await fetch(`/api/profesional/agenda/turno/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error((await res.json()).error || "Error al actualizar turno")
      toast.success("Turno actualizado")
      onChanged()
    } catch (e) {
      console.error(e)
      toast.error(e instanceof Error ? e.message : "Error al actualizar turno")
    } finally {
      setUpdatingId(null)
    }
  }

  const deleteBloqueo = async (id: string) => {
    setDeletingBloqueoId(id)
    try {
      const res = await fetch(`/api/profesional/agenda/bloqueo?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error((await res.json()).error || "Error al eliminar el bloqueo")
      toast.success("Bloqueo eliminado")
      onChanged()
    } catch (e) {
      console.error(e)
      toast.error(e instanceof Error ? e.message : "Error al eliminar el bloqueo")
    } finally {
      setDeletingBloqueoId(null)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="capitalize">
            {day.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {dayAppointments.length === 0 && dayBlocked.length === 0 && (
            <p className="text-brand-gray text-sm">Sin turnos ni bloqueos este día.</p>
          )}

          {dayAppointments.map((a) => {
            const start = new Date(a.startAt)
            const hh = String(start.getHours()).padStart(2, "0")
            const mm = String(start.getMinutes()).padStart(2, "0")
            return (
              <div key={a.id} className="border border-gray-200 rounded-lg p-3 bg-white">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-brand-dark">{hh}:{mm}</span>
                  <Badge className={STATUS_COLOR[a.status]}>{STATUS_LABEL[a.status]}</Badge>
                </div>
                <p className="text-sm text-brand-dark">{a.client.firstName} {a.client.lastName}</p>
                {a.service && <p className="text-sm text-brand-gray">{a.service.title}</p>}
                <div className="flex gap-2 mt-2 flex-wrap">
                  {a.status === "PENDING" && (
                    <Button size="sm" variant="outline" disabled={updatingId === a.id} onClick={() => changeStatus(a.id, "CONFIRMED")} className="min-h-[44px]">
                      Confirmar
                    </Button>
                  )}
                  {a.status === "CONFIRMED" && (
                    <>
                      <Button size="sm" variant="outline" disabled={updatingId === a.id} onClick={() => changeStatus(a.id, "COMPLETED")} className="min-h-[44px]">
                        Completar
                      </Button>
                      <Button size="sm" variant="outline" disabled={updatingId === a.id} onClick={() => changeStatus(a.id, "NO_SHOW")} className="min-h-[44px]">
                        No asistió
                      </Button>
                    </>
                  )}
                  {(a.status === "PENDING" || a.status === "CONFIRMED") && (
                    <Button size="sm" variant="outline" disabled={updatingId === a.id} onClick={() => changeStatus(a.id, "CANCELLED")} className="min-h-[44px]">
                      Cancelar
                    </Button>
                  )}
                </div>
              </div>
            )
          })}

          {dayBlocked.map((b) => {
            const bStart = new Date(b.startAt)
            const bEnd = new Date(b.endAt)
            const fmt = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
            return (
              <div key={b.id} className="border border-gray-200 rounded-lg p-3 bg-brand-bg">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs text-brand-gray mb-0.5">{fmt(bStart)} - {fmt(bEnd)}</p>
                    <p className="text-sm font-medium text-brand-dark">{b.note || "Bloqueado"}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={deletingBloqueoId === b.id}
                    onClick={() => deleteBloqueo(b.id)}
                    className="min-h-[44px] shrink-0"
                  >
                    {deletingBloqueoId === b.id ? "..." : "Eliminar"}
                  </Button>
                </div>
              </div>
            )
          })}

          {showBloqueoForm ? (
            <BloqueoForm
              day={day}
              onClose={() => setShowBloqueoForm(false)}
              onCreated={() => {
                setShowBloqueoForm(false)
                onChanged()
              }}
            />
          ) : (
            <Button variant="secondary" className="w-full min-h-[48px]" onClick={() => setShowBloqueoForm(true)}>
              Bloquear horario
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
