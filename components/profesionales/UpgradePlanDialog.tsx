"use client"

import { useState } from "react"
import { Check, X, Crown, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ProBadge } from "@/components/ui/ProBadge"

const FEATURES = [
  { label: "Publicar servicios", free: true },
  { label: "Agenda y reservas online", free: true },
  { label: "Badge \"Perfil Pro+\" en tu perfil y servicios", free: false },
  { label: "Prioridad en búsquedas y en la portada", free: false },
  { label: "Tarjeta destacada con borde resaltado", free: false },
  { label: "Prioridad en \"Profesionales verificados en tu zona\"", free: false },
]

export function UpgradePlanDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubscribe() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/profesional/plan/subscribe", { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "No pudimos activar el plan")
      if (data.free) {
        window.location.reload()
        return
      }
      window.location.href = data.init_point
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "No pudimos iniciar el pago")
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden">
        <div className="bg-brand-dark px-6 pt-6 pb-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-white text-lg">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-brand-violet to-brand-green flex items-center justify-center shrink-0">
                <Crown size={15} className="text-white fill-white" />
              </div>
              Mejorá tu plan
            </DialogTitle>
          </DialogHeader>
          <DialogDescription className="text-white/60 text-sm mt-2 ml-[42px]">
            Destacate frente a otros profesionales con Perfil Pro+.
          </DialogDescription>
        </div>

        <div className="p-6 grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-gray-200 p-4">
            <p className="font-semibold text-brand-dark">Free</p>
            <p className="text-xs text-brand-gray mt-0.5">Tu plan actual</p>
            <ul className="mt-4 space-y-3">
              {FEATURES.map((f) => (
                <li key={f.label} className="flex items-start gap-2 text-sm">
                  {f.free ? (
                    <Check size={16} className="text-brand-green shrink-0 mt-0.5" />
                  ) : (
                    <X size={16} className="text-gray-300 shrink-0 mt-0.5" />
                  )}
                  <span className={f.free ? "text-brand-dark" : "text-gray-300"}>{f.label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border-2 border-brand-violet p-4 relative flex flex-col">
            <div className="absolute -top-3 left-4">
              <ProBadge />
            </div>
            <p className="font-semibold text-brand-dark mt-1">Pro+</p>
            <p className="text-xs text-brand-gray mt-0.5">Gratis por tiempo limitado</p>
            <ul className="mt-4 space-y-3 flex-1">
              {FEATURES.map((f) => (
                <li key={f.label} className="flex items-start gap-2 text-sm">
                  <Check size={16} className="text-brand-violet shrink-0 mt-0.5" />
                  <span className="text-brand-dark">{f.label}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full mt-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-brand-violet to-brand-green hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {loading ? "Activando..." : "Activar Pro+ gratis"}
            </button>
            {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
