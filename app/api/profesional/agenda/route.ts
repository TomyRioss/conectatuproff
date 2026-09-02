import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { arDayStart } from "@/lib/time"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PROFESSIONAL") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const month = searchParams.get("month") // "YYYY-MM"
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: "Parámetro month inválido" }, { status: 400 })
  }

  try {
    const pro = await prisma.professional.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })
    if (!pro) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 })

    const [year, monthNum] = month.split("-").map(Number)
    // Límites de mes en hora de pared argentina (UTC-3), no TZ del server.
    const daysInMonth = new Date(Date.UTC(year, monthNum, 0)).getUTCDate()
    const start = arDayStart(`${month}-01`)
    const end = new Date(start.getTime() + daysInMonth * 24 * 3600000)

    const [appointments, blockedSlots] = await Promise.all([
      prisma.appointment.findMany({
        where: { professionalId: pro.id, startAt: { gte: start, lt: end } },
        select: {
          id: true,
          startAt: true,
          durationMin: true,
          status: true,
          notes: true,
          client: { select: { firstName: true, lastName: true } },
          service: { select: { title: true } },
        },
        orderBy: { startAt: "asc" },
      }),
      prisma.blockedSlot.findMany({
        where: { professionalId: pro.id, startAt: { lt: end }, endAt: { gt: start } },
        orderBy: { startAt: "asc" },
      }),
    ])

    // client null = cuenta del cliente eliminada; el turno sigue en la agenda.
    const normalized = appointments.map((a) => ({
      ...a,
      client: a.client ?? { firstName: "Usuario no encontrado", lastName: "" },
    }))

    return NextResponse.json({ appointments: normalized, blockedSlots })
  } catch (e) {
    console.error("GET /api/profesional/agenda", e)
    return NextResponse.json({ error: "Error al cargar agenda" }, { status: 500 })
  }
}
