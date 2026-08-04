"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

export function LeaveReviewButton({ professionalId, professionalName }: { professionalId: string; professionalName: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState("")
  const [saving, setSaving] = useState(false)

  async function submit() {
    if (rating < 1) {
      toast.error("Elegí una calificación")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/resenas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ professionalId, rating, comment: comment.trim() || undefined }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error === "REVIEW_EXISTS" ? "Ya dejaste una reseña para este profesional" : "No se pudo guardar la reseña")
        return
      }
      toast.success("Reseña publicada")
      setOpen(false)
      router.refresh()
    } catch {
      toast.error("No se pudo guardar la reseña")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-brand-green hover:bg-brand-green/90 transition-colors px-3 py-1.5 rounded-full shadow-sm"
      >
        <Star size={13} className="fill-white" />
        Dejar reseña
      </button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dejar reseña</DialogTitle>
          <DialogDescription>¿Cómo te fue con {professionalName}?</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => {
            const value = i + 1
            const filled = value <= (hoverRating || rating)
            return (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                onMouseEnter={() => setHoverRating(value)}
                onMouseLeave={() => setHoverRating(0)}
                aria-label={`${value} de 5 estrellas`}
                className="p-0.5"
              >
                <Star size={24} className={filled ? "fill-brand-violet text-brand-violet" : "text-gray-300"} />
              </button>
            )
          })}
        </div>

        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Contanos tu experiencia (opcional)"
          rows={4}
        />

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={saving} className="bg-brand-green hover:bg-brand-green/90">
            {saving ? "Guardando..." : "Publicar reseña"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
