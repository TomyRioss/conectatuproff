import { useEffect, useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { SelectNative } from "@/components/ui/select-native"
import { formatDuration } from "@/lib/time"
import type { Category, WizardState } from "./types"

export function StepPrecio({
  state,
  update,
  durationError,
}: {
  state: WizardState
  update: (patch: Partial<WizardState>) => void
  durationError: boolean
}) {
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    fetch("/api/categorias")
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {})
  }, [])

  function formatMiles(digits: string) {
    return digits ? Number(digits).toLocaleString("es-AR") : ""
  }

  function onlyDigits(value: string) {
    return value.replace(/\D/g, "")
  }

  return (
    <div className="max-w-xl">
      <h2 className="text-xl sm:text-2xl font-bold text-brand-dark">Precio y duración</h2>
      <p className="text-brand-gray text-sm mt-1">Definí el precio y la duración de tu servicio.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
        <div>
          <Label htmlFor="price">Precio (ARS)</Label>
          <Input
            id="price"
            inputMode="numeric"
            placeholder="Ej: 50.000"
            value={formatMiles(state.price)}
            onChange={(e) => {
              const price = onlyDigits(e.target.value)
              update({ price, ...(state.extraSessionPrice ? { extraSessionPrice: price } : {}) })
            }}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="durationMin">Duración (horas) *</Label>
          <SelectNative
            id="durationMin"
            required
            value={state.durationMin}
            onChange={(e) => update({ durationMin: e.target.value })}
            aria-invalid={durationError}
            aria-describedby={durationError ? "durationMin-error" : undefined}
            className={`w-full h-12 sm:h-10 mt-1 rounded-md border bg-white px-3 text-base sm:text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-violet/30 focus:border-brand-violet ${durationError ? "border-red-600" : "border-gray-200"}`}
          >
            <option value="">Elegí la duración</option>
            <option value="60">1 hora</option>
            <option value="120">2 horas</option>
            <option value="180">3 horas</option>
          </SelectNative>
          {durationError && (
            <p id="durationMin-error" role="alert" className="mt-2 text-sm text-red-600">
              Elegí la duración para continuar. La necesitamos para calcular tus horarios.
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <div>
          <Label htmlFor="frequencyType">Frecuencia (opcional)</Label>
          <SelectNative
            id="frequencyType"
            value={state.frequencyType}
            onChange={(e) => update({
              frequencyType: e.target.value as WizardState["frequencyType"],
              ...(e.target.value === "" ? { frequencyCount: "", frequencyPeriods: "" } : {}),
            })}
            className="w-full h-12 sm:h-9 mt-1 rounded-md border border-gray-200 bg-white px-3 text-base sm:text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-violet/30 focus:border-brand-violet"
          >
            <option value="UNICA">Sesión única</option>
            <option value="">Usar toda mi agenda disponible</option>
            <option value="SEMANAL">Veces por semana</option>
            <option value="MENSUAL">Veces por mes</option>
          </SelectNative>
        </div>
        {state.frequencyType && state.frequencyType !== "UNICA" && (
          <div>
            <Label htmlFor="frequencyCount">
              {state.frequencyType === "SEMANAL" ? "Veces por semana" : "Veces por mes"}
            </Label>
            <Input
              id="frequencyCount"
              type="number"
              min="1"
              placeholder="Ej: 1"
              value={state.frequencyCount}
              onChange={(e) => update({ frequencyCount: e.target.value })}
              className="mt-1"
            />
          </div>
        )}
      </div>

      {state.frequencyType && state.frequencyType !== "UNICA" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div>
            <Label htmlFor="frequencyPeriods">
              {state.frequencyType === "SEMANAL" ? "Duración (semanas)" : "Duración (meses)"}
            </Label>
            <Input
              id="frequencyPeriods"
              type="number"
              min="1"
              placeholder="Opcional"
              value={state.frequencyPeriods}
              onChange={(e) => update({ frequencyPeriods: e.target.value })}
              className="mt-1"
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <div>
          <Label htmlFor="modality">Modalidad</Label>
          <SelectNative
            id="modality"
            value={state.modality}
            onChange={(e) => update({ modality: e.target.value })}
            className="w-full h-12 sm:h-9 mt-1 rounded-md border border-gray-200 bg-white px-3 text-base sm:text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-violet/30 focus:border-brand-violet"
          >
            <option value="">Sin especificar</option>
            <option value="ONLINE">Online</option>
            <option value="IN_PERSON">Presencial</option>
            <option value="HYBRID">Híbrido</option>
          </SelectNative>
        </div>
        <div>
          <Label htmlFor="categoryId">Categoría</Label>
          <SelectNative
            id="categoryId"
            value={state.categoryId}
            onChange={(e) => update({ categoryId: e.target.value })}
            className="w-full h-12 sm:h-9 mt-1 rounded-md border border-gray-200 bg-white px-3 text-base sm:text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-violet/30 focus:border-brand-violet"
          >
            <option value="">Sin categoría</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </SelectNative>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 items-center gap-4 border-t border-gray-200 pt-6 sm:grid-cols-[minmax(0,1fr)_minmax(260px,300px)]">
        <p className="text-sm text-brand-gray">
          Agrega un precio para los clientes que quieren agendar más de una sesión a la vez.
        </p>
        {state.extraSessionPrice ? (
          <div className="flex w-full max-w-full items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3">
            <div className="text-sm text-brand-dark">
              <p>Precio: ${Number(state.extraSessionPrice).toLocaleString("es-AR")}</p>
              {state.durationMin && (
                <p>Duración: {formatDuration(Number(state.durationMin))}</p>
              )}
            </div>
            <button
              type="button"
              aria-label="Quitar precio por sesión extra"
              title="Quitar precio por sesión extra"
              onClick={() => update({ extraSessionPrice: "" })}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-brand-gray transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-violet/40"
            >
              <Trash2 size={17} />
            </button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            disabled={!state.price}
            onClick={() => update({ extraSessionPrice: state.price })}
            className="gap-1.5 border-gray-200 text-brand-dark justify-center min-h-[44px] sm:min-h-0"
          >
            <Plus size={14} />
            Agregar precio por sesión extra
          </Button>
        )}
      </div>
    </div>
  )
}
