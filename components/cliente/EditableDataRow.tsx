"use client"

import { useState } from "react"
import { Plus, Pencil, Check, X } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface Props {
  icon: React.ReactNode
  label: string
  value: string | null
  field: "phone" | "dni" | "location"
  addLabel: string
  inputType?: "text" | "number" | "tel"
}

export default function EditableDataRow({ icon, label, value, field, addLabel, inputType = "text" }: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value ?? "")
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const isEmpty = !value

  async function save() {
    setSaving(true)
    try {
      const res = await fetch("/api/cliente/perfil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: draft }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "Error al guardar")
      }
      toast.success("Guardado")
      setEditing(false)
      router.refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  function cancel() {
    setDraft(value ?? "")
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex items-center gap-3 px-5 py-4">
        <span className="text-brand-gray flex-shrink-0">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-brand-gray mb-1">{label}</p>
          <input
            type={inputType}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
            className="w-full text-sm border border-brand-violet rounded-lg px-2 py-1 text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-violet/30"
            onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") cancel() }}
          />
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={save} disabled={saving} className="p-1.5 rounded-lg text-brand-green hover:bg-green-50 transition-colors" aria-label="Guardar">
            <Check size={15} />
          </button>
          <button onClick={cancel} disabled={saving} className="p-1.5 rounded-lg text-brand-gray hover:bg-gray-100 transition-colors" aria-label="Cancelar">
            <X size={15} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 px-5 py-4 group">
      <span className="text-brand-gray flex-shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-brand-gray">{label}</p>
        {!isEmpty && <p className="text-sm font-medium truncate text-brand-dark">{value}</p>}
      </div>
      <button
        onClick={() => setEditing(true)}
        className="ml-3 flex-shrink-0 flex items-center gap-1 text-xs text-brand-violet hover:opacity-70 transition-opacity opacity-0 group-hover:opacity-100"
        aria-label={isEmpty ? addLabel : `Editar ${label}`}
      >
        {isEmpty ? addLabel : <Pencil size={12} />}
      </button>
    </div>
  )
}
