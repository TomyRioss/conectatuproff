import { Plus, Trash2 } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import type { WizardState } from "./types"

export function StepDescripcion({
  state,
  update,
}: {
  state: WizardState
  update: (patch: Partial<WizardState>) => void
}) {
  function addFaq() {
    update({ faqs: [...state.faqs, { question: "", answer: "" }] })
  }

  function updateFaq(index: number, patch: Partial<{ question: string; answer: string }>) {
    update({ faqs: state.faqs.map((f, i) => (i === index ? { ...f, ...patch } : f)) })
  }

  function removeFaq(index: number) {
    update({ faqs: state.faqs.filter((_, i) => i !== index) })
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl sm:text-2xl font-bold text-brand-dark">Descripción</h2>
      <p className="text-brand-gray text-sm mt-1">Contá en detalle qué incluye tu servicio.</p>

      <div className="mt-6">
        <Label htmlFor="description">Describí tu servicio</Label>
        <Textarea
          id="description"
          value={state.description}
          onChange={(e) => update({ description: e.target.value.slice(0, 1200) })}
          className="mt-1 min-h-40"
          placeholder="Contale a tus clientes qué van a recibir, tu experiencia, materiales que usás, etc."
        />
        <p className="text-xs text-brand-gray mt-1 text-right">{state.description.length}/1200 caracteres</p>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <Label>Preguntas frecuentes</Label>
            <p className="text-xs text-brand-gray">Agregá preguntas y respuestas para tus clientes.</p>
          </div>
          <Button type="button" variant="outline" onClick={addFaq} className="gap-1.5 border-gray-200 text-brand-dark justify-center min-h-[44px] sm:min-h-0">
            <Plus size={14} /> Agregar FAQ
          </Button>
        </div>

        <div className="flex flex-col gap-4 mt-4">
          {state.faqs.map((faq, i) => (
            <div key={i} className="rounded-xl border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <Input
                  value={faq.question}
                  onChange={(e) => updateFaq(i, { question: e.target.value })}
                  placeholder="Pregunta"
                  className="font-medium"
                />
                <button type="button" onClick={() => removeFaq(i)} aria-label="Quitar FAQ" className="text-brand-gray hover:text-red-600 shrink-0 mt-2">
                  <Trash2 size={16} />
                </button>
              </div>
              <Textarea
                value={faq.answer}
                onChange={(e) => updateFaq(i, { answer: e.target.value })}
                placeholder="Respuesta"
                className="mt-3 min-h-20"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
