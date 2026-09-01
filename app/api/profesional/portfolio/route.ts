import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const MAX_IMAGES = 5

async function getOwnProfessionalId(userId: string) {
  const pro = await prisma.professional.findUnique({ where: { userId }, select: { id: true, isVerified: true } })
  return pro ?? null
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const pro = await getOwnProfessionalId(session.user.id)
  if (!pro) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 })

  const items = await prisma.portfolioItem.findMany({
    where: { professionalId: pro.id },
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

  const pro = await getOwnProfessionalId(session.user.id)
  if (!pro) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 })
  // Solo profesionales verificados pueden publicar contenido.
  if (!pro.isVerified) return NextResponse.json({ error: "Cuenta en revisión" }, { status: 403 })

  const body = await req.json().catch(() => null)
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
  }
  const { title, description, costMin, costMax, durationMin, durationMax, tags, imageKeys, startedAt, categoryIds } =
    body as Record<string, unknown>

  const keys: string[] = Array.isArray(imageKeys) ? (imageKeys as unknown[]).filter((k): k is string => !!k) : []
  if (keys.length === 0) return NextResponse.json({ error: "Al menos una imagen requerida" }, { status: 400 })
  if (keys.length > MAX_IMAGES) return NextResponse.json({ error: `Máximo ${MAX_IMAGES} imágenes` }, { status: 400 })

  const catIds: string[] = Array.isArray(categoryIds)
    ? (categoryIds as unknown[]).filter((c): c is string => typeof c === "string" && !!c).slice(0, 4)
    : []

  // Rangos coherentes y números finitos.
  const numOrNull = (v: unknown) =>
    v !== undefined && v !== "" && v !== null && Number.isFinite(Number(v)) ? Number(v) : null
  const cMin = numOrNull(costMin)
  const cMax = numOrNull(costMax)
  const dMin = numOrNull(durationMin)
  const dMax = numOrNull(durationMax)
  if ((cMin !== null && cMin <= 0) || (cMax !== null && cMax <= 0)) {
    return NextResponse.json({ error: "Costos inválidos" }, { status: 400 })
  }
  if (cMin !== null && cMax !== null && cMin > cMax) {
    return NextResponse.json({ error: "El costo mínimo no puede superar el máximo" }, { status: 400 })
  }
  if ((dMin !== null && dMin <= 0) || (dMax !== null && dMax <= 0)) {
    return NextResponse.json({ error: "Duraciones inválidas" }, { status: 400 })
  }
  if (dMin !== null && dMax !== null && dMin > dMax) {
    return NextResponse.json({ error: "La duración mínima no puede superar la máxima" }, { status: 400 })
  }

  try {
    const item = await prisma.portfolioItem.create({
      data: {
        professionalId: pro.id,
        title: typeof title === "string" ? title.trim() || null : null,
        description: typeof description === "string" ? description.trim() || null : null,
        imageUrl: keys[0],
        costMin: cMin,
        costMax: cMax,
        durationMin: dMin,
        durationMax: dMax,
        tags: Array.isArray(tags) ? (tags as unknown[]).filter((t): t is string => !!t) : [],
        startedAt:
          typeof startedAt === "string" && !Number.isNaN(new Date(startedAt).getTime()) ? new Date(startedAt) : null,
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
