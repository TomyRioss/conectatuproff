"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export type CertificationFormValue = {
  id: string
  name: string
  year: number | null
}

export function CertificationForm({
  certification,
  onSaved,
}: {
  certification?: CertificationFormValue
  onSaved: () => void
}) {
  const isEdit = !!certification
  const [initialName, initialInstitution] = (certification?.name ?? "").split(" · ")

  const [name, setName] = useState(initialName ?? "")
  const [institution, setInstitution] = useState(initialInstitution ?? "")
  const [year, setYear] = useState(certification?.year ? String(certification.year) : "")
  const [saving, setSaving] = useState(false)

  async function handleSubmit() {
    if (!name.trim()) {
      toast.error("Nombre requerido")
      return
    }
    if (!institution.trim()) {
      toast.error("Institución requerida")
      return
    }

    setSaving(true)
    try {
      const payload = { name: `${name.trim()} · ${institution.trim()}`, year: year ? Number(year) : undefined }
      const res = await fetch(
        isEdit ? `/api/profesional/certificaciones/${certification!.id}` : "/api/profesional/certificaciones",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      )
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        toast.error(data?.error ?? "Error al guardar")
        return
      }
      toast.success(isEdit ? "Certificación actualizada" : "Certificación agregada")
      onSaved()
    } catch {
      toast.error("Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div>
        <Label htmlFor="name" className="text-xs text-brand-dark">Nombre</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Java Bootcamp" className="h-8 text-sm" />
      </div>
      <div>
        <Label htmlFor="institution" className="text-xs text-brand-dark">Institución</Label>
        <Input id="institution" value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="Ej: TalentoTech" className="h-8 text-sm" />
      </div>
      <div>
        <Label htmlFor="year" className="text-xs text-brand-dark">Año</Label>
        <Input id="year" type="number" value={year} onChange={(e) => setYear(e.target.value)} className="h-8 text-sm" />
      </div>

      <Button onClick={handleSubmit} disabled={saving} size="sm" className="bg-brand-green text-white hover:opacity-90 mt-1">
        {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Agregar"}
      </Button>
    </div>
  )
}
