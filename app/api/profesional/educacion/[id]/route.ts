import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function getOwnEducation(userId: string, educationId: string) {
  const education = await prisma.education.findUnique({
    where: { id: educationId },
    include: { professional: { select: { userId: true } } },
  })
  if (!education || education.professional.userId !== userId) return null
  return education
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params
  const existing = await getOwnEducation(session.user.id, id)
  if (!existing) return NextResponse.json({ error: "Educación no encontrada" }, { status: 404 })

  const body = await req.json()
  const { institution, degree, fieldOfStudy, location, year, graduated } = body

  if (institution !== undefined && !institution?.trim()) {
    return NextResponse.json({ error: "Institución requerida" }, { status: 400 })
  }
  if (degree !== undefined && !degree?.trim()) {
    return NextResponse.json({ error: "Título requerido" }, { status: 400 })
  }

  try {
    const data: Record<string, unknown> = {}
    if (institution !== undefined) data.institution = institution.trim()
    if (degree !== undefined) data.degree = degree.trim()
    if (fieldOfStudy !== undefined) data.fieldOfStudy = fieldOfStudy?.trim() || null
    if (location !== undefined) data.location = location?.trim() || null
    if (year !== undefined) data.year = year ? Number(year) : null
    if (graduated !== undefined) data.graduated = Boolean(graduated)

    const education = await prisma.education.update({ where: { id }, data })
    return NextResponse.json(education)
  } catch (e) {
    console.error("PATCH /api/profesional/educacion/[id]", e)
    return NextResponse.json({ error: "Error al guardar" }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params
  const existing = await getOwnEducation(session.user.id, id)
  if (!existing) return NextResponse.json({ error: "Educación no encontrada" }, { status: 404 })

  try {
    await prisma.education.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("DELETE /api/profesional/educacion/[id]", e)
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 })
  }
}
