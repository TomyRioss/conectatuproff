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

    const occurrences: { startAt: Date; endAt: Date }[] = []
    let curStart = start
    let curEnd = end
    do {
      occurrences.push({ startAt: curStart, endAt: curEnd })
      curStart = new Date(curStart.getTime() + 7 * 24 * 60 * 60 * 1000)
      curEnd = new Date(curEnd.getTime() + 7 * 24 * 60 * 60 * 1000)
    } while (until && curStart <= until)

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
