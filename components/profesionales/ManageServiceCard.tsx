"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { MoreVertical, Pencil, Trash2, Power } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type Service = {
  id: string
  title: string
  description: string | null
  price: unknown
  durationMin: number | null
  modality: "ONLINE" | "IN_PERSON" | "HYBRID" | null
  imageUrl: string | null
  isActive: boolean
}

const MODALIDAD_LABEL: Record<string, string> = {
  ONLINE: "Online",
  IN_PERSON: "Presencial",
  HYBRID: "Híbrido",
}

export function ManageServiceCard({
  service,
  onEdit,
  onChanged,
}: {
  service: Service
  onEdit: (service: Service) => void
  onChanged: () => void
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function toggleActive() {
    setBusy(true)
    try {
      const res = await fetch(`/api/profesional/servicios/${service.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !service.isActive }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        toast.error(data?.error ?? "No se pudo actualizar")
        return
      }
      toast.success(service.isActive ? "Servicio desactivado" : "Servicio activado")
      onChanged()
      router.refresh()
    } catch {
      toast.error("No se pudo actualizar")
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    if (!confirm("¿Eliminar este servicio? Esta acción no se puede deshacer.")) return
    setBusy(true)
    try {
      const res = await fetch(`/api/profesional/servicios/${service.id}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        toast.error(data?.error ?? "No se pudo eliminar")
        return
      }
      toast.success("Servicio eliminado")
      onChanged()
      router.refresh()
    } catch {
      toast.error("No se pudo eliminar")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-2xl bg-brand-bg border border-gray-200 overflow-hidden flex flex-col">
      <div className="aspect-video bg-gray-200 relative">
        {service.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/avatar?key=${encodeURIComponent(service.imageUrl)}`}
            alt={service.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute top-2 right-2">
          <Badge className={service.isActive ? "bg-brand-green text-white" : "bg-gray-400 text-white"}>
            {service.isActive ? "Activo" : "Inactivo"}
          </Badge>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-1 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-brand-dark text-sm leading-snug">{service.title}</h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button disabled={busy} className="text-brand-gray hover:text-brand-dark shrink-0" aria-label="Opciones">
                <MoreVertical size={18} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white border-gray-200">
              <DropdownMenuItem onClick={() => onEdit(service)} className="cursor-pointer gap-2 text-brand-dark">
                <Pencil size={14} /> Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={toggleActive} className="cursor-pointer gap-2 text-brand-dark">
                <Power size={14} /> {service.isActive ? "Desactivar" : "Activar"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="cursor-pointer gap-2 text-red-600 focus:text-red-600">
                <Trash2 size={14} /> Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {service.description && (
          <p className="text-brand-gray text-xs line-clamp-2">{service.description}</p>
        )}

        <div className="mt-auto pt-2 flex items-center justify-between text-sm">
          <span className="font-bold text-brand-dark">${String(service.price)}</span>
          <div className="flex items-center gap-2 text-brand-gray text-xs">
            {service.durationMin && <span>{service.durationMin} min</span>}
            {service.modality && <span>{MODALIDAD_LABEL[service.modality]}</span>}
          </div>
        </div>
      </div>
    </div>
  )
}
