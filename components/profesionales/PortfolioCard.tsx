"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Images, MoreVertical, Pencil, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { PortfolioFormValue } from "@/components/profesionales/PortfolioForm"
import { PortfolioMedia } from "@/components/profesionales/PortfolioMedia"
import { formatPriceRange } from "@/lib/format-price"

export function PortfolioCard({
  item,
  onEdit,
  onOpen,
  onChanged,
}: {
  item: PortfolioFormValue
  onEdit: () => void
  onOpen: () => void
  onChanged: () => void
}) {
  const [busy, setBusy] = useState(false)

  async function handleDelete() {
    if (!confirm("¿Eliminar esta publicación? Esta acción no se puede deshacer.")) return
    setBusy(true)
    try {
      const res = await fetch(`/api/profesional/portfolio/${item.id}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        toast.error(data?.error ?? "No se pudo eliminar")
        return
      }
      toast.success("Publicación eliminada")
      onChanged()
    } catch {
      toast.error("No se pudo eliminar")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-2xl bg-brand-bg border border-gray-200 overflow-hidden flex flex-col">
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Ver detalles: ${item.title || "Publicación"}`}
        className="aspect-video bg-gray-200 relative block w-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green"
      >
        <PortfolioMedia
          mediaKey={item.images[0]?.imageUrl ?? ""}
          alt={item.title ?? "Publicación"}
          className="absolute inset-0"
        />
        {item.images.length > 1 && (
          <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white">
            <Images size={14} /> {item.images.length}
          </span>
        )}
      </button>

      <div className="p-4 flex flex-col gap-1 flex-1">
        <div className="flex items-start justify-between gap-2">
          <button type="button" onClick={onOpen} className="text-left font-semibold text-brand-dark text-sm leading-snug hover:text-brand-violet transition-colors">
            {item.title || "Sin título"}
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button disabled={busy} className="text-brand-gray hover:text-brand-dark shrink-0 h-11 w-11 -m-3 flex items-center justify-center" aria-label="Opciones">
                <MoreVertical size={18} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white border-gray-200">
              <DropdownMenuItem onClick={onEdit} className="cursor-pointer gap-2 text-brand-dark">
                <Pencil size={14} /> Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="cursor-pointer gap-2 text-red-600 focus:text-red-600">
                <Trash2 size={14} /> Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {item.description && (
          <p className="text-brand-gray text-xs line-clamp-2">{item.description}</p>
        )}

        <div className="mt-auto pt-2 flex items-center justify-between text-sm">
          {(item.costMin || item.costMax) && (
            <span className="font-bold text-brand-dark">
              {formatPriceRange(item.costMin, item.costMax)}
            </span>
          )}
          {(item.durationMin || item.durationMax) && (
            <span className="text-brand-gray text-xs">
              {item.durationMin ?? item.durationMax}{item.durationMax && item.durationMin !== item.durationMax ? `-${item.durationMax}` : ""} horas
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
