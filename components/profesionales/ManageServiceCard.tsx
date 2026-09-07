"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Link from "next/link"
import { MoreVertical, Pencil, Trash2, Play, Pause } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type ServiceStatus = "ACTIVE" | "DRAFT" | "PAUSED"

type Service = {
  id: string
  title: string
  description: string | null
  price: unknown
  durationMin: number | null
  modality: "ONLINE" | "IN_PERSON" | "HYBRID" | null
  categoryId: string | null
  imageUrl: string | null
  status: ServiceStatus
}

const MODALIDAD_LABEL: Record<string, string> = {
  ONLINE: "Online",
  IN_PERSON: "Presencial",
  HYBRID: "Híbrido",
}

const STATUS_BADGE: Record<ServiceStatus, string> = {
  ACTIVE: "bg-brand-green text-white",
  DRAFT: "bg-gray-400 text-white",
  PAUSED: "bg-amber-500 text-white",
}

const STATUS_LABEL: Record<ServiceStatus, string> = {
  ACTIVE: "Activo",
  DRAFT: "Borrador",
  PAUSED: "Pausado",
}

export function ManageServiceCard({
  service,
  onChanged,
}: {
  service: Service
  onChanged: () => void
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function setStatus(status: ServiceStatus) {
    setBusy(true)
    try {
      const res = await fetch(`/api/profesional/servicios/${service.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        toast.error(data?.error ?? "No se pudo actualizar")
        return
      }
      toast.success(`Servicio: ${STATUS_LABEL[status].toLowerCase()}`)
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
    <div className="relative grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto_auto] sm:items-center gap-2 sm:gap-4 p-4 sm:px-4 sm:py-3 hover:bg-brand-bg transition-colors">
      <div className="flex items-center gap-3 min-w-0 pr-8 sm:pr-0">
        <div className="w-12 h-12 rounded-lg bg-gray-200 relative shrink-0 overflow-hidden">
          {service.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/avatar?key=${encodeURIComponent(service.imageUrl)}`}
              alt={service.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
        </div>
        <div className="min-w-0 flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-brand-dark text-sm leading-snug truncate">{service.title}</h3>
            <Badge className={`${STATUS_BADGE[service.status]} shrink-0`}>{STATUS_LABEL[service.status]}</Badge>
          </div>
          {service.description && (
            <p className="text-brand-gray text-xs line-clamp-1">{service.description}</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 sm:contents">
        <span className="font-bold text-brand-dark text-sm sm:w-20 sm:text-right">
          {service.price !== null && service.price !== undefined ? `$${String(service.price)}` : "—"}
        </span>
        <span className="text-xs text-brand-gray sm:w-20 sm:text-right">{service.durationMin ? `${service.durationMin} min` : "—"}</span>
        <span className="text-xs text-brand-gray sm:w-24 sm:text-right">{service.modality ? MODALIDAD_LABEL[service.modality] : "—"}</span>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button disabled={busy} className="absolute top-4 right-3 sm:static w-8 min-h-[44px] sm:min-h-0 text-brand-gray hover:text-brand-dark shrink-0 flex sm:justify-end items-center justify-center" aria-label="Opciones">
            <MoreVertical size={18} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-white border-gray-200">
          <DropdownMenuItem asChild className="cursor-pointer gap-2 text-brand-dark">
            <Link href={`/profesional/servicios/${service.id}/editar`}>
              <Pencil size={14} /> Editar
            </Link>
          </DropdownMenuItem>
          {service.status === "ACTIVE" ? (
            <DropdownMenuItem onClick={() => setStatus("PAUSED")} className="cursor-pointer gap-2 text-brand-dark">
              <Pause size={14} /> Pausar
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => setStatus("ACTIVE")} className="cursor-pointer gap-2 text-brand-dark">
              <Play size={14} /> Activar
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={handleDelete} className="cursor-pointer gap-2 text-red-600 focus:text-red-600">
            <Trash2 size={14} /> Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
