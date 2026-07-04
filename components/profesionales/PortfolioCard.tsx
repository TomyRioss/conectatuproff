"use client"

import { useState } from "react"
import { toast } from "sonner"
import { MoreVertical, Pencil, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { PortfolioFormValue } from "@/components/profesionales/PortfolioForm"

export function PortfolioCard({
  item,
  onEdit,
  onChanged,
}: {
  item: PortfolioFormValue
  onEdit: () => void
  onChanged: () => void
}) {
  const [busy, setBusy] = useState(false)

  async function handleDelete() {
    if (!confirm("¿Eliminar este proyecto? Esta acción no se puede deshacer.")) return
    setBusy(true)
    try {
      const res = await fetch(`/api/profesional/portfolio/${item.id}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        toast.error(data?.error ?? "No se pudo eliminar")
        return
      }
      toast.success("Proyecto eliminado")
      onChanged()
    } catch {
      toast.error("No se pudo eliminar")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-2xl bg-brand-bg border border-gray-200 overflow-hidden flex flex-col">
      <div className="aspect-video bg-gray-200 relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/avatar?key=${encodeURIComponent(item.images[0]?.imageUrl ?? "")}`}
          alt={item.title ?? "Proyecto"}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      <div className="p-4 flex flex-col gap-1 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-brand-dark text-sm leading-snug">{item.title || "Sin título"}</h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button disabled={busy} className="text-brand-gray hover:text-brand-dark shrink-0" aria-label="Opciones">
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
              ${item.costMin ?? item.costMax}{item.costMax && item.costMin !== item.costMax ? `-${item.costMax}` : ""}
            </span>
          )}
          {(item.durationMin || item.durationMax) && (
            <span className="text-brand-gray text-xs">
              {item.durationMin ?? item.durationMax}{item.durationMax && item.durationMin !== item.durationMax ? `-${item.durationMax}` : ""} días
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
