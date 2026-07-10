import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    include: {
      professional: { include: { user: { select: { username: true } } } },
      service: { include: { professional: { include: { user: { select: { username: true } } } } } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(favorites)
}
