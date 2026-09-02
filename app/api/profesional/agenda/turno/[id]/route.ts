import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const VALID_STATUSES = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"]

// Máquina de estados: transiciones permitidas desde el estado actual.
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["COMPLETED", "NO_SHOW", "CANCELLED"],
  CANCELLED: [],
  COMPLETED: [],
  NO_SHOW: [],
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PROFESSIONAL") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json().catch(() => null)
  const status = body?.status
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 })
  }

  try {
    const pro = await prisma.professional.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })
    if (!pro) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 })

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      select: { professionalId: true, status: true },
    })
    if (!appointment || appointment.professionalId !== pro.id) {
      return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 })
    }

    if (appointment.status === status) {
      return NextResponse.json({ ok: true })
    }
    if (!ALLOWED_TRANSITIONS[appointment.status].includes(status)) {
      return NextResponse.json(
        { error: `No se puede pasar un turno de ${appointment.status} a ${status}` },
        { status: 409 }
      )
    }

    const updated = await prisma.appointment.update({ where: { id }, data: { status } })

    // Notificar al cliente para que quede enterado del cambio.
    // clientId null = cuenta eliminada: no hay a quién notificar.
    const clientUser = updated.clientId
      ? await prisma.client.findUnique({
          where: { id: updated.clientId },
          select: { userId: true },
        })
      : null
    if (clientUser) {
      const labels: Record<string, string> = {
        CONFIRMED: "confirmado",
        CANCELLED: "cancelado",
        COMPLETED: "completado",
        NO_SHOW: "marcado como no asistido",
      }
      await prisma.notification
        .create({
          data: {
            userId: clientUser.userId,
            audience: "CLIENT",
            type: "APPOINTMENT_STATUS",
            title: "Tu turno fue actualizado",
            body: `El profesional ${labels[status] ?? "actualizó"} tu turno.`,
            link: "/cliente/turnos",
          },
        })
        .catch((e) => console.error("[turno PATCH] notificación falló:", e))
    }

    return NextResponse.json(updated)
  } catch (e) {
    console.error("PATCH /api/profesional/agenda/turno/[id]", e)
    return NextResponse.json({ error: "Error al actualizar turno" }, { status: 500 })
  }
}
