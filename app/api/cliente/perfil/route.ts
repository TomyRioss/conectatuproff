import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.id || (session.user as { role?: string }).role !== "CLIENT") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const body = await req.json().catch(() => null)
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
    }
    const { firstName, lastName, avatarUrl, phone, dni, location } = body as Record<string, unknown>

    if (firstName !== undefined && (!firstName?.toString().trim() || !lastName?.toString().trim())) {
      return NextResponse.json({ error: "Nombre y apellido requeridos" }, { status: 400 })
    }

    // El avatar debe ser un archivo subido por el propio usuario.
    const avatarPrefix = `clientes/avatars/${session.user.id}/`
    if (avatarUrl !== undefined && typeof avatarUrl === "string" && avatarUrl !== "" && !avatarUrl.startsWith(avatarPrefix)) {
      return NextResponse.json({ error: "Avatar inválido" }, { status: 400 })
    }

    const dniStr = typeof dni === "string" ? dni.trim() : undefined
    if (dniStr !== undefined && dniStr !== "" && !/^\d{7,8}$/.test(dniStr)) {
      return NextResponse.json({ error: "DNI inválido" }, { status: 400 })
    }
    const strOrNull = (v: unknown) =>
      typeof v === "string" ? v.trim().slice(0, 300) || null : undefined
    const firstNameStr = typeof firstName === "string" ? firstName.trim() : undefined

    const data: Record<string, unknown> = {}
    if (firstNameStr !== undefined) {
      data.firstName = firstNameStr
      data.lastName = (lastName as string).trim()
    }
    if (avatarUrl !== undefined) data.avatarUrl = typeof avatarUrl === "string" && avatarUrl ? avatarUrl : null
    if (phone !== undefined) data.phone = strOrNull(phone)
    if (dni !== undefined) data.dni = dniStr ? parseInt(dniStr, 10) : null
    if (location !== undefined) data.location = strOrNull(location)

    const cliente = await prisma.client.update({
      where: { userId: session.user.id },
      data,
    })

    const userUpdate: Record<string, unknown> = {}
    if (firstNameStr !== undefined) userUpdate.name = `${firstNameStr} ${(lastName as string).trim()}`
    if (avatarUrl !== undefined)
      userUpdate.image =
        typeof avatarUrl === "string" && avatarUrl ? `/api/avatar?key=${encodeURIComponent(avatarUrl)}` : null

    if (Object.keys(userUpdate).length > 0) {
      await prisma.user.update({ where: { id: session.user.id }, data: userUpdate })
    }

    return NextResponse.json(cliente)
  } catch (e) {
    console.error("PATCH /api/cliente/perfil", e)
    return NextResponse.json({ error: "Error al guardar el perfil" }, { status: 500 })
  }
}
