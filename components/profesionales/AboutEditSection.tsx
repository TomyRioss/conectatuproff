"use client"

import { useState } from "react"
import { Pencil, Copy } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

const MAX_LENGTH = 600

interface Props {
  bio: string | null
}

export function AboutEditSection({ bio }: Props) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(bio ?? "")
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch("/api/profesional/perfil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio: value.trim() }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "Error al guardar")
      }
      toast.success("Biografía actualizada")
      setEditing(false)
      router.refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    setValue(bio ?? "")
    setEditing(false)
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value)
      toast.success("Copiado")
    } catch {
      toast.error("No se pudo copiar")
    }
  }

  if (!editing) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-lg font-bold text-brand-dark">Acerca de</h2>
          <button onClick={() => setEditing(true)} aria-label="Editar biografía">
            <Pencil size={16} className="text-brand-gray hover:text-brand-violet transition-colors" />
          </button>
        </div>
        <p
          onClick={() => setEditing(true)}
          className="text-brand-dark text-sm leading-relaxed whitespace-pre-line cursor-pointer"
        >
          {bio || "Todavía no agregaste una biografía."}
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <h2 className="text-lg font-bold text-brand-dark mb-3">Acerca de</h2>
      <div className="flex items-center gap-2 mb-3 rounded-lg bg-brand-bg border border-gray-200 px-3 py-2 text-xs text-brand-gray">
        Agrega detalles sobre tu experiencia y los servicios que ofreces para que los clientes te conozcan mejor.
      </div>
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value.slice(0, MAX_LENGTH))}
        rows={6}
        maxLength={MAX_LENGTH}
        className="text-sm"
        autoFocus
      />
      <div className="flex items-center justify-between mt-2">
        <button onClick={handleCopy} aria-label="Copiar texto" className="text-brand-gray hover:text-brand-violet transition-colors">
          <Copy size={16} />
        </button>
        <span className="text-xs text-brand-gray">{value.length}/{MAX_LENGTH} Caracteres</span>
      </div>
      <div className="flex justify-end gap-2 mt-3">
        <Button variant="outline" onClick={handleCancel} disabled={saving}>
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={saving} className="bg-brand-green text-white hover:opacity-90">
          {saving ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </div>
  )
}
