"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Pencil, Power, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const formatPrice = (value: string) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(
    Number(value)
  )

interface Paquete {
  id: string
  name: string
  description: string | null
  sessionCount: number
  price: string
  originalPrice: string
  validityDays: number | null
  isActive: boolean
}

export default function PaquetesPage() {
  const [paquetes, setPaquetes] = useState<Paquete[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    fetch("/api/profesional/paquetes")
      .then(async (res) => {
        if (!res.ok) throw new Error("Error al cargar paquetes")
        return res.json()
      })
      .then(setPaquetes)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    // Diferido: setLoading síncrono dentro del efecto dispara renders en cascada.
    const t = setTimeout(load, 0)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleActive = async (paquete: Paquete) => {
    const res = await fetch(`/api/profesional/paquetes/${paquete.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !paquete.isActive }),
    })
    if (res.ok) load()
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    const res = await fetch(`/api/profesional/paquetes/${deleteId}`, { method: "DELETE" })
    setDeleteId(null)
    if (res.ok) load()
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">Paquetes</h1>
          <p className="text-sm text-brand-gray">Gestiona los packs de sesiones que ofreces a tus clientes.</p>
        </div>
        <Button asChild>
          <Link href="/profesional/paquetes/nuevo">+ Nuevo paquete</Link>
        </Button>
      </div>

      {loading && <p className="text-brand-gray">Cargando...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && paquetes.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-brand-gray">
            No tenes paquetes creados todavia. Empeza creando el primero.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]">
        {paquetes.map((p) => {
          const discountPct =
            Number(p.originalPrice) > Number(p.price)
              ? Math.round((1 - Number(p.price) / Number(p.originalPrice)) * 100)
              : null

          return (
            <Card key={p.id} className={!p.isActive ? "opacity-60" : undefined}>
              <CardContent className="flex flex-col gap-4 pt-6">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-lg font-semibold leading-snug text-brand-dark">{p.name}</h2>
                  {!p.isActive && (
                    <span className="shrink-0 rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-brand-gray">
                      Inactivo
                    </span>
                  )}
                </div>

                {p.description && (
                  <p className="line-clamp-2 text-sm text-brand-gray">{p.description}</p>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-brand-bg px-2.5 py-1 text-xs font-medium text-brand-dark">
                    {p.sessionCount} sesiones
                  </span>
                  {p.validityDays && (
                    <span className="rounded-full bg-brand-bg px-2.5 py-1 text-xs font-medium text-brand-dark">
                      Valido {p.validityDays} dias
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-2 border-t border-gray-100 pt-3">
                  <span className="text-xl font-bold text-brand-violet">{formatPrice(p.price)}</span>
                  {discountPct !== null && (
                    <>
                      <span className="text-sm text-brand-gray line-through">
                        {formatPrice(p.originalPrice)}
                      </span>
                      <span className="ml-auto rounded-full bg-brand-green/10 px-2 py-0.5 text-xs font-semibold text-brand-green">
                        -{discountPct}%
                      </span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-1 pt-1">
                  <Button asChild size="sm" variant="outline" className="flex-1">
                    <Link href={`/profesional/paquetes/${p.id}/editar`}>
                      <Pencil className="h-3.5 w-3.5" />
                      Editar
                    </Link>
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    title={p.isActive ? "Desactivar" : "Activar"}
                    onClick={() => toggleActive(p)}
                  >
                    <Power className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    title="Eliminar"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => setDeleteId(p.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar paquete</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-brand-gray">
            Esta accion no se puede deshacer. Confirmas eliminar este paquete?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
