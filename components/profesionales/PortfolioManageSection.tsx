"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { SquareArrowOutUpRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PortfolioFormDialog } from "@/components/profesionales/PortfolioFormDialog"
import type { PortfolioFormValue } from "@/components/profesionales/PortfolioForm"

export function PortfolioManageSection({ username }: { username: string }) {
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
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <h2 className="text-lg font-bold text-brand-dark font-display mb-3">Portfolio</h2>

      {items.length === 0 ? (
        <p className="text-sm text-brand-gray mb-4">Todavía no agregaste proyectos.</p>
      ) : (
        <div className="flex gap-2 overflow-x-auto mb-4">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => { setEditing(item); setDialogOpen(true) }}
              className="shrink-0 w-28 aspect-video rounded-lg overflow-hidden border border-gray-200 bg-brand-bg"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/avatar?key=${encodeURIComponent(item.images[0]?.imageUrl ?? "")}`}
                alt={item.title ?? "Proyecto"}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      <Button
        variant="outline"
        className="border-gray-200 text-brand-dark gap-2"
        asChild
      >
        <Link href={`/${username}/portfolio`}>
          <SquareArrowOutUpRight size={16} /> Revisar portfolio
        </Link>
      </Button>

      <PortfolioFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={editing}
        onSaved={load}
      />
    </div>
  )
}
