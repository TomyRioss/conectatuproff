"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PortfolioCard } from "@/components/profesionales/PortfolioCard"
import { PortfolioFormDialog } from "@/components/profesionales/PortfolioFormDialog"
import type { PortfolioFormValue } from "@/components/profesionales/PortfolioForm"

export function PortfolioManageSection() {
  const [items, setItems] = useState<PortfolioFormValue[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<PortfolioFormValue | undefined>(undefined)

  function load() {
    fetch("/api/profesional/portfolio")
      .then((r) => r.json())
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => toast.error("No se pudo cargar el portfolio"))
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-brand-dark font-display">Portfolio</h2>
        <Button
          variant="outline"
          className="border-gray-200 text-brand-dark gap-2"
          onClick={() => { setEditing(undefined); setDialogOpen(true) }}
        >
          <Plus size={16} /> Agregar proyecto
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-brand-gray">Todavía no agregaste proyectos.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
    </div>
  )
}
