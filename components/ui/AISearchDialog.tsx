"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Sparkles } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
}

export function AISearchDialog({ open, onOpenChange }: Props) {
  const [query, setQuery] = useState("")
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    onOpenChange(false)
    router.push(`/buscar?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-0 shadow-2xl rounded-2xl gap-0">
        <div className="bg-brand-dark px-6 pt-6 pb-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-white text-lg">
              <div className="w-8 h-8 rounded-lg bg-brand-violet flex items-center justify-center shrink-0">
                <Sparkles size={15} className="text-white" />
              </div>
              Buscar con IA
            </DialogTitle>
          </DialogHeader>
          <DialogDescription className="text-white/60 text-sm mt-2 ml-[42px]">
            Describí lo que necesitás y encontramos al profesional ideal.
          </DialogDescription>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4 bg-white">
          <textarea
            autoFocus
            rows={4}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ej: Necesito un masajista en Palermo que atienda fines de semana y tenga experiencia con deportistas..."
            className="w-full resize-none rounded-xl border border-gray-200 bg-brand-bg px-4 py-3 text-sm text-brand-dark placeholder:text-brand-gray/60 outline-none focus:border-brand-violet focus:ring-2 focus:ring-brand-violet/20 focus:bg-white transition-colors"
          />
          <button
            type="submit"
            disabled={!query.trim()}
            className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:bg-gray-200 disabled:text-brand-gray disabled:cursor-not-allowed enabled:bg-brand-violet enabled:text-white enabled:hover:opacity-90"
          >
            <Sparkles size={14} />
            Buscar profesional
          </button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
