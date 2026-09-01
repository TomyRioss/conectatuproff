import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { ServiceFrequency } from "@/lib/generated/prisma/enums"
import { addMinutes } from "@/lib/availability"

async function getOwnProfessionalId(userId: string) {
  const pro = await prisma.professional.findUnique({ where: { userId }, select: { id: true, isVerified: true } })
  return pro ?? null
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PROFESSIONAL") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const pro = await getOwnProfessionalId(session.user.id)
  if (!pro) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 })

  const services = await prisma.service.findMany({
    where: { professionalId: pro.id },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(services)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PROFESSIONAL") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const pro = await getOwnProfessionalId(session.user.id)
  if (!pro) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 })
  // Solo profesionales verificados pueden publicar contenido.
  if (!pro.isVerified) return NextResponse.json({ error: "Cuenta en revisión" }, { status: 403 })

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

  const isDraft = status === "DRAFT"

  if (!title?.trim()) {
    return NextResponse.json({ error: "Título requerido" }, { status: 400 })
  }
  const priceNum = price !== undefined && price !== null && price !== "" ? Number(price) : null
  if (!isDraft && (!priceNum || priceNum <= 0)) {
    return NextResponse.json({ error: "Precio inválido" }, { status: 400 })
  }
  if (priceNum !== null && !Number.isFinite(priceNum)) {
    return NextResponse.json({ error: "Precio inválido" }, { status: 400 })
  }

  const galleryUrls: string[] = Array.isArray(gallery) ? gallery.filter(Boolean).slice(0, 3) : []
  const faqList: { question: string; answer: string }[] = Array.isArray(faqs)
    ? faqs.filter((f) => f?.question?.trim() && f?.answer?.trim())
    : []
  const packageList: { sessionCount: number; price: number; frequencyType: ServiceFrequency | null }[] = Array.isArray(sessionPackages)
    ? sessionPackages
        .filter((p) => Number(p?.sessionCount) > 0 && Number(p?.price) > 0)
        .map((p) => ({ sessionCount: Number(p.sessionCount), price: Number(p.price), frequencyType: p.frequencyType && p.frequencyType !== "UNICA" ? (p.frequencyType as ServiceFrequency) : null }))
    : []
  const durationMinNum = durationMin ? Number(durationMin) : null
  const availabilityList: { dayOfWeek: number; startTime: string; endTime: string }[] =
    Array.isArray(availability) && durationMinNum
      ? availability
          .filter((a) => typeof a?.dayOfWeek === "number" && a?.startTime)
          .map((a) => ({ dayOfWeek: a.dayOfWeek, startTime: a.startTime, endTime: addMinutes(a.startTime, durationMinNum) }))
      : []

  try {
    const service = await prisma.service.create({
      data: {
        professionalId: pro.id,
        title: title.trim(),
        description: description?.trim() || null,
        price: priceNum,
        status: isDraft ? "DRAFT" : undefined,
        durationMin: durationMinNum,
        frequencyType: frequencyType || null,
        frequencyCount: frequencyCount ? Number(frequencyCount) : null,
        frequencyPeriods: frequencyPeriods ? Number(frequencyPeriods) : null,
        modality: modality || null,
        categoryId: categoryId || null,
        imageUrl: imageUrl || null,
        videoUrl: videoUrl || null,
        extraSessionPrice: extraSessionPrice ? Number(extraSessionPrice) : null,
        gallery: { create: galleryUrls.map((imageUrl, order) => ({ imageUrl, order })) },
        faqs: { create: faqList.map((f, order) => ({ question: f.question.trim(), answer: f.answer.trim(), order })) },
        sessionPackages: { create: packageList },
        availability: { create: availabilityList },
      },
    })
    return NextResponse.json(service, { status: 201 })
  } catch (e) {
    console.error("POST /api/profesional/servicios", e)
    return NextResponse.json({ error: "Error al crear servicio" }, { status: 500 })
  }
}
