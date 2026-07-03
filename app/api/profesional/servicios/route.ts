import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function getOwnProfessionalId(userId: string) {
  const pro = await prisma.professional.findUnique({ where: { userId }, select: { id: true } })
  return pro?.id ?? null
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PROFESSIONAL") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const professionalId = await getOwnProfessionalId(session.user.id)
  if (!professionalId) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 })

  const services = await prisma.service.findMany({
    where: { professionalId },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(services)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PROFESSIONAL") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const professionalId = await getOwnProfessionalId(session.user.id)
  if (!professionalId) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 })

  const body = await req.json()
  const { title, description, price, durationMin, modality, categoryId, imageUrl } = body

  if (!title?.trim()) {
    return NextResponse.json({ error: "Título requerido" }, { status: 400 })
  }
  const priceNum = Number(price)
  if (!Number.isFinite(priceNum) || priceNum <= 0) {
    return NextResponse.json({ error: "Precio inválido" }, { status: 400 })
  }

  try {
    const service = await prisma.service.create({
      data: {
        professionalId,
        title: title.trim(),
        description: description?.trim() || null,
        price: priceNum,
        durationMin: durationMin ? Number(durationMin) : null,
        modality: modality || null,
        categoryId: categoryId || null,
        imageUrl: imageUrl || null,
      },
    })
    return NextResponse.json(service, { status: 201 })
  } catch (e) {
    console.error("POST /api/profesional/servicios", e)
    return NextResponse.json({ error: "Error al crear servicio" }, { status: 500 })
  }
}
