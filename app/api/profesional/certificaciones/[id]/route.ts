import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function getOwnCertification(userId: string, certificationId: string) {
  const certification = await prisma.certification.findUnique({
    where: { id: certificationId },
    include: { professional: { select: { userId: true } } },
  })
  if (!certification || certification.professional.userId !== userId) return null
  return certification
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params
  const existing = await getOwnCertification(session.user.id, id)
  if (!existing) return NextResponse.json({ error: "Certificación no encontrada" }, { status: 404 })

  const body = await req.json()
  const { name, year } = body

  if (name !== undefined && !name?.trim()) {
    return NextResponse.json({ error: "Nombre requerido" }, { status: 400 })
  }

  try {
    const data: Record<string, unknown> = {}
    if (name !== undefined) data.name = name.trim()
    if (year !== undefined) data.year = year ? Number(year) : null

    const certification = await prisma.certification.update({ where: { id }, data })
    return NextResponse.json(certification)
  } catch (e) {
    console.error("PATCH /api/profesional/certificaciones/[id]", e)
    return NextResponse.json({ error: "Error al guardar" }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params
  const existing = await getOwnCertification(session.user.id, id)
  if (!existing) return NextResponse.json({ error: "Certificación no encontrada" }, { status: 404 })

  try {
    await prisma.certification.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("DELETE /api/profesional/certificaciones/[id]", e)
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 })
  }
}
