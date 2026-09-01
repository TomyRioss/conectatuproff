import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const VALID_REASONS = ["VACATION", "ABSENCE", "PERSONAL", "OTHER"]

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PROFESSIONAL") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { startAt, endAt, reason, note, repeatUntil } = await req.json()
  if (!startAt || !endAt || !VALID_REASONS.includes(reason)) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
  }
  const start = new Date(startAt)
  const end = new Date(endAt)
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
    return NextResponse.json({ error: "Rango horario inválido" }, { status: 400 })
  }

  let until: Date | null = null
  if (repeatUntil) {
    until = new Date(`${repeatUntil}T23:59:59`)
    if (isNaN(until.getTime()) || until < start) {
      return NextResponse.json({ error: "Fecha de repetición inválida" }, { status: 400 })
    }
  }

  try {
    const pro = await prisma.professional.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })
    if (!pro) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 })

    // Cap de ocurrencias para que una recurrencia lejana no genere miles de filas.
    const MAX_OCCURRENCES = 52
    const occurrences: { startAt: Date; endAt: Date }[] = []
    let curStart = start
    let curEnd = end
    do {
      occurrences.push({ startAt: new Date(curStart), endAt: new Date(curEnd) })
      if (occurrences.length >= MAX_OCCURRENCES) {
        return NextResponse.json(
          { error: `La repetición semanal permite un máximo de ${MAX_OCCURRENCES} semanas` },
          { status: 400 }
        )
      }
      curStart = new Date(curStart.getTime() + 7 * 24 * 60 * 60 * 1000)
      curEnd = new Date(curEnd.getTime() + 7 * 24 * 60 * 60 * 1000)
    } while (until && curStart <= until)

    // No permitir bloquear encima de turnos activos: el pro debe cancelarlos antes.
    for (const o of occurrences) {
      const candidates = await prisma.appointment.findMany({
        where: {
          professionalId: pro.id,
          status: { in: ["PENDING", "CONFIRMED"] },
          // Ventana ancha: turnos que empiezan hasta endAt y hasta 24h antes
          // (la duración máxima real se filtra en memoria).
          startAt: { gte: new Date(o.startAt.getTime() - 24 * 3600000), lt: o.endAt },
        },
        select: { id: true, startAt: true, durationMin: true },
      })
      const active = candidates.find(
        (a) => a.startAt < o.endAt && new Date(a.startAt.getTime() + (a.durationMin ?? 60) * 60000) > o.startAt
      )
      if (active) {
        return NextResponse.json(
          {
            error: `Tenés un turno activo el ${active.startAt.toLocaleDateString("es-AR", { day: "numeric", month: "short", timeZone: "America/Argentina/Buenos_Aires" })} en ese rango. Cancelalo antes de bloquear.`,
          },
          { status: 409 }
        )
      }
    }

    await prisma.blockedSlot.createMany({
      data: occurrences.map((o) => ({
        professionalId: pro.id,
        startAt: o.startAt,
        endAt: o.endAt,
        reason,
        note: note?.trim() || null,
      })),
    })
    return NextResponse.json({ ok: true, count: occurrences.length })
  } catch (e) {
    console.error("POST /api/profesional/agenda/bloqueo", e)
    return NextResponse.json({ error: "Error al crear bloqueo" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PROFESSIONAL") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 })

  try {
    const pro = await prisma.professional.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })
    if (!pro) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 })

    const slot = await prisma.blockedSlot.findUnique({ where: { id }, select: { professionalId: true } })
    if (!slot || slot.professionalId !== pro.id) {
      return NextResponse.json({ error: "Bloqueo no encontrado" }, { status: 404 })
    }

    await prisma.blockedSlot.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("DELETE /api/profesional/agenda/bloqueo", e)
    return NextResponse.json({ error: "Error al eliminar bloqueo" }, { status: 500 })
  }
}
