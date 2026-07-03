import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PROFESSIONAL") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const professional = await prisma.professional.findUnique({ where: { userId: session.user.id } })
  if (!professional) {
    return NextResponse.json({ error: "Perfil profesional no encontrado" }, { status: 404 })
  }

  const paquetes = await prisma.servicePackage.findMany({
    where: { professionalId: professional.id },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(paquetes)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PROFESSIONAL") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const professional = await prisma.professional.findUnique({ where: { userId: session.user.id } })
  if (!professional) {
    return NextResponse.json({ error: "Perfil profesional no encontrado" }, { status: 404 })
  }

  const body = await req.json()
  const { name, description, sessionCount, price, originalPrice, validityDays } = body

  if (!name?.trim()) {
    return NextResponse.json({ error: "Nombre requerido" }, { status: 400 })
  }
  if (!Number.isInteger(sessionCount) || sessionCount < 1) {
    return NextResponse.json({ error: "Cantidad de sesiones invalida" }, { status: 400 })
  }
  if (typeof price !== "number" || price <= 0 || typeof originalPrice !== "number" || originalPrice <= 0) {
    return NextResponse.json({ error: "Precios invalidos" }, { status: 400 })
  }

  try {
    const paquete = await prisma.servicePackage.create({
      data: {
        professionalId: professional.id,
        name: name.trim(),
        description: description?.trim() || null,
        sessionCount,
        price,
        originalPrice,
        validityDays: validityDays || null,
      },
    })
    return NextResponse.json(paquete, { status: 201 })
  } catch (e) {
    console.error("POST /api/profesional/paquetes", e)
    return NextResponse.json({ error: "Error al crear paquete" }, { status: 500 })
  }
}
