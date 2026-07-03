import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PROFESSIONAL") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const body = await req.json()
  const { firstName, lastName, specialty, location, phone, avatarUrl, bio } = body

  if (firstName !== undefined && (!firstName?.trim() || !lastName?.trim())) {
    return NextResponse.json({ error: "Nombre y apellido requeridos" }, { status: 400 })
  }

  try {
    const data: Record<string, unknown> = {}
    if (firstName !== undefined) { data.firstName = firstName.trim(); data.lastName = lastName.trim() }
    if (specialty !== undefined) data.specialty = specialty?.trim() || null
    if (location !== undefined) data.location = location?.trim() || null
    if (phone !== undefined) data.phone = phone?.trim() || null
    if (avatarUrl !== undefined) data.avatarUrl = avatarUrl
    if (bio !== undefined) data.bio = bio?.trim() || null

    const pro = await prisma.professional.update({
      where: { userId: session.user.id },
      data,
    })

    const userUpdate: Record<string, unknown> = {}
    if (firstName !== undefined) userUpdate.name = `${firstName.trim()} ${lastName.trim()}`
    if (avatarUrl !== undefined) userUpdate.image = avatarUrl ? `/api/avatar?key=${encodeURIComponent(avatarUrl)}` : null

    if (Object.keys(userUpdate).length > 0) {
      await prisma.user.update({ where: { id: session.user.id }, data: userUpdate })
    }

    return NextResponse.json(pro)
  } catch (e) {
    console.error("PATCH /api/profesional/perfil", e)
    return NextResponse.json({ error: "Error al guardar" }, { status: 500 })
  }
}
