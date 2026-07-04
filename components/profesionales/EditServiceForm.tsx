"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { ServiceForm, type ServiceFormValue } from "@/components/profesionales/ServiceForm"

export function EditServiceForm({ service }: { service: ServiceFormValue }) {
  const router = useRouter()

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-8">
      <Link href="/profesional/servicios" className="inline-flex items-center gap-2 text-sm text-brand-gray hover:text-brand-dark mb-4">
        <ArrowLeft size={16} /> Volver a mis servicios
      </Link>
      <h1 className="text-lg font-bold text-brand-dark font-display mb-4">Editar servicio</h1>
      <ServiceForm service={service} onSaved={() => router.push("/profesional/servicios")} />
    </div>
  )
}
