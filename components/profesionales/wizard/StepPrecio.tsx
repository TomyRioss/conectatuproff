import { useEffect, useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import type { Category, WizardState } from "./types"

export function StepPrecio({
  state,
  update,
}: {
  state: WizardState
  update: (patch: Partial<WizardState>) => void
}) {
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    fetch("/api/categorias")
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {})
  }, [])

  function addPackage() {
    update({ sessionPackages: [...state.sessionPackages, { sessionCount: "", price: "", frequencyType: "UNICA" }] })
  }

  function updatePackage(index: number, patch: Partial<WizardState["sessionPackages"][number]>) {
    const next = state.sessionPackages.map((p, i) => (i === index ? { ...p, ...patch } : p))
    update({ sessionPackages: next })
  }

  function removePackage(index: number) {
    update({ sessionPackages: state.sessionPackages.filter((_, i) => i !== index) })
  }

  function formatMiles(digits: string) {
    return digits ? Number(digits).toLocaleString("es-AR") : ""
  }

  function onlyDigits(value: string) {
    return value.replace(/\D/g, "")
  }

  return (
    <div className="max-w-xl">
      <h2 className="text-2xl font-bold text-brand-dark">Precio y duración</h2>
      <p className="text-brand-gray text-sm mt-1">Definí el precio base, packs de sesiones y sesiones extra.</p>

      <div className="grid grid-cols-2 gap-4 mt-6">
        <div>
          <Label htmlFor="price">Precio (ARS)</Label>
          <Input
            id="price"
            inputMode="numeric"
            placeholder="Ej: 50.000"
            value={formatMiles(state.price)}
            onChange={(e) => update({ price: onlyDigits(e.target.value) })}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="durationMin">Duración (minutos)</Label>
          <Input id="durationMin" type="number" min="0" placeholder="Ej: 60" value={state.durationMin} onChange={(e) => update({ durationMin: e.target.value })} className="mt-1" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4">
        <div>
          <Label htmlFor="frequencyType">Frecuencia</Label>
          <select
            id="frequencyType"
            value={state.frequencyType}
            onChange={(e) => update({ frequencyType: e.target.value as WizardState["frequencyType"] })}
            className="w-full h-9 mt-1 rounded-md border border-gray-200 bg-white px-3 pr-8 text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-violet/30 focus:border-brand-violet"
          >
            <option value="UNICA">Sesión única</option>
            <option value="SEMANAL">Veces por semana</option>
            <option value="MENSUAL">Veces por mes</option>
          </select>
        </div>
        {state.frequencyType !== "UNICA" && (
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

      {state.frequencyType !== "UNICA" && (
        <div className="grid grid-cols-2 gap-4 mt-4">
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

      <div className="grid grid-cols-2 gap-4 mt-4">
        <div>
          <Label htmlFor="modality">Modalidad</Label>
          <select
            id="modality"
            value={state.modality}
            onChange={(e) => update({ modality: e.target.value })}
            className="w-full h-9 mt-1 rounded-md border border-gray-200 bg-white px-3 pr-8 text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-violet/30 focus:border-brand-violet"
          >
            <option value="">Sin especificar</option>
            <option value="ONLINE">Online</option>
            <option value="IN_PERSON">Presencial</option>
            <option value="HYBRID">Híbrido</option>
          </select>
        </div>
        <div>
          <Label htmlFor="categoryId">Categoría</Label>
          <select
            id="categoryId"
            value={state.categoryId}
            onChange={(e) => update({ categoryId: e.target.value })}
            className="w-full h-9 mt-1 rounded-md border border-gray-200 bg-white px-3 pr-8 text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-violet/30 focus:border-brand-violet"
          >
            <option value="">Sin categoría</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6">
        <Label htmlFor="extraSessionPrice">Precio de sesión extra (ARS)</Label>
        <p className="text-xs text-brand-gray mb-1">Opcional. El cliente puede pedir sesiones adicionales a este precio.</p>
        <Input
          id="extraSessionPrice"
          inputMode="numeric"
          placeholder="Ej: 15.000"
          value={formatMiles(state.extraSessionPrice)}
          onChange={(e) => update({ extraSessionPrice: onlyDigits(e.target.value) })}
        />
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <Label>Packs de sesiones</Label>
            <p className="text-xs text-brand-gray">Opcional. Ej: 3, 5 o 10 sesiones con precio especial.</p>
          </div>
          <Button type="button" variant="outline" onClick={addPackage} className="gap-1.5 border-gray-200 text-brand-dark">
            <Plus size={14} /> Agregar pack
          </Button>
        </div>

        <div className="flex flex-col gap-3 mt-4">
          {state.sessionPackages.map((pkg, i) => (
            <div key={i} className="flex items-center gap-3">
              <Input
                type="number"
                min="1"
                placeholder="Cant. sesiones"
                value={pkg.sessionCount}
                onChange={(e) => updatePackage(i, { sessionCount: e.target.value })}
                className="w-32"
              />
              <select
                value={pkg.frequencyType}
                onChange={(e) => updatePackage(i, { frequencyType: e.target.value as WizardState["frequencyType"] })}
                className="h-9 rounded-md border border-gray-200 bg-white px-3 pr-8 text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-violet/30 focus:border-brand-violet"
              >
                <option value="UNICA">Sesión única</option>
                <option value="SEMANAL">Semanales</option>
                <option value="MENSUAL">Mensuales</option>
              </select>
              <Input
                inputMode="numeric"
                placeholder="Precio (ARS)"
                value={formatMiles(pkg.price)}
                onChange={(e) => updatePackage(i, { price: onlyDigits(e.target.value) })}
                className="w-32"
              />
              <button type="button" onClick={() => removePackage(i)} aria-label="Quitar pack" className="text-brand-gray hover:text-red-600">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
