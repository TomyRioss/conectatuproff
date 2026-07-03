"use client"

import { useRouter } from "next/navigation"
import { PaqueteForm, type PaqueteFormValues } from "@/components/profesionales/PaqueteForm"

export default function NuevoPaquetePage() {
  const router = useRouter()

  const handleSubmit = async (values: PaqueteFormValues) => {
    const res = await fetch("/api/profesional/paquetes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: values.name,
        description: values.description || undefined,
        sessionCount: Number(values.sessionCount),
        price: Number(values.price),
        originalPrice: Number(values.originalPrice),
        validityDays: values.validityDays ? Number(values.validityDays) : undefined,
      }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || "Error al crear paquete")
    }
    router.push("/profesional/paquetes")
    router.refresh()
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-brand-dark">Nuevo paquete</h1>
      <PaqueteForm onSubmit={handleSubmit} submitLabel="Crear paquete" />
    </div>
  )
}
