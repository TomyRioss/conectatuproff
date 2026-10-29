import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { syncProfessionalAppointmentsToGoogleCalendar } from "@/lib/googleCalendar"

export async function POST() {
  const session = await auth()
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PROFESSIONAL") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const pro = await prisma.professional.findUnique({
    where: { userId: session.user.id },
    select: { id: true, googleConnected: true },
  })
  if (!pro) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 })
  if (!pro.googleConnected) {
    return NextResponse.json({ error: "Google Calendar no está conectado" }, { status: 409 })
  }

  try {
    const result = await syncProfessionalAppointmentsToGoogleCalendar(pro.id)
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    console.error("POST /api/profesional/google-calendar/sync", error)
    return NextResponse.json({ error: "No se pudieron actualizar los turnos en Google Calendar" }, { status: 500 })
  }
}
