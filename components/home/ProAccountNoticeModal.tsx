"use client"

import { useEffect, useState } from "react"
import { Clock, Ban } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

// reason: "PENDING_REVIEW" (archivada / en revisión) | "BANNED" (deshabilitada)
export default function ProAccountNoticeModal({ reason }: { reason: string }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    try {
      if (sessionStorage.getItem(`proNotice:${reason}`) === "1") return
    } catch {
      // sessionStorage no disponible: mostrar igual
    }
    setOpen(true)
  }, [reason])

  function dismiss() {
    try {
      sessionStorage.setItem(`proNotice:${reason}`, "1")
    } catch {}
    setOpen(false)
  }

  const banned = reason === "BANNED"

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : dismiss())}>
      <DialogContent>
        <DialogHeader>
          <div
            className={`flex size-11 items-center justify-center rounded-full ${
              banned ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"
            }`}
          >
            {banned ? <Ban size={22} /> : <Clock size={22} />}
          </div>
          <DialogTitle className="text-brand-dark">
            {banned
              ? "Tu cuenta profesional fue deshabilitada"
              : "Tu cuenta profesional está en revisión"}
          </DialogTitle>
          <DialogDescription className="text-brand-gray leading-relaxed">
            {banned ? (
              <>
                Tu cuenta de profesional fue deshabilitada por el equipo de ConectaTuProff. Ya no
                tenés acceso al panel profesional. Mientras tanto seguís con tu cuenta de cliente
                activa. Si querés más información o apelar la decisión, escribinos a soporte.
              </>
            ) : (
              <>
                Tu cuenta Profesional está siendo revisada por el equipo de ConectaTuProff, tendrás
                novedades en breves. Te avisaremos por email apenas se resuelva. Mientras tanto te
                dejamos usar la plataforma con tu cuenta de cliente.
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <button
            onClick={dismiss}
            className="rounded-xl bg-brand-green px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Entendido
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
