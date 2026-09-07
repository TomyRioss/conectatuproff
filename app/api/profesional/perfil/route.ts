import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createPetitionIfNew } from "@/lib/subcategorias"

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PROFESSIONAL") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const body = await req.json().catch(() => null)
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
    }
    const { firstName, lastName, specialty, location, phone, avatarUrl, bio } = body as Record<string, unknown>

    if (firstName !== undefined && (!firstName?.toString().trim() || !lastName?.toString().trim())) {
      return NextResponse.json({ error: "Nombre y apellido requeridos" }, { status: 400 })
    }

    // El avatar debe ser un archivo subido por el propio usuario (no keys ajenas).
    const avatarPrefix = `profesionales/avatars/${session.user.id}/`
    if (avatarUrl !== undefined && typeof avatarUrl === "string" && avatarUrl !== "" && !avatarUrl.startsWith(avatarPrefix)) {
      return NextResponse.json({ error: "Avatar inválido" }, { status: 400 })
    }

    const firstNameStr = typeof firstName === "string" ? firstName.trim() : undefined
    const strOrNull = (v: unknown, max = 300) =>
      typeof v === "string" ? v.trim().slice(0, max) || null : undefined

    const data: Record<string, unknown> = {}
    if (firstNameStr !== undefined) {
      data.firstName = firstNameStr
      data.lastName = (lastName as string).trim()
    }
    if (specialty !== undefined) data.specialty = strOrNull(specialty)
    if (location !== undefined) data.location = strOrNull(location)
    if (phone !== undefined) data.phone = strOrNull(phone)
    if (avatarUrl !== undefined) data.avatarUrl = typeof avatarUrl === "string" && avatarUrl ? avatarUrl : null
    if (bio !== undefined) {
      const b = typeof bio === "string" ? bio.trim() : ""
      if (b.length > 600) {
        return NextResponse.json({ error: "La biografía no puede superar los 600 caracteres" }, { status: 400 })
      }
      data.bio = b || null
    }

    const pro = await prisma.professional.update({
      where: { userId: session.user.id },
      data,
    })

    // Si la profesión no está en el listado, se registra como petición.
    if (typeof data.specialty === "string" && data.specialty) {
      await createPetitionIfNew(session.user.id, data.specialty)
    }

    const userUpdate: Record<string, unknown> = {}
    if (firstNameStr !== undefined) userUpdate.name = `${firstNameStr} ${(lastName as string).trim()}`
    // No pisar users.image con el proxy /api/avatar: esa columna guarda la foto
    // externa (Google) y es el fallback cuando no hay avatarUrl.

    if (Object.keys(userUpdate).length > 0) {
      await prisma.user.update({ where: { id: session.user.id }, data: userUpdate })
    }

    return NextResponse.json(pro)
  } catch (e) {
    console.error("PATCH /api/profesional/perfil", e)
    return NextResponse.json({ error: "Error al guardar" }, { status: 500 })
  }
}
