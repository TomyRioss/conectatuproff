import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const MAX_IMAGES = 5

async function getOwnProfessionalId(userId: string) {
  const pro = await prisma.professional.findUnique({ where: { userId }, select: { id: true } })
  return pro?.id ?? null
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const professionalId = await getOwnProfessionalId(session.user.id)
  if (!professionalId) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 })

  const items = await prisma.portfolioItem.findMany({
    where: { professionalId },
    include: {
      images: { orderBy: { order: "asc" } },
      categories: { include: { category: true } },
    },
    orderBy: { order: "asc" },
  })
  return NextResponse.json(
    items.map((item) => ({ ...item, categories: item.categories.map((c) => c.category) }))
  )
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PROFESSIONAL") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const professionalId = await getOwnProfessionalId(session.user.id)
  if (!professionalId) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 })

  const body = await req.json()
  const { title, description, costMin, costMax, durationMin, durationMax, tags, imageKeys, startedAt, categoryIds } = body

  const keys: string[] = Array.isArray(imageKeys) ? imageKeys.filter(Boolean) : []
  if (keys.length === 0) return NextResponse.json({ error: "Al menos una imagen requerida" }, { status: 400 })
  if (keys.length > MAX_IMAGES) return NextResponse.json({ error: `Máximo ${MAX_IMAGES} imágenes` }, { status: 400 })

  const catIds: string[] = Array.isArray(categoryIds) ? categoryIds.filter(Boolean).slice(0, 4) : []

  try {
    const item = await prisma.portfolioItem.create({
      data: {
        professionalId,
        title: title?.trim() || null,
        description: description?.trim() || null,
        imageUrl: keys[0],
        costMin: costMin !== undefined && costMin !== "" ? Number(costMin) : null,
        costMax: costMax !== undefined && costMax !== "" ? Number(costMax) : null,
        durationMin: durationMin !== undefined && durationMin !== "" ? Number(durationMin) : null,
        durationMax: durationMax !== undefined && durationMax !== "" ? Number(durationMax) : null,
        tags: Array.isArray(tags) ? tags.filter(Boolean) : [],
        startedAt: startedAt ? new Date(startedAt) : null,
        images: {
          create: keys.map((imageUrl, order) => ({ imageUrl, order })),
        },
        categories: {
          create: catIds.map((categoryId) => ({ categoryId })),
        },
      },
      include: { images: { orderBy: { order: "asc" } }, categories: { include: { category: true } } },
    })
    return NextResponse.json({ ...item, categories: item.categories.map((c) => c.category) }, { status: 201 })
  } catch (e) {
    console.error("POST /api/profesional/portfolio", e)
    return NextResponse.json({ error: "Error al crear proyecto" }, { status: 500 })
  }
}
