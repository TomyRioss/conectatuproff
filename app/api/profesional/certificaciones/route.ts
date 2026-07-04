import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function getOwnProfessionalId(userId: string) {
  const pro = await prisma.professional.findUnique({ where: { userId }, select: { id: true } })
  return pro?.id ?? null
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const professionalId = await getOwnProfessionalId(session.user.id)
  if (!professionalId) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 })

  const certifications = await prisma.certification.findMany({
    where: { professionalId },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(certifications)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const professionalId = await getOwnProfessionalId(session.user.id)
  if (!professionalId) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 })

  const body = await req.json()
  const { name, year } = body

  if (!name?.trim()) return NextResponse.json({ error: "Nombre requerido" }, { status: 400 })

  try {
    const certification = await prisma.certification.create({
      data: {
        professionalId,
        name: name.trim(),
        year: year ? Number(year) : null,
      },
    })
    return NextResponse.json(certification, { status: 201 })
  } catch (e) {
    console.error("POST /api/profesional/certificaciones", e)
    return NextResponse.json({ error: "Error al crear certificación" }, { status: 500 })
  }
}
