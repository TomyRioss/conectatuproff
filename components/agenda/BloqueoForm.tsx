"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { BlockedSlotReason } from "./types"

const REASONS: { value: BlockedSlotReason; label: string }[] = [
  { value: "VACATION", label: "Vacaciones" },
  { value: "ABSENCE", label: "Ausencia" },
  { value: "PERSONAL", label: "Personal" },
  { value: "OTHER", label: "Otro" },
]

function toDateInput(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export default function BloqueoForm({
  day,
  onClose,
  onCreated,
}: {
  day: Date
  onClose: () => void
  onCreated: () => void
}) {
  const [startTime, setStartTime] = useState("09:00")
  const [endTime, setEndTime] = useState("10:00")
  const [reason, setReason] = useState<BlockedSlotReason>("OTHER")
  const [note, setNote] = useState("")
  const [repeatWeekly, setRepeatWeekly] = useState(false)
  const [repeatUntil, setRepeatUntil] = useState("")
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    const dateStr = toDateInput(day)
    const startAt = new Date(`${dateStr}T${startTime}:00`)
    const endAt = new Date(`${dateStr}T${endTime}:00`)
    if (endAt <= startAt) {
      toast.error("El horario de fin debe ser posterior al de inicio")
      return
    }
    if (repeatWeekly && !repeatUntil) {
      toast.error("Elegí hasta cuándo repetir")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/profesional/agenda/bloqueo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startAt: startAt.toISOString(),
          endAt: endAt.toISOString(),
          reason,
          note,
          repeatUntil: repeatWeekly ? repeatUntil : undefined,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error || "Error al crear bloqueo")
      toast.success(repeatWeekly ? "Bloqueos creados" : "Bloqueo creado")
      onCreated()
    } catch (e) {
      console.error(e)
      toast.error(e instanceof Error ? e.message : "Error al crear bloqueo")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-white space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="startTime">Desde</Label>
          <Input id="startTime" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="endTime">Hasta</Label>
          <Input id="endTime" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </div>
      </div>

      <div>
        <Label htmlFor="reason">Motivo</Label>
        <select
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value as BlockedSlotReason)}
          className="w-full border border-gray-300 rounded-md h-12 sm:h-9 px-3 text-base sm:text-sm bg-white"
        >
          {REASONS.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor="note">Nota (opcional)</Label>
        <Input id="note" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>

      <div className="flex items-center gap-2 min-h-[44px]">
        <input
          id="repeatWeekly"
          type="checkbox"
          checked={repeatWeekly}
          onChange={(e) => setRepeatWeekly(e.target.checked)}
          className="h-5 w-5 shrink-0"
        />
        <Label htmlFor="repeatWeekly" className="cursor-pointer">
          Repetir todos los {day.toLocaleDateString("es-AR", { weekday: "long" })}
        </Label>
      </div>

      {repeatWeekly && (
        <div>
          <Label htmlFor="repeatUntil">Hasta</Label>
          <Input
            id="repeatUntil"
            type="date"
            min={toDateInput(day)}
            value={repeatUntil}
            onChange={(e) => setRepeatUntil(e.target.value)}
          />
        </div>
      )}

      <div className="flex gap-2">
        <Button className="flex-1 min-h-[48px] sm:min-h-0" disabled={saving} onClick={submit}>
          {saving ? "Guardando..." : "Guardar bloqueo"}
        </Button>
        <Button variant="outline" onClick={onClose} disabled={saving} className="min-h-[48px] sm:min-h-0">
          Cancelar
        </Button>
      </div>
    </div>
  )
}
