"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { Loader2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PortfolioFormDialog } from "@/components/profesionales/PortfolioFormDialog"
import { PortfolioCard } from "@/components/profesionales/PortfolioCard"
import type { PortfolioFormValue } from "@/components/profesionales/PortfolioForm"

export function PortfolioManageSection() {
  const [items, setItems] = useState<PortfolioFormValue[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<PortfolioFormValue | undefined>(undefined)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/profesional/portfolio")
      if (!response.ok) throw new Error("No se pudo cargar")
      const data = await response.json()
      setItems(Array.isArray(data) ? data : [])
    } catch {
      toast.error("No se pudieron cargar tus publicaciones")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6" aria-labelledby="portfolio-heading">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="portfolio-heading" className="text-lg font-bold text-brand-dark font-display">Mis publicaciones</h2>
          <p className="mt-1 text-sm text-brand-gray">Administrá los trabajos que compartís en tu perfil.</p>
        </div>
        <Button
          type="button"
          onClick={() => { setEditing(undefined); setDialogOpen(true) }}
          className="min-h-11 gap-2 bg-brand-green text-white hover:opacity-90"
        >
          <Plus size={16} /> Nueva publicación
        </Button>
      </div>

      {loading ? (
        <div className="flex min-h-24 items-center justify-center text-brand-gray" role="status" aria-label="Cargando publicaciones">
          <Loader2 size={20} className="animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <p className="rounded-xl bg-brand-bg px-4 py-6 text-center text-sm text-brand-gray">
          Todavía no agregaste publicaciones.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <PortfolioCard
              key={item.id}
              item={item}
              onEdit={() => { setEditing(item); setDialogOpen(true) }}
              onChanged={load}
            />
          ))}
        </div>
      )}

      <PortfolioFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={editing}
        onSaved={load}
      />
    </section>
  )
}
