import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Listado completo de citas del profesional (activas + historial), para el
// panel "Mis citas agendadas" de la agenda. El calendario mensual ya cubre el
// mes visible; este endpoint devuelve todo el historial sin límite de mes.
export async function GET() {
  const session = await auth()
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PROFESSIONAL") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const pro = await prisma.professional.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })
    if (!pro) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 })

    const appointments = await prisma.appointment.findMany({
      where: { professionalId: pro.id },
      orderBy: { startAt: "desc" },
      select: {
        id: true,
        startAt: true,
        durationMin: true,
        status: true,
        client: { select: { firstName: true, lastName: true } },
        service: { select: { title: true } },
      },
    })

    const citas = appointments.map((a) => ({
      id: a.id,
      startAt: a.startAt.toISOString(),
      durationMin: a.durationMin,
      status: a.status,
      serviceName: a.service?.title ?? null,
      // client null = cuenta del cliente eliminada; el turno queda en historial.
      clientName: a.client ? `${a.client.firstName} ${a.client.lastName}` : "Usuario no encontrado",
    }))

    return NextResponse.json({ citas })
  } catch (e) {
    console.error("GET /api/profesional/agenda/citas", e)
    return NextResponse.json({ error: "Error al cargar citas" }, { status: 500 })
  }
}
