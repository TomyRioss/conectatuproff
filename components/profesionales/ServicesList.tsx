"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ManageServiceCard } from "@/components/profesionales/ManageServiceCard"
import { ServiceFormDialog } from "@/components/profesionales/ServiceFormDialog"

type Service = {
  id: string
  title: string
  description: string | null
  price: unknown
  durationMin: number | null
  modality: "ONLINE" | "IN_PERSON" | "HYBRID" | null
  categoryId: string | null
  imageUrl: string | null
  isActive: boolean
}

export function ServicesList({ initialServices }: { initialServices: Service[] }) {
  const [services, setServices] = useState(initialServices)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Service | undefined>(undefined)

  async function refetch() {
    const res = await fetch("/api/profesional/servicios")
    if (res.ok) setServices(await res.json())
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-brand-dark font-display">Mis servicios</h1>
        <Button
          onClick={() => { setEditing(undefined); setDialogOpen(true) }}
          className="bg-brand-green text-white hover:opacity-90 gap-2"
        >
          <Plus size={16} /> Nuevo servicio
        </Button>
      </div>

      {services.length === 0 ? (
        <p className="text-brand-gray text-sm">Todavía no creaste ningún servicio.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((s) => (
            <ManageServiceCard
              key={s.id}
              service={s}
              onEdit={(svc) => { setEditing(svc); setDialogOpen(true) }}
              onChanged={refetch}
            />
          ))}
        </div>
      )}

      <ServiceFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        service={editing}
        onSaved={refetch}
      />
    </div>
  )
}
