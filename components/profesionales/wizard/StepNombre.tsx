import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { WizardState } from "./types"

export function StepNombre({
  state,
  update,
}: {
  state: WizardState
  update: (patch: Partial<WizardState>) => void
}) {
  return (
    <div className="max-w-xl">
      <h2 className="text-xl sm:text-2xl font-bold text-brand-dark">¿Cómo se llama tu servicio?</h2>
      <p className="text-brand-gray text-sm mt-1">
        Un título claro y directo ayuda a que los clientes lo encuentren fácil.
      </p>

      <div className="mt-6">
        <Label htmlFor="title" className="text-brand-dark">Nombre del servicio</Label>
        <Input
          id="title"
          value={state.title}
          onChange={(e) => update({ title: e.target.value })}
          placeholder="Ej: Manicura profesional a domicilio"
          className="mt-1"
        />
        <p className="text-xs text-brand-gray mt-1">{state.title.length}/80 caracteres</p>
      </div>
    </div>
  )
}
