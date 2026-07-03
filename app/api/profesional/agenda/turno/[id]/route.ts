import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const VALID_STATUSES = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"]

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PROFESSIONAL") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { id } = await params
  const { status } = await req.json()
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 })
  }

  try {
    const pro = await prisma.professional.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })
    if (!pro) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 })

    const appointment = await prisma.appointment.findUnique({ where: { id }, select: { professionalId: true } })
    if (!appointment || appointment.professionalId !== pro.id) {
      return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 })
    }

    const updated = await prisma.appointment.update({ where: { id }, data: { status } })
    return NextResponse.json(updated)
  } catch (e) {
    console.error("PATCH /api/profesional/agenda/turno/[id]", e)
    return NextResponse.json({ error: "Error al actualizar turno" }, { status: 500 })
  }
}
