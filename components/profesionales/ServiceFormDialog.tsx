"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { ServiceForm } from "@/components/profesionales/ServiceForm"

export function ServiceFormDialog({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <h2 className="text-lg font-bold text-brand-dark font-display">Nuevo servicio</h2>
        <div className="mt-2">
          <ServiceForm onSaved={() => { onOpenChange(false); onSaved() }} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
