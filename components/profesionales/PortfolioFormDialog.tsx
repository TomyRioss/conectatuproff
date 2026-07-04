"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { PortfolioForm, type PortfolioFormValue } from "@/components/profesionales/PortfolioForm"

export function PortfolioFormDialog({
  open,
  onOpenChange,
  item,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  item?: PortfolioFormValue
  onSaved: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-brand-dark font-display">
          {item ? "Editar proyecto" : "Nuevo proyecto"}
        </h2>
        <div className="mt-2">
          <PortfolioForm item={item} onSaved={() => { onOpenChange(false); onSaved() }} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
