import { NextResponse } from "next/server"
import { Prisma } from "@/lib/generated/prisma/client"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function getOwnedPackage(userId: string, id: string) {
  const professional = await prisma.professional.findUnique({ where: { userId } })
  if (!professional) return { professional: null, paquete: null }
  const paquete = await prisma.servicePackage.findFirst({ where: { id, professionalId: professional.id } })
  return { professional, paquete }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PROFESSIONAL") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { id } = await params
  const { paquete } = await getOwnedPackage(session.user.id, id)
  if (!paquete) return NextResponse.json({ error: "Paquete no encontrado" }, { status: 404 })

  return NextResponse.json(paquete)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PROFESSIONAL") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { id } = await params
  const { paquete } = await getOwnedPackage(session.user.id, id)
  if (!paquete) return NextResponse.json({ error: "Paquete no encontrado" }, { status: 404 })

  const body = await req.json()
  const { name, description, sessionCount, price, originalPrice, validityDays, isActive } = body

  if (name !== undefined && !name?.trim()) {
    return NextResponse.json({ error: "Nombre requerido" }, { status: 400 })
  }
  if (sessionCount !== undefined && (!Number.isInteger(sessionCount) || sessionCount < 1)) {
    return NextResponse.json({ error: "Cantidad de sesiones invalida" }, { status: 400 })
  }
  if (price !== undefined && (typeof price !== "number" || price <= 0)) {
    return NextResponse.json({ error: "Precio invalido" }, { status: 400 })
  }
  if (originalPrice !== undefined && (typeof originalPrice !== "number" || originalPrice <= 0)) {
    return NextResponse.json({ error: "Precio original invalido" }, { status: 400 })
  }

  try {
    const data: Record<string, unknown> = {}
    if (name !== undefined) data.name = name.trim()
    if (description !== undefined) data.description = description?.trim() || null
    if (sessionCount !== undefined) data.sessionCount = sessionCount
    if (price !== undefined) data.price = price
    if (originalPrice !== undefined) data.originalPrice = originalPrice
    if (validityDays !== undefined) data.validityDays = validityDays || null
    if (isActive !== undefined) data.isActive = isActive

    const updated = await prisma.servicePackage.update({ where: { id }, data })
    return NextResponse.json(updated)
  } catch (e) {
    console.error("PATCH /api/profesional/paquetes/[id]", e)
    return NextResponse.json({ error: "Error al guardar" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PROFESSIONAL") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { id } = await params
  const { paquete } = await getOwnedPackage(session.user.id, id)
  if (!paquete) return NextResponse.json({ error: "Paquete no encontrado" }, { status: 404 })

  try {
    await prisma.servicePackage.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    // El paquete tiene compras asociadas (ClientPackage, FK restrictiva).
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
      return NextResponse.json(
        { error: "El paquete tiene compras asociadas. Desactivalo en lugar de eliminarlo." },
        { status: 409 }
      )
    }
    console.error("DELETE /api/profesional/paquetes/[id]", e)
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 })
  }
}
