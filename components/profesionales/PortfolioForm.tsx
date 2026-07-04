"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Loader2, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const MAX_IMAGES = 5

export type PortfolioFormValue = {
  id: string
  title: string | null
  description: string | null
  costMin: number | null
  costMax: number | null
  durationMin: number | null
  durationMax: number | null
  tags: string[]
  images: { imageUrl: string }[]
}

export function PortfolioForm({
  item,
  onSaved,
}: {
  item?: PortfolioFormValue
  onSaved: () => void
}) {
  const isEdit = !!item

  const [title, setTitle] = useState(item?.title ?? "")
  const [description, setDescription] = useState(item?.description ?? "")
  const [costMin, setCostMin] = useState(item?.costMin != null ? String(item.costMin) : "")
  const [costMax, setCostMax] = useState(item?.costMax != null ? String(item.costMax) : "")
  const [durationMin, setDurationMin] = useState(item?.durationMin != null ? String(item.durationMin) : "")
  const [durationMax, setDurationMax] = useState(item?.durationMax != null ? String(item.durationMax) : "")
  const [tagInput, setTagInput] = useState("")
  const [tags, setTags] = useState<string[]>(item?.tags ?? [])
  const [imageKeys, setImageKeys] = useState<string[]>(item?.images.map((i) => i.imageUrl) ?? [])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  function addTag() {
    const t = tagInput.trim()
    if (!t) return
    if (!tags.includes(t)) setTags([...tags, t])
    setTagInput("")
  }

  async function handleImageUpload(file: File) {
    if (imageKeys.length >= MAX_IMAGES) {
      toast.error(`Máximo ${MAX_IMAGES} imágenes`)
      return
    }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/profesional/portfolio/upload-image", { method: "POST", body: formData })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        toast.error(data?.error ?? "No se pudo subir la imagen")
        return
      }
      setImageKeys((prev) => [...prev, data.key])
    } catch {
      toast.error("No se pudo subir la imagen")
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit() {
    if (imageKeys.length === 0) {
      toast.error("Agregá al menos una imagen")
      return
    }

    setSaving(true)
    try {
      const payload = {
        title: title || undefined,
        description: description || undefined,
        costMin: costMin || undefined,
        costMax: costMax || undefined,
        durationMin: durationMin || undefined,
        durationMax: durationMax || undefined,
        tags,
        imageKeys,
      }
      const res = await fetch(
        isEdit ? `/api/profesional/portfolio/${item!.id}` : "/api/profesional/portfolio",
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
      toast.success(isEdit ? "Proyecto actualizado" : "Proyecto creado")
      onSaved()
    } catch {
      toast.error("Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <Label htmlFor="title">Título</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      <div>
        <Label htmlFor="description">Descripción</Label>
        <textarea
          id="description"
          value={description ?? ""}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full min-h-20 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-violet/30 focus:border-brand-violet"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="costMin">Costo mín. (ARS)</Label>
          <Input id="costMin" type="number" min="0" value={costMin} onChange={(e) => setCostMin(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="costMax">Costo máx. (ARS)</Label>
          <Input id="costMax" type="number" min="0" value={costMax} onChange={(e) => setCostMax(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="durationMin">Duración mín. (días)</Label>
          <Input id="durationMin" type="number" min="0" value={durationMin} onChange={(e) => setDurationMin(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="durationMax">Duración máx. (días)</Label>
          <Input id="durationMax" type="number" min="0" value={durationMax} onChange={(e) => setDurationMax(e.target.value)} />
        </div>
      </div>

      <div>
        <Label>Tags</Label>
        <div className="flex gap-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag() } }}
            placeholder="Ej: React, Node.js"
          />
          <Button type="button" variant="outline" className="border-gray-200" onClick={addTag}>Agregar</Button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.map((t) => (
              <span key={t} className="inline-flex items-center gap-1 rounded-full bg-brand-bg border border-gray-200 px-2 py-1 text-xs text-brand-dark">
                {t}
                <button type="button" onClick={() => setTags(tags.filter((x) => x !== t))} aria-label="Quitar tag">
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div>
        <Label>Imágenes ({imageKeys.length}/{MAX_IMAGES})</Label>
        <div className="flex flex-wrap gap-3 mt-1">
          {imageKeys.map((key) => (
            <div key={key} className="relative w-16 h-16">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/avatar?key=${encodeURIComponent(key)}`}
                alt=""
                className="w-16 h-16 rounded-lg object-cover border border-gray-200"
              />
              <button
                type="button"
                onClick={() => setImageKeys(imageKeys.filter((k) => k !== key))}
                className="absolute -top-1.5 -right-1.5 bg-white border border-gray-200 rounded-full p-0.5"
                aria-label="Quitar imagen"
              >
                <X size={12} />
              </button>
            </div>
          ))}
          {imageKeys.length < MAX_IMAGES && (
            <label className="w-16 h-16 flex items-center justify-center rounded-lg border border-dashed border-gray-300 cursor-pointer text-brand-violet hover:opacity-80">
              {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleImageUpload(file)
                  e.target.value = ""
                }}
              />
            </label>
          )}
        </div>
      </div>

      <Button onClick={handleSubmit} disabled={saving || uploading} className="bg-brand-green text-white hover:opacity-90 mt-2">
        {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear proyecto"}
      </Button>
    </div>
  )
}
