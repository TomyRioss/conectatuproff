"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { GraduationCap, Award, Plus, MoreVertical, Pencil, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EducationForm, type EducationFormValue } from "@/components/profesionales/EducationForm"
import { CertificationForm, type CertificationFormValue } from "@/components/profesionales/CertificationForm"

function ItemMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="text-brand-gray hover:text-brand-dark shrink-0" aria-label="Opciones">
          <MoreVertical size={16} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-white border-gray-200">
        <DropdownMenuItem onClick={onEdit} className="cursor-pointer gap-2 text-brand-dark">
          <Pencil size={14} /> Editar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDelete} className="cursor-pointer gap-2 text-red-600 focus:text-red-600">
          <Trash2 size={14} /> Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function FormacionManageSection() {
  const [educations, setEducations] = useState<EducationFormValue[]>([])
  const [certifications, setCertifications] = useState<CertificationFormValue[]>([])

  const [eduFormOpen, setEduFormOpen] = useState(false)
  const [editingEdu, setEditingEdu] = useState<EducationFormValue | undefined>(undefined)

  const [certFormOpen, setCertFormOpen] = useState(false)
  const [editingCert, setEditingCert] = useState<CertificationFormValue | undefined>(undefined)

  function loadEducations() {
    fetch("/api/profesional/educacion")
      .then((r) => r.json())
      .then((data) => setEducations(Array.isArray(data) ? data : []))
      .catch(() => toast.error("No se pudo cargar educación"))
  }

  function loadCertifications() {
    fetch("/api/profesional/certificaciones")
      .then((r) => r.json())
      .then((data) => setCertifications(Array.isArray(data) ? data : []))
      .catch(() => toast.error("No se pudo cargar certificaciones"))
  }

  useEffect(() => {
    loadEducations()
    loadCertifications()
  }, [])

  async function handleDeleteEdu(id: string) {
    if (!confirm("¿Eliminar esta educación?")) return
    try {
      const res = await fetch(`/api/profesional/educacion/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        toast.error(data?.error ?? "No se pudo eliminar")
        return
      }
      toast.success("Educación eliminada")
      loadEducations()
    } catch {
      toast.error("No se pudo eliminar")
    }
  }

  async function handleDeleteCert(id: string) {
    if (!confirm("¿Eliminar esta certificación?")) return
    try {
      const res = await fetch(`/api/profesional/certificaciones/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        toast.error(data?.error ?? "No se pudo eliminar")
        return
      }
      toast.success("Certificación eliminada")
      loadCertifications()
    } catch {
      toast.error("No se pudo eliminar")
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <section className="rounded-2xl bg-white border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-brand-dark font-display">Educación</h2>
        </div>
        {eduFormOpen ? (
          <div className="rounded-xl border border-gray-200 p-3 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-brand-dark">
                {editingEdu ? "Editar educación" : "Nueva educación"}
              </h3>
              <button
                onClick={() => { setEduFormOpen(false); setEditingEdu(undefined) }}
                className="text-brand-gray hover:text-brand-dark"
                aria-label="Cerrar"
              >
                <X size={16} />
              </button>
            </div>
            <EducationForm
              education={editingEdu}
              onSaved={() => { setEduFormOpen(false); setEditingEdu(undefined); loadEducations() }}
            />
          </div>
        ) : (
          <Button
            variant="outline"
            className="border-gray-200 text-brand-dark gap-2 mb-4"
            onClick={() => { setEditingEdu(undefined); setEduFormOpen(true) }}
          >
            <Plus size={16} /> Añadir nuevo
          </Button>
        )}

        <div className="flex flex-col gap-3">
          {educations.map((edu) => (
            <div key={edu.id} className="rounded-xl bg-brand-bg border border-gray-200 p-3 flex items-start gap-3">
              <GraduationCap size={20} className="text-brand-violet mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-brand-dark text-sm">{edu.institution}</p>
                <p className="text-brand-gray text-xs">
                  Título en {edu.degree}
                  {edu.fieldOfStudy ? ` ${edu.fieldOfStudy}` : ""}
                </p>
                <p className="text-brand-gray text-xs">
                  {[edu.location, edu.graduated && edu.year ? `Graduado ${edu.year}` : edu.year ? `${edu.year}` : null]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>
              <ItemMenu
                onEdit={() => { setEditingEdu(edu); setEduFormOpen(true) }}
                onDelete={() => handleDeleteEdu(edu.id)}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-white border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-brand-dark font-display">Certificaciones</h2>
        </div>
        {certFormOpen ? (
          <div className="rounded-xl border border-gray-200 p-3 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-brand-dark">
                {editingCert ? "Editar certificación" : "Nueva certificación"}
              </h3>
              <button
                onClick={() => { setCertFormOpen(false); setEditingCert(undefined) }}
                className="text-brand-gray hover:text-brand-dark"
                aria-label="Cerrar"
              >
                <X size={16} />
              </button>
            </div>
            <CertificationForm
              certification={editingCert}
              onSaved={() => { setCertFormOpen(false); setEditingCert(undefined); loadCertifications() }}
            />
          </div>
        ) : (
          <Button
            variant="outline"
            className="border-gray-200 text-brand-dark gap-2 mb-4"
            onClick={() => { setEditingCert(undefined); setCertFormOpen(true) }}
          >
            <Plus size={16} /> Añadir nuevo
          </Button>
        )}

        <div className="flex flex-col gap-3">
          {certifications.map((cert) => (
            <div key={cert.id} className="rounded-xl bg-brand-bg border border-gray-200 p-3 flex items-center gap-3">
              <Award size={20} className="text-brand-violet shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-brand-dark text-sm">{cert.name.split(" · ")[0]}</p>
                <p className="text-brand-gray text-xs">
                  {[cert.name.split(" · ")[1], cert.year].filter(Boolean).join(" · ")}
                </p>
              </div>
              <ItemMenu
                onEdit={() => { setEditingCert(cert); setCertFormOpen(true) }}
                onDelete={() => handleDeleteCert(cert.id)}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
