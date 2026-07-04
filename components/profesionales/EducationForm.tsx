"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export type EducationFormValue = {
  id: string
  institution: string
  degree: string
  fieldOfStudy: string | null
  location: string | null
  year: number | null
  graduated: boolean
}

export function EducationForm({
  education,
  onSaved,
}: {
  education?: EducationFormValue
  onSaved: () => void
}) {
  const isEdit = !!education

  const [institution, setInstitution] = useState(education?.institution ?? "")
  const [degree, setDegree] = useState(education?.degree ?? "")
  const [fieldOfStudy, setFieldOfStudy] = useState(education?.fieldOfStudy ?? "")
  const [location, setLocation] = useState(education?.location ?? "")
  const [year, setYear] = useState(education?.year ? String(education.year) : "")
  const [graduated, setGraduated] = useState(education?.graduated ?? true)
  const [saving, setSaving] = useState(false)

  async function handleSubmit() {
    if (!institution.trim()) {
      toast.error("Institución requerida")
      return
    }
    if (!degree.trim()) {
      toast.error("Título requerido")
      return
    }

    setSaving(true)
    try {
      const payload = {
        institution,
        degree,
        fieldOfStudy: fieldOfStudy || undefined,
        location: location || undefined,
        year: year ? Number(year) : undefined,
        graduated,
      }
      const res = await fetch(
        isEdit ? `/api/profesional/educacion/${education!.id}` : "/api/profesional/educacion",
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
      toast.success(isEdit ? "Educación actualizada" : "Educación agregada")
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
        <Label htmlFor="institution" className="text-xs text-brand-dark">Institución</Label>
        <Input id="institution" value={institution} onChange={(e) => setInstitution(e.target.value)} className="h-8 text-sm" />
      </div>
      <div>
        <Label htmlFor="degree" className="text-xs text-brand-dark">Título</Label>
        <Input id="degree" value={degree} onChange={(e) => setDegree(e.target.value)} placeholder="Ej: B.Sc. Computer Science" className="h-8 text-sm" />
      </div>
      <div>
        <Label htmlFor="fieldOfStudy" className="text-xs text-brand-dark">Área de estudio (opcional)</Label>
        <Input id="fieldOfStudy" value={fieldOfStudy} onChange={(e) => setFieldOfStudy(e.target.value)} className="h-8 text-sm" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="location" className="text-xs text-brand-dark">Ubicación</Label>
          <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ej: Argentina" className="h-8 text-sm" />
        </div>
        <div>
          <Label htmlFor="year" className="text-xs text-brand-dark">Año</Label>
          <Input id="year" type="number" value={year} onChange={(e) => setYear(e.target.value)} className="h-8 text-sm" />
        </div>
      </div>
      <label className="flex items-center gap-2 text-xs text-brand-dark">
        <input type="checkbox" checked={graduated} onChange={(e) => setGraduated(e.target.checked)} />
        Graduado
      </label>

      <Button onClick={handleSubmit} disabled={saving} size="sm" className="bg-brand-green text-white hover:opacity-90 mt-1">
        {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Agregar"}
      </Button>
    </div>
  )
}
