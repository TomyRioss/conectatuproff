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

  const educations = await prisma.education.findMany({
    where: { professionalId },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(educations)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const professionalId = await getOwnProfessionalId(session.user.id)
  if (!professionalId) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 })

  const body = await req.json()
  const { institution, degree, fieldOfStudy, location, year, graduated } = body

  if (!institution?.trim()) return NextResponse.json({ error: "Institución requerida" }, { status: 400 })
  if (!degree?.trim()) return NextResponse.json({ error: "Título requerido" }, { status: 400 })

  // Año válido (evita overflow de Int con valores absurdos).
  const yearNum = year ? Number(year) : null
  const currentYear = new Date().getFullYear()
  if (yearNum !== null && (!Number.isInteger(yearNum) || yearNum < 1900 || yearNum > currentYear + 1)) {
    return NextResponse.json({ error: "Año inválido" }, { status: 400 })
  }

  try {
    const education = await prisma.education.create({
      data: {
        professionalId,
        institution: institution.trim(),
        degree: degree.trim(),
        fieldOfStudy: fieldOfStudy?.trim() || null,
        location: location?.trim() || null,
        year: yearNum,
        graduated: graduated !== undefined ? Boolean(graduated) : true,
      },
    })
    return NextResponse.json(education, { status: 201 })
  } catch (e) {
    console.error("POST /api/profesional/educacion", e)
    return NextResponse.json({ error: "Error al crear educación" }, { status: 500 })
  }
}
