import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { addMinutes } from "@/lib/availability"
import type { WizardState } from "./types"

const DOW_LABELS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]

export function StepDisponibilidad({
  state,
  update,
}: {
  state: WizardState
  update: (patch: Partial<WizardState>) => void
}) {
  const durationMin = Number(state.durationMin) || 0

  function addBlock() {
    update({ availability: [...state.availability, { dayOfWeek: 1, startTime: "09:00", endTime: addMinutes("09:00", durationMin) }] })
  }

  function updateStart(index: number, startTime: string) {
    update({
      availability: state.availability.map((b, i) => (i === index ? { ...b, startTime, endTime: addMinutes(startTime, durationMin) } : b)),
    })
  }

  function updateDay(index: number, dayOfWeek: number) {
    update({ availability: state.availability.map((b, i) => (i === index ? { ...b, dayOfWeek } : b)) })
  }

  function removeBlock(index: number) {
    update({ availability: state.availability.filter((_, i) => i !== index) })
  }

  return (
    <div className="max-w-xl">
      <h2 className="text-2xl font-bold text-brand-dark">Horarios de este servicio</h2>
      <p className="text-brand-gray text-sm mt-1">
        Opcional. Si no agregás horarios, el cliente reserva dentro de tu horario general de atención. Si agregás al
        menos uno, solo esos días y horas quedan disponibles para reservar este servicio. Cada bloque dura exactamente
        lo que definiste en el paso anterior ({durationMin || "?"} min) — podés agregar varios bloques el mismo día.
      </p>

      {durationMin <= 0 ? (
        <p className="text-sm text-red-600 mt-6">Definí la duración del servicio en el paso anterior antes de agregar horarios.</p>
      ) : (
        <>
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm font-semibold text-brand-dark">Bloques configurados</p>
            <Button type="button" variant="outline" onClick={addBlock} className="gap-1.5 border-gray-200 text-brand-dark">
              <Plus size={14} /> Agregar horario
            </Button>
          </div>

          <div className="flex flex-col gap-3 mt-4">
            {state.availability.length === 0 && (
              <p className="text-sm text-brand-gray">Sin horarios propios configurados.</p>
            )}
            {state.availability.map((block, i) => (
              <div key={i} className="flex items-center gap-3">
                <select
                  value={block.dayOfWeek}
                  onChange={(e) => updateDay(i, Number(e.target.value))}
                  className="h-9 rounded-md border border-gray-200 bg-white px-3 pr-8 text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-violet/30 focus:border-brand-violet"
                >
                  {DOW_LABELS.map((label, dow) => (
                    <option key={dow} value={dow}>{label}</option>
                  ))}
                </select>
                <input
                  type="time"
                  value={block.startTime}
                  onChange={(e) => updateStart(i, e.target.value)}
                  className="h-9 rounded-md border border-gray-200 bg-white px-2 text-sm text-brand-dark"
                />
                <span className="text-sm text-brand-gray">a {addMinutes(block.startTime, durationMin)}</span>
                <button type="button" onClick={() => removeBlock(i)} aria-label="Quitar horario" className="text-brand-gray hover:text-red-600">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
