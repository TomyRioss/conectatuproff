"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StepNombre } from "./StepNombre"
import { StepPrecio } from "./StepPrecio"
import { StepDisponibilidad } from "./StepDisponibilidad"
import { StepDescripcion } from "./StepDescripcion"
import { StepGaleria } from "./StepGaleria"
import { StepRevisar } from "./StepRevisar"
import { STEPS, initialWizardState, type WizardState } from "./types"

function validateStep(step: number, state: WizardState) {
  if (step === 0) return state.title.trim().length > 0
  if (step === 1) return Number(state.price) > 0
  return true
}

function buildPayload(state: WizardState, videoUrl: string) {
  return {
    title: state.title,
    description: state.description || undefined,
    price: state.price ? Number(state.price) : undefined,
    durationMin: state.durationMin ? Number(state.durationMin) : undefined,
    frequencyType: state.frequencyType,
    frequencyCount: state.frequencyType !== "UNICA" && state.frequencyCount ? Number(state.frequencyCount) : undefined,
    frequencyPeriods: state.frequencyType !== "UNICA" && state.frequencyPeriods ? Number(state.frequencyPeriods) : undefined,
    modality: state.modality || undefined,
    categoryId: state.categoryId || undefined,
    imageUrl: state.gallery[0]?.key || undefined,
    videoUrl: videoUrl || undefined,
    extraSessionPrice: state.extraSessionPrice ? Number(state.extraSessionPrice) : undefined,
    gallery: state.gallery.map((g) => g.key),
    faqs: state.faqs.filter((f) => f.question.trim() && f.answer.trim()),
    sessionPackages: state.sessionPackages
      .filter((p) => Number(p.sessionCount) > 0 && Number(p.price) > 0)
      .map((p) => ({ sessionCount: Number(p.sessionCount), price: Number(p.price), frequencyType: p.frequencyType })),
    availability: state.availability,
  }
}

export function ServiceWizard({
  serviceId,
  initialState,
  initialVideoUrl,
}: {
  serviceId?: string
  initialState?: WizardState
  initialVideoUrl?: string
} = {}) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [state, setState] = useState<WizardState>(initialState ?? initialWizardState)
  const [videoUrl, setVideoUrl] = useState(initialVideoUrl ?? "")
  const [publishing, setPublishing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [draftId, setDraftId] = useState<string | null>(serviceId ?? null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const skipNextAutosave = useRef(true)

  function update(patch: Partial<WizardState>) {
    setState((s) => ({ ...s, ...patch }))
  }

  useEffect(() => {
    if (skipNextAutosave.current) {
      skipNextAutosave.current = false
      return
    }
    if (!state.title.trim()) return

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setSaving(true)
      try {
        const payload = { ...buildPayload(state, videoUrl), status: "DRAFT" as const }
        const res = await fetch(
          draftId ? `/api/profesional/servicios/${draftId}` : "/api/profesional/servicios",
          {
            method: draftId ? "PATCH" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        )
        const data = await res.json().catch(() => null)
        if (res.ok && !draftId && data?.id) setDraftId(data.id)
      } catch {
        // autosave silencioso: no interrumpe al usuario
      } finally {
        setSaving(false)
      }
    }, 900)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, videoUrl])

  function goNext() {
    if (!validateStep(step, state)) {
      toast.error(step === 0 ? "Ponele un nombre al servicio" : "Ingresá un precio válido")
      return
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 0))
  }

  async function publish() {
    setPublishing(true)
    try {
      const payload = { ...buildPayload(state, videoUrl), status: "ACTIVE" as const }
      const res = await fetch(
        draftId ? `/api/profesional/servicios/${draftId}` : "/api/profesional/servicios",
        {
          method: draftId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      )
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        toast.error(data?.error ?? "No se pudo publicar el servicio")
        return
      }
      toast.success("Servicio publicado")
      router.push("/profesional/servicios")
      router.refresh()
    } catch {
      toast.error("No se pudo publicar el servicio")
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <div className="relative flex items-center justify-between mb-10">
        <div className="flex items-center gap-2 flex-1">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2 flex-1">
              <div className="flex items-center gap-2">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                    i < step
                      ? "bg-brand-green text-white"
                      : i === step
                      ? "bg-brand-dark text-white"
                      : "bg-gray-200 text-brand-gray"
                  }`}
                >
                  {i < step ? <Check size={14} /> : i + 1}
                </div>
                <span className={`text-sm font-medium hidden sm:inline ${i === step ? "text-brand-dark" : "text-brand-gray"}`}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && <div className={`h-0.5 flex-1 ${i < step ? "bg-brand-green" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>
        {saving && (
          <span className="flex items-center gap-1.5 text-xs text-brand-gray ml-4 shrink-0 absolute right-4 sm:right-6 top-10">
            <Loader2 size={12} className="animate-spin" /> Guardando borrador...
          </span>
        )}
      </div>

      {step === 0 && <StepNombre state={state} update={update} />}
      {step === 1 && <StepPrecio state={state} update={update} />}
      {step === 2 && <StepDisponibilidad state={state} update={update} />}
      {step === 3 && <StepDescripcion state={state} update={update} />}
      {step === 4 && <StepGaleria state={state} update={update} videoUrl={videoUrl} setVideoUrl={setVideoUrl} />}
      {step === 5 && <StepRevisar state={state} videoUrl={videoUrl} />}

      <div className="max-w-2xl flex items-center justify-between mt-10 pt-6 border-t border-gray-200">
        {step > 0 ? (
          <Button type="button" variant="outline" onClick={goBack} className="border-gray-200 text-brand-dark">
            Atrás
          </Button>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-3">
          <Button type="button" variant="ghost" onClick={() => router.push("/profesional/servicios")} className="text-brand-gray hover:text-brand-dark">
            Cancelar
          </Button>
          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={goNext} className="bg-brand-dark text-white hover:opacity-90">
              Continuar
            </Button>
          ) : (
            <Button type="button" onClick={publish} disabled={publishing} className="bg-brand-green text-white hover:opacity-90">
              {publishing ? "Publicando..." : "Publicar servicio"}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
