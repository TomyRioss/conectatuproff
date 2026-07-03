"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { PaqueteForm, type PaqueteFormValues } from "@/components/profesionales/PaqueteForm"

interface Paquete {
  id: string
  name: string
  description: string | null
  sessionCount: number
  price: string
  originalPrice: string
  validityDays: number | null
}

export default function EditarPaquetePage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const [paquete, setPaquete] = useState<Paquete | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/profesional/paquetes/${params.id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Paquete no encontrado")
        return res.json()
      })
      .then(setPaquete)
      .catch((e) => setError(e.message))
  }, [params.id])

  const handleSubmit = async (values: PaqueteFormValues) => {
    const res = await fetch(`/api/profesional/paquetes/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: values.name,
        description: values.description || null,
        sessionCount: Number(values.sessionCount),
        price: Number(values.price),
        originalPrice: Number(values.originalPrice),
        validityDays: values.validityDays ? Number(values.validityDays) : null,
      }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || "Error al guardar paquete")
    }
    router.push("/profesional/paquetes")
    router.refresh()
  }

  if (error) {
    return <div className="mx-auto max-w-2xl px-4 py-8 text-red-600">{error}</div>
  }
  if (!paquete) {
    return <div className="mx-auto max-w-2xl px-4 py-8 text-brand-gray">Cargando...</div>
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-brand-dark">Editar paquete</h1>
      <PaqueteForm
        initialValues={{
          name: paquete.name,
          description: paquete.description ?? "",
          sessionCount: String(paquete.sessionCount),
          price: paquete.price,
          originalPrice: paquete.originalPrice,
          validityDays: paquete.validityDays ? String(paquete.validityDays) : "",
        }}
        onSubmit={handleSubmit}
        submitLabel="Guardar cambios"
      />
    </div>
  )
}
