"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, Upload } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Category = { id: string; name: string; slug: string }

type Service = {
  id: string
  title: string
  description: string | null
  price: unknown
  durationMin: number | null
  modality: "ONLINE" | "IN_PERSON" | "HYBRID" | null
  categoryId: string | null
  imageUrl: string | null
}

export function ServiceFormDialog({
  open,
  onOpenChange,
  service,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  service?: Service
  onSaved: () => void
}) {
  const router = useRouter()
  const isEdit = !!service

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [durationMin, setDurationMin] = useState("")
  const [modality, setModality] = useState<string>("")
  const [categoryId, setCategoryId] = useState<string>("")
  const [imageUrl, setImageUrl] = useState<string>("")
  const [categories, setCategories] = useState<Category[]>([])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setTitle(service?.title ?? "")
    setDescription(service?.description ?? "")
    setPrice(service ? String(service.price) : "")
    setDurationMin(service?.durationMin ? String(service.durationMin) : "")
    setModality(service?.modality ?? "")
    setCategoryId(service?.categoryId ?? "")
    setImageUrl(service?.imageUrl ?? "")
  }, [open, service])

  useEffect(() => {
    fetch("/api/categorias")
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {})
  }, [])

  async function handleImageUpload(file: File) {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/profesional/servicios/upload-image", { method: "POST", body: formData })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        toast.error(data?.error ?? "No se pudo subir la imagen")
        return
      }
      setImageUrl(data.key)
      toast.success("Imagen subida")
    } catch {
      toast.error("No se pudo subir la imagen")
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit() {
    if (!title.trim()) {
      toast.error("Título requerido")
      return
    }
    if (!price || Number(price) <= 0) {
      toast.error("Precio inválido")
      return
    }

    setSaving(true)
    try {
      const payload = {
        title,
        description: description || undefined,
        price: Number(price),
        durationMin: durationMin ? Number(durationMin) : undefined,
        modality: modality || undefined,
        categoryId: categoryId || undefined,
        imageUrl: imageUrl || undefined,
      }
      const res = await fetch(
        isEdit ? `/api/profesional/servicios/${service!.id}` : "/api/profesional/servicios",
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
      toast.success(isEdit ? "Servicio actualizado" : "Servicio creado")
      onOpenChange(false)
      onSaved()
      router.refresh()
    } catch {
      toast.error("Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <h2 className="text-lg font-bold text-brand-dark font-display">
          {isEdit ? "Editar servicio" : "Nuevo servicio"}
        </h2>

        <div className="flex flex-col gap-3 mt-2">
          <div>
            <Label htmlFor="title">Título</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div>
            <Label htmlFor="description">Descripción</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full min-h-20 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-violet/30 focus:border-brand-violet"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="price">Precio (ARS)</Label>
              <Input id="price" type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="durationMin">Duración (min)</Label>
              <Input id="durationMin" type="number" min="0" value={durationMin} onChange={(e) => setDurationMin(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="modality">Modalidad</Label>
              <select
                id="modality"
                value={modality}
                onChange={(e) => setModality(e.target.value)}
                className="w-full h-9 rounded-md border border-gray-200 bg-white px-3 text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-violet/30 focus:border-brand-violet"
              >
                <option value="">Sin especificar</option>
                <option value="ONLINE">Online</option>
                <option value="IN_PERSON">Presencial</option>
                <option value="HYBRID">Híbrido</option>
              </select>
            </div>
            <div>
              <Label htmlFor="categoryId">Categoría</Label>
              <select
                id="categoryId"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full h-9 rounded-md border border-gray-200 bg-white px-3 text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-violet/30 focus:border-brand-violet"
              >
                <option value="">Sin categoría</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label>Imagen</Label>
            <div className="flex items-center gap-3">
              {imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/api/avatar?key=${encodeURIComponent(imageUrl)}`}
                  alt=""
                  className="w-14 h-14 rounded-lg object-cover border border-gray-200"
                />
              )}
              <label className="flex items-center gap-2 text-sm text-brand-violet cursor-pointer hover:opacity-80">
                {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                {uploading ? "Subiendo..." : "Subir imagen"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleImageUpload(file)
                  }}
                />
              </label>
            </div>
          </div>

          <Button onClick={handleSubmit} disabled={saving || uploading} className="bg-brand-green text-white hover:opacity-90 mt-2">
            {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear servicio"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
