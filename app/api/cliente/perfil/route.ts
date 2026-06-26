import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.id || (session.user as { role?: string }).role !== "CLIENT") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const body = await req.json()
  const { firstName, lastName, avatarUrl, phone, dni, location } = body

  if (firstName !== undefined && (!firstName?.trim() || !lastName?.trim())) {
    return NextResponse.json({ error: "Nombre y apellido requeridos" }, { status: 400 })
  }

  const data: Record<string, unknown> = {}
  if (firstName !== undefined) { data.firstName = firstName.trim(); data.lastName = lastName.trim() }
  if (avatarUrl !== undefined) data.avatarUrl = avatarUrl
  if (phone !== undefined) data.phone = phone?.trim() || null
  if (dni !== undefined) data.dni = dni ? parseInt(dni) : null
  if (location !== undefined) data.location = location?.trim() || null

  const cliente = await prisma.client.update({
    where: { userId: session.user.id },
    data,
  })

  const userUpdate: Record<string, unknown> = {}
  if (firstName !== undefined) userUpdate.name = `${firstName.trim()} ${lastName.trim()}`
  if (avatarUrl !== undefined) userUpdate.image = avatarUrl ? `/api/avatar?key=${encodeURIComponent(avatarUrl)}` : null

  if (Object.keys(userUpdate).length > 0) {
    await prisma.user.update({ where: { id: session.user.id }, data: userUpdate })
  }

  return NextResponse.json(cliente)
}
