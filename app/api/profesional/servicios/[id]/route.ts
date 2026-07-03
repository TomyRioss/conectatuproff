import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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
  const { title, description, price, durationMin, modality, categoryId, imageUrl, isActive } = body

  if (title !== undefined && !title?.trim()) {
    return NextResponse.json({ error: "Título requerido" }, { status: 400 })
  }
  if (price !== undefined && (!Number.isFinite(Number(price)) || Number(price) <= 0)) {
    return NextResponse.json({ error: "Precio inválido" }, { status: 400 })
  }

  try {
    const data: Record<string, unknown> = {}
    if (title !== undefined) data.title = title.trim()
    if (description !== undefined) data.description = description?.trim() || null
    if (price !== undefined) data.price = Number(price)
    if (durationMin !== undefined) data.durationMin = durationMin ? Number(durationMin) : null
    if (modality !== undefined) data.modality = modality || null
    if (categoryId !== undefined) data.categoryId = categoryId || null
    if (imageUrl !== undefined) data.imageUrl = imageUrl || null
    if (isActive !== undefined) data.isActive = Boolean(isActive)

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
