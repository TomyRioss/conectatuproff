"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export interface PaqueteFormValues {
  name: string
  description: string
  sessionCount: string
  price: string
  originalPrice: string
  validityDays: string
}

export function PaqueteForm({
  initialValues,
  onSubmit,
  submitLabel,
}: {
  initialValues?: Partial<PaqueteFormValues>
  onSubmit: (values: PaqueteFormValues) => Promise<void>
  submitLabel: string
}) {
  const router = useRouter()
  const [values, setValues] = useState<PaqueteFormValues>({
    name: initialValues?.name ?? "",
    description: initialValues?.description ?? "",
    sessionCount: initialValues?.sessionCount ?? "1",
    price: initialValues?.price ?? "",
    originalPrice: initialValues?.originalPrice ?? "",
    validityDays: initialValues?.validityDays ?? "",
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const discountPct = useMemo(() => {
    const price = Number(values.price)
    const original = Number(values.originalPrice)
    if (!price || !original || original <= price) return null
    return Math.round((1 - price / original) * 100)
  }, [values.price, values.originalPrice])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await onSubmit(values)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card>
        <CardContent className="space-y-5 pt-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-gray">
            Datos del paquete
          </p>

          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              placeholder="Ej: Pack 4 sesiones de kinesiologia"
              value={values.name}
              onChange={(e) => setValues({ ...values, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripcion</Label>
            <textarea
              id="description"
              placeholder="Que incluye este paquete y para quien es ideal"
              value={values.description}
              onChange={(e) => setValues({ ...values, description: e.target.value })}
              rows={3}
              className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-brand-dark placeholder:text-brand-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sessionCount">Cantidad de sesiones</Label>
              <Input
                id="sessionCount"
                type="number"
                min={1}
                value={values.sessionCount}
                onChange={(e) => setValues({ ...values, sessionCount: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="validityDays">Validez (dias, opcional)</Label>
              <Input
                id="validityDays"
                type="number"
                min={1}
                placeholder="Sin vencimiento"
                value={values.validityDays}
                onChange={(e) => setValues({ ...values, validityDays: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-5 pt-6">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-gray">
              Precio
            </p>
            {discountPct !== null && (
              <span className="rounded-full bg-brand-green/10 px-2.5 py-1 text-xs font-semibold text-brand-green">
                {discountPct}% de ahorro
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Precio del paquete</Label>
              <Input
                id="price"
                type="number"
                min={0}
                step="0.01"
                value={values.price}
                onChange={(e) => setValues({ ...values, price: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="originalPrice">Precio sin descuento</Label>
              <Input
                id="originalPrice"
                type="number"
                min={0}
                step="0.01"
                value={values.originalPrice}
                onChange={(e) => setValues({ ...values, originalPrice: e.target.value })}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "Guardando..." : submitLabel}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
