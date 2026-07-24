import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { ServiceFrequency } from "@/lib/generated/prisma/enums"
import { addMinutes } from "@/lib/availability"

async function getOwnService(userId: string, serviceId: string) {
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: { professional: { select: { userId: true } } },
  })
  if (!service || service.professional.userId !== userId) return null
  return service
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PROFESSIONAL") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { id } = await params
  const existing = await getOwnService(session.user.id, id)
  if (!existing) return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 })

  const body = await req.json()
  const {
    title,
    description,
    price,
    durationMin,
    frequencyType,
    frequencyCount,
    frequencyPeriods,
    modality,
    categoryId,
    imageUrl,
    videoUrl,
    extraSessionPrice,
    gallery,
    faqs,
    sessionPackages,
    availability,
    status,
  } = body

  const isDraft = status === "DRAFT" || (status === undefined && existing.status === "DRAFT")

  if (title !== undefined && !title?.trim()) {
    return NextResponse.json({ error: "Título requerido" }, { status: 400 })
  }
  if (price !== undefined && price !== null && price !== "" && !isDraft && Number(price) <= 0) {
    return NextResponse.json({ error: "Precio inválido" }, { status: 400 })
  }
  if (status !== undefined && !["ACTIVE", "DRAFT", "PAUSED"].includes(status)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 })
  }

  try {
    const data: Record<string, unknown> = {}
    if (title !== undefined) data.title = title.trim()
    if (description !== undefined) data.description = description?.trim() || null
    if (price !== undefined) data.price = price !== null && price !== "" ? Number(price) : null
    if (durationMin !== undefined) data.durationMin = durationMin ? Number(durationMin) : null
    if (frequencyType !== undefined) data.frequencyType = frequencyType || null
    if (frequencyCount !== undefined) data.frequencyCount = frequencyCount ? Number(frequencyCount) : null
    if (frequencyPeriods !== undefined) data.frequencyPeriods = frequencyPeriods ? Number(frequencyPeriods) : null
    if (modality !== undefined) data.modality = modality || null
    if (categoryId !== undefined) data.categoryId = categoryId || null
    if (imageUrl !== undefined) data.imageUrl = imageUrl || null
    if (videoUrl !== undefined) data.videoUrl = videoUrl || null
    if (extraSessionPrice !== undefined) data.extraSessionPrice = extraSessionPrice ? Number(extraSessionPrice) : null
    if (status !== undefined) data.status = status

    if (gallery !== undefined) {
      const galleryUrls: string[] = Array.isArray(gallery) ? gallery.filter(Boolean).slice(0, 3) : []
      data.gallery = {
        deleteMany: {},
        create: galleryUrls.map((url, order) => ({ imageUrl: url, order })),
      }
    }
    if (faqs !== undefined) {
      const faqList: { question: string; answer: string }[] = Array.isArray(faqs)
        ? faqs.filter((f) => f?.question?.trim() && f?.answer?.trim())
        : []
      data.faqs = {
        deleteMany: {},
        create: faqList.map((f, order) => ({ question: f.question.trim(), answer: f.answer.trim(), order })),
      }
    }
    if (sessionPackages !== undefined) {
      const packageList: { sessionCount: number; price: number; frequencyType: ServiceFrequency | null }[] = Array.isArray(sessionPackages)
        ? sessionPackages
            .filter((p) => Number(p?.sessionCount) > 0 && Number(p?.price) > 0)
            .map((p) => ({
              sessionCount: Number(p.sessionCount),
              price: Number(p.price),
              frequencyType: p.frequencyType && p.frequencyType !== "UNICA" ? (p.frequencyType as ServiceFrequency) : null,
            }))
        : []
      data.sessionPackages = {
        deleteMany: {},
        create: packageList,
      }
    }
    if (availability !== undefined) {
      const effectiveDurationMin = durationMin !== undefined ? (durationMin ? Number(durationMin) : null) : existing.durationMin
      const availabilityList: { dayOfWeek: number; startTime: string; endTime: string }[] =
        Array.isArray(availability) && effectiveDurationMin
          ? availability
              .filter((a) => typeof a?.dayOfWeek === "number" && a?.startTime)
              .map((a) => ({ dayOfWeek: a.dayOfWeek, startTime: a.startTime, endTime: addMinutes(a.startTime, effectiveDurationMin) }))
          : []
      data.availability = {
        deleteMany: {},
        create: availabilityList,
      }
    }

    const service = await prisma.service.update({ where: { id }, data })
    return NextResponse.json(service)
  } catch (e) {
    console.error("PATCH /api/profesional/servicios/[id]", e)
    return NextResponse.json({ error: "Error al guardar" }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PROFESSIONAL") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { id } = await params
  const existing = await getOwnService(session.user.id, id)
  if (!existing) return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 })

  try {
    await prisma.service.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("DELETE /api/profesional/servicios/[id]", e)
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 })
  }
}
