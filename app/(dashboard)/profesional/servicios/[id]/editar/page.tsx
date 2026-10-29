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
    select: {
      id: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      specialty: true,
      location: true,
      isPro: true,
      user: { select: { username: true, image: true } },
    },
  })
  if (!professional) redirect("/profesional/onboarding")

  const { id } = await params
  const service = await prisma.service.findUnique({
    where: { id },
    include: {
      gallery: { orderBy: { order: "asc" } },
      faqs: { orderBy: { order: "asc" } },
      availability: true,
    },
  })
  if (!service || service.professionalId !== professional.id) notFound()

  const professionalServices = await prisma.service.findMany({
    where: { professionalId: professional.id, status: "ACTIVE" },
    select: { id: true, title: true, imageUrl: true },
    orderBy: { createdAt: "asc" },
  })

  const initialState: WizardState = {
    title: service.title,
    price: service.price ? String(service.price) : "",
    durationMin: service.durationMin ? String(service.durationMin) : "",
    frequencyType: service.frequencyType ?? "",
    frequencyCount: service.frequencyCount ? String(service.frequencyCount) : "",
    frequencyPeriods: service.frequencyPeriods ? String(service.frequencyPeriods) : "",
    modality: service.modality ?? "",
    categoryId: service.categoryId ?? "",
    extraSessionPrice: service.extraSessionPrice ? String(service.price ?? service.extraSessionPrice) : "",
    description: service.description ?? "",
    faqs: service.faqs.map((f) => ({ question: f.question, answer: f.answer })),
    gallery: service.gallery.map((g) => ({ key: g.imageUrl, type: "image" as const, description: g.description ?? "" })),
    availability: service.availability.map((a) => ({ dayOfWeek: a.dayOfWeek, startTime: a.startTime, endTime: a.endTime })),
  }

  return (
    <ServiceWizard
      serviceId={service.id}
      initialState={initialState}
      initialVideoUrl={service.videoUrl ?? ""}
      professionalPreview={{
        firstName: professional.firstName,
        lastName: professional.lastName,
        avatarUrl: professional.avatarUrl,
        specialty: professional.specialty,
        location: professional.location,
        isPro: professional.isPro,
        username: professional.user.username,
        image: professional.user.image,
      }}
      professionalServicesPreview={professionalServices}
    />
  )
}
