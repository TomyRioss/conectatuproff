import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import { ServiceWizard } from "@/components/profesionales/wizard/ServiceWizard"
import type { WizardState } from "@/components/profesionales/wizard/types"

export default async function EditarServicioPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  if ((session.user as { role?: string }).role !== "PROFESSIONAL") redirect("/")

  const professional = await prisma.professional.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })
  if (!professional) redirect("/profesional/onboarding")

  const { id } = await params
  const service = await prisma.service.findUnique({
    where: { id },
    include: {
      gallery: { orderBy: { order: "asc" } },
      faqs: { orderBy: { order: "asc" } },
      sessionPackages: true,
      availability: true,
    },
  })
  if (!service || service.professionalId !== professional.id) notFound()

  const initialState: WizardState = {
    title: service.title,
    price: service.price ? String(service.price) : "",
    durationMin: service.durationMin ? String(service.durationMin) : "",
    frequencyType: service.frequencyType ?? "UNICA",
    frequencyCount: service.frequencyCount ? String(service.frequencyCount) : "",
    frequencyPeriods: service.frequencyPeriods ? String(service.frequencyPeriods) : "",
    modality: service.modality ?? "",
    categoryId: service.categoryId ?? "",
    extraSessionPrice: service.extraSessionPrice ? String(service.extraSessionPrice) : "",
    sessionPackages: service.sessionPackages.map((p) => ({
      sessionCount: String(p.sessionCount),
      price: String(p.price),
      frequencyType: p.frequencyType ?? "UNICA",
    })),
    description: service.description ?? "",
    faqs: service.faqs.map((f) => ({ question: f.question, answer: f.answer })),
    gallery: service.gallery.map((g) => ({ key: g.imageUrl, type: "image" as const })),
    availability: service.availability.map((a) => ({ dayOfWeek: a.dayOfWeek, startTime: a.startTime, endTime: a.endTime })),
  }

  return <ServiceWizard serviceId={service.id} initialState={initialState} initialVideoUrl={service.videoUrl ?? ""} />
}
