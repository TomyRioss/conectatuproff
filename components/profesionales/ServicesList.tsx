"use client"

import { useState } from "react"
import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ManageServiceCard } from "@/components/profesionales/ManageServiceCard"

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

const TABS: { key: ServiceStatus; label: string }[] = [
  { key: "ACTIVE", label: "Activo" },
  { key: "DRAFT", label: "Borrador" },
  { key: "PAUSED", label: "Pausado" },
]

export function ServicesList({ initialServices }: { initialServices: Service[] }) {
  const [services, setServices] = useState(initialServices)
  const [tab, setTab] = useState<ServiceStatus>("ACTIVE")

  async function refetch() {
    const res = await fetch("/api/profesional/servicios")
    if (res.ok) setServices(await res.json())
  }

  const filtered = services.filter((s) => s.status === tab)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-brand-dark font-display">Servicios</h1>
      </div>

      <div className="flex items-center justify-between gap-1 border-b border-gray-200 mb-6">
        <div className="flex items-center gap-1">
        {TABS.map((t) => {
          const count = services.filter((s) => s.status === t.key).length
          const active = tab === t.key
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
                active
                  ? "border-brand-green text-brand-dark"
                  : "border-transparent text-brand-gray hover:text-brand-dark"
              }`}
            >
              {t.label.toUpperCase()}
              {count > 0 && (
                <span
                  className={`text-xs rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center ${
                    active ? "bg-brand-green text-white" : "bg-gray-200 text-brand-gray"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
        </div>
        <Button asChild className="bg-brand-green text-white hover:opacity-90 gap-2 mb-2">
          <Link href="/profesional/servicios/nuevo">
            <Plus size={16} /> Nuevo servicio
          </Link>
        </Button>
      </div>

      {filtered.length === 0 ? (
        <p className="text-brand-gray text-sm">No hay servicios en este estado.</p>
      ) : (
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-4 py-2.5 border-b border-gray-200 text-[11px] font-semibold uppercase tracking-wide text-brand-gray">
            <span>Servicio</span>
            <span className="w-20 text-right">Precio</span>
            <span className="w-20 text-right">Duración</span>
            <span className="w-24 text-right">Modalidad</span>
            <span className="w-8" />
          </div>
          <div className="flex flex-col divide-y divide-gray-100">
            {filtered.map((s) => (
              <ManageServiceCard
                key={s.id}
                service={s}
                onChanged={refetch}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
