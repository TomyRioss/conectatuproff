import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { deleteFile } from "@/lib/storage"

const MAX_IMAGES = 5

async function getOwnPortfolioItem(userId: string, itemId: string) {
  const item = await prisma.portfolioItem.findUnique({
    where: { id: itemId },
    include: { professional: { select: { userId: true } }, images: true },
  })
  if (!item || item.professional.userId !== userId) return null
  return item
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PROFESSIONAL") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { id } = await params
  const existing = await getOwnPortfolioItem(session.user.id, id)
  if (!existing) return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 })

  const body = await req.json()
  const { title, description, costMin, costMax, durationMin, durationMax, tags, imageKeys, startedAt, categoryIds } = body

  const data: Record<string, unknown> = {}
  if (title !== undefined) data.title = title?.trim() || null
  if (description !== undefined) data.description = description?.trim() || null
  if (costMin !== undefined) data.costMin = costMin !== "" ? Number(costMin) : null
  if (costMax !== undefined) data.costMax = costMax !== "" ? Number(costMax) : null
  if (durationMin !== undefined) data.durationMin = durationMin !== "" ? Number(durationMin) : null
  if (durationMax !== undefined) data.durationMax = durationMax !== "" ? Number(durationMax) : null
  if (tags !== undefined) data.tags = Array.isArray(tags) ? tags.filter(Boolean) : []
  if (startedAt !== undefined) data.startedAt = startedAt ? new Date(startedAt) : null

  const catIds: string[] | undefined = Array.isArray(categoryIds) ? categoryIds.filter(Boolean).slice(0, 4) : undefined

  let keys: string[] | undefined
  if (imageKeys !== undefined) {
    keys = Array.isArray(imageKeys) ? imageKeys.filter(Boolean) : []
    if (keys.length === 0) return NextResponse.json({ error: "Al menos una imagen requerida" }, { status: 400 })
    if (keys.length > MAX_IMAGES) return NextResponse.json({ error: `Máximo ${MAX_IMAGES} imágenes` }, { status: 400 })
    data.imageUrl = keys[0]
  }

  try {
    const item = await prisma.$transaction(async (tx) => {
      if (keys) {
        const removed = existing.images.filter((img) => !keys!.includes(img.imageUrl))
        await tx.portfolioItemImage.deleteMany({ where: { portfolioItemId: id } })
        await tx.portfolioItemImage.createMany({
          data: keys!.map((imageUrl, order) => ({ portfolioItemId: id, imageUrl, order })),
        })
        for (const img of removed) {
          if (img.imageUrl !== existing.imageUrl || !keys!.includes(img.imageUrl)) {
            await deleteFile(img.imageUrl).catch((e) => console.error("deleteFile", e))
          }
        }
      }
      if (catIds) {
        await tx.portfolioItemCategory.deleteMany({ where: { portfolioItemId: id } })
        await tx.portfolioItemCategory.createMany({
          data: catIds.map((categoryId) => ({ portfolioItemId: id, categoryId })),
        })
      }
      return tx.portfolioItem.update({
        where: { id },
        data,
        include: { images: { orderBy: { order: "asc" } }, categories: { include: { category: true } } },
      })
    })
    return NextResponse.json({ ...item, categories: item.categories.map((c) => c.category) })
  } catch (e) {
    console.error("PATCH /api/profesional/portfolio/[id]", e)
    return NextResponse.json({ error: "Error al guardar" }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PROFESSIONAL") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { id } = await params
  const existing = await getOwnPortfolioItem(session.user.id, id)
  if (!existing) return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 })

  try {
    await prisma.portfolioItem.delete({ where: { id } })
    await Promise.all(existing.images.map((img) => deleteFile(img.imageUrl).catch((e) => console.error("deleteFile", e))))
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("DELETE /api/profesional/portfolio/[id]", e)
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 })
  }
}
