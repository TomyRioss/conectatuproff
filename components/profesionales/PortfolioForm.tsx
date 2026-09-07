"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Loader2, Upload, X, ChevronDown, Star, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"

const MAX_IMAGES = 5
const MAX_CATEGORIES = 4
const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

const DURATION_RANGES = [
  { label: "1-7 día", min: 1, max: 7 },
  { label: "7-30 días", min: 7, max: 30 },
  { label: "1-3 meses", min: 30, max: 90 },
  { label: "3-6 meses", min: 90, max: 180 },
  { label: "Más de 6 meses", min: 180, max: null as number | null },
]

type Category = { id: string; name: string; slug: string }

export type PortfolioFormValue = {
  id: string
  title: string | null
  description: string | null
  costMin: number | null
  costMax: number | null
  durationMin: number | null
  durationMax: number | null
  tags: string[]
  startedAt?: string | null
  categories?: Category[]
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
  const itemStartedAt = item?.startedAt ? new Date(item.startedAt) : null

  const [title, setTitle] = useState(item?.title ?? "")
  const [description, setDescription] = useState(item?.description ?? "")
  const [cost, setCost] = useState(item?.costMin != null ? String(item.costMin) : "")
  const initialDurationLabel = DURATION_RANGES.find(
    (r) => r.min === item?.durationMin && r.max === item?.durationMax
  )?.label ?? ""
  const [durationLabel, setDurationLabel] = useState(initialDurationLabel)
  const [month, setMonth] = useState(itemStartedAt ? String(itemStartedAt.getMonth()) : "")
  const [year, setYear] = useState(itemStartedAt ? String(itemStartedAt.getFullYear()) : "")
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryIds, setCategoryIds] = useState<string[]>(item?.categories?.map((c) => c.id) ?? [])
  const [imageKeys, setImageKeys] = useState<string[]>(item?.images.map((i) => i.imageUrl) ?? [])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/categorias")
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {})
  }, [])

  function toggleCategory(id: string) {
    setCategoryIds((prev) => {
      if (prev.includes(id)) return prev.filter((c) => c !== id)
      if (prev.length >= MAX_CATEGORIES) {
        toast.error(`Máximo ${MAX_CATEGORIES} categorías`)
        return prev
      }
      return [...prev, id]
    })
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 15 }, (_, i) => currentYear - i)

  async function uploadOne(file: File) {
    const formData = new FormData()
    formData.append("file", file)
    const res = await fetch("/api/profesional/portfolio/upload-image", { method: "POST", body: formData })
    const data = await res.json().catch(() => null)
    if (!res.ok) {
      toast.error(data?.error ?? "No se pudo subir la imagen")
      return
    }
    setImageKeys((prev) => [...prev, data.key])
  }

  async function handleImageUpload(files: FileList | File[]) {
    const remaining = MAX_IMAGES - imageKeys.length
    if (remaining <= 0) {
      toast.error(`Máximo ${MAX_IMAGES} imágenes`)
      return
    }
    const list = Array.from(files).slice(0, remaining)
    if (files.length > list.length) {
      toast.error(`Máximo ${MAX_IMAGES} imágenes`)
    }
    setUploading(true)
    try {
      for (const file of list) {
        await uploadOne(file)
      }
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
      const startedAt = month !== "" && year !== ""
        ? new Date(Number(year), Number(month), 1).toISOString()
        : undefined

      const selectedRange = DURATION_RANGES.find((r) => r.label === durationLabel)

      const payload = {
        title: title || undefined,
        description: description || undefined,
        costMin: cost || undefined,
        costMax: cost || undefined,
        durationMin: selectedRange?.min ?? undefined,
        durationMax: selectedRange?.max ?? undefined,
        tags: [],
        startedAt,
        categoryIds,
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

  const inputClass =
    "min-h-[48px] h-12 sm:h-14 rounded-xl border-gray-200 px-4 text-base text-brand-dark placeholder:text-brand-gray/60 focus-visible:ring-brand-violet/30 focus-visible:border-brand-violet"

  return (
    <div className="flex flex-col gap-6 sm:gap-7">
      <h1 className="text-2xl sm:text-3xl font-bold text-brand-dark leading-tight tracking-tight">
        {isEdit ? "Editá tu proyecto" : "Agregá un nuevo proyecto a tu portfolio"}
      </h1>

      <div>
        <Label htmlFor="title" className="text-brand-dark font-semibold text-base">Nombre del proyecto</Label>
        <Input
          id="title"
          value={title}
          maxLength={50}
          placeholder="Ej: División Nike Mujer: campaña de marketing de otoño."
          onChange={(e) => setTitle(e.target.value)}
          className={`${inputClass} w-full sm:w-1/2 mt-1.5`}
        />
        <p className="text-sm text-brand-gray text-right mt-1 w-full sm:w-1/2">{title.length}/50 Caracteres</p>
      </div>

      <div className="w-full sm:w-1/2">
        <Label className="text-brand-dark font-semibold text-base">Categoría del proyecto</Label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={`${inputClass} w-full flex items-center justify-between border bg-white`}
            >
              <span className={categoryIds.length ? "text-brand-dark" : "text-brand-gray/60"}>
                {categoryIds.length
                  ? categories.filter((c) => categoryIds.includes(c.id)).map((c) => c.name).join(", ")
                  : "Selecciona una categoría de la lista."}
              </span>
              <ChevronDown size={16} className="text-brand-gray shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-40 max-w-[calc(100vw-2rem)] bg-white border-gray-200 max-h-64 overflow-y-auto">
            {categories.map((c) => (
              <DropdownMenuCheckboxItem
                key={c.id}
                checked={categoryIds.includes(c.id)}
                onCheckedChange={() => toggleCategory(c.id)}
                onSelect={(e) => e.preventDefault()}
                className="text-brand-dark"
              >
                {c.name}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div>
          <Label className="text-brand-dark font-semibold text-base">Duración del proyecto</Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={`${inputClass} w-full flex items-center justify-between border bg-white`}
              >
                <span className={durationLabel ? "text-brand-dark" : "text-brand-gray/60"}>
                  {durationLabel || "Selecciona la duración."}
                </span>
                <ChevronDown size={16} className="text-brand-gray shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-40 max-w-[calc(100vw-2rem)] bg-white border-gray-200">
              {DURATION_RANGES.map((r) => (
                <DropdownMenuItem
                  key={r.label}
                  onClick={() => setDurationLabel(r.label)}
                  className="text-brand-dark justify-between"
                >
                  {r.label}
                  {durationLabel === r.label && <Check size={14} className="text-brand-violet" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div>
          <Label className="text-brand-dark font-semibold text-base">Costo (ARS)</Label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-gray text-sm">$</span>
            <Input
              id="cost"
              type="number"
              min="0"
              placeholder="Ej. 1000"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              className={`${inputClass} pl-7`}
            />
          </div>
        </div>
      </div>

      <div>
        <Label className="text-brand-dark font-semibold text-base">Proyecto iniciado el</Label>
        <div className="grid grid-cols-2 gap-3 w-full sm:w-1/2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={`${inputClass} w-full flex items-center justify-between border bg-white`}
              >
                <span className={month === "" ? "text-brand-gray/60" : "text-brand-dark"}>
                  {month === "" ? "Mes" : MONTHS[Number(month)]}
                </span>
                <ChevronDown size={16} className="text-brand-gray shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-32 max-w-[calc(100vw-2rem)] max-h-64 overflow-y-auto bg-white border-gray-200">
              {MONTHS.map((m, i) => (
                <DropdownMenuItem
                  key={m}
                  onClick={() => setMonth(String(i))}
                  className="text-brand-dark justify-between"
                >
                  {m}
                  {month === String(i) && <Check size={14} className="text-brand-violet" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={`${inputClass} w-full flex items-center justify-between border bg-white`}
              >
                <span className={year === "" ? "text-brand-gray/60" : "text-brand-dark"}>
                  {year === "" ? "Año" : year}
                </span>
                <ChevronDown size={16} className="text-brand-gray shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-24 max-w-[calc(100vw-2rem)] max-h-64 overflow-y-auto bg-white border-gray-200">
              {years.map((y) => (
                <DropdownMenuItem
                  key={y}
                  onClick={() => setYear(String(y))}
                  className="text-brand-dark justify-between"
                >
                  {y}
                  {year === String(y) && <Check size={14} className="text-brand-violet" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div>
        <Label htmlFor="description" className="text-brand-dark font-semibold text-base">Descripción del proyecto</Label>
        <textarea
          id="description"
          value={description ?? ""}
          maxLength={1400}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full min-h-32 sm:min-h-40 rounded-xl border border-gray-200 bg-white px-4 py-3 mt-1.5 text-base text-brand-dark placeholder:text-brand-gray/60 focus:outline-none focus:ring-2 focus:ring-brand-violet/30 focus:border-brand-violet"
        />
        <p className="text-sm text-brand-gray text-right mt-1">{(description ?? "").length}/1400 Caracteres</p>
      </div>

      <div>
        <Label className="text-brand-dark font-semibold text-base">Archivos adjuntos</Label>

        {imageKeys.length > 0 && (
          <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-3 sm:gap-4 mb-3">
            {imageKeys.map((key, index) => {
              const isCover = index === 0
              return (
                <div key={key} className="group relative w-full sm:w-28 aspect-square sm:h-28 sm:aspect-auto">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/avatar?key=${encodeURIComponent(key)}`}
                    alt=""
                    className={`w-full h-full rounded-xl object-cover border ${isCover ? "border-brand-violet ring-2 ring-brand-violet/40" : "border-gray-200"}`}
                  />

                  {isCover ? (
                    <span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded-full bg-brand-violet text-white text-[10px] font-semibold px-2 py-0.5">
                      <Star size={10} className="fill-white" /> Portada
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setImageKeys((prev) => [key, ...prev.filter((k) => k !== key)])}
                      className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/0 group-hover:bg-black/40 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <span className="text-white text-[11px] font-medium px-2 py-1 rounded-full bg-black/50">
                        Usar como portada
                      </span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setImageKeys(imageKeys.filter((k) => k !== key))}
                    className="absolute -top-1.5 -right-1.5 bg-white border border-gray-200 rounded-full p-0.5 shadow"
                    aria-label="Quitar imagen"
                  >
                    <X size={12} className="text-brand-dark" strokeWidth={3} />
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {imageKeys.length < MAX_IMAGES && (
          <label className="flex flex-col items-center justify-center gap-3 px-4 py-8 sm:py-10 text-center rounded-xl border border-dashed border-gray-300 cursor-pointer hover:bg-brand-bg/50 active:bg-brand-bg transition-colors">
            <span className="text-brand-dark text-sm">Arrastrá y soltá los archivos o</span>
            <span className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 min-h-[44px] text-sm font-medium text-brand-dark">
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              Seleccioná los archivos
            </span>
            <span className="text-xs text-brand-gray leading-relaxed">
              .jpg, .jpeg, .png, .webp · máximo 5 MB · máximo {MAX_IMAGES} archivos
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) handleImageUpload(e.target.files)
                e.target.value = ""
              }}
            />
          </label>
        )}
      </div>

      <Button onClick={handleSubmit} disabled={saving || uploading} className="bg-brand-green text-white hover:opacity-90 min-h-[48px] h-12 sm:h-11 rounded-xl text-base sm:text-sm font-semibold sticky bottom-[max(0.75rem,env(safe-area-inset-bottom))] sm:static shadow-lg sm:shadow-none">
        {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear proyecto"}
      </Button>
    </div>
  )
}
