import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Public-safe fields only — the Professional model contains secrets
// (google tokens, DNI photos, phone) that must never leave the server.
const professionalPublicSelect = {
  id: true,
  userId: true,
  firstName: true,
  lastName: true,
  avatarUrl: true,
  specialty: true,
  location: true,
  isVerified: true,
  isPro: true,
  rating: true,
  user: { select: { username: true } },
} as const

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      professionalId: true,
      serviceId: true,
      createdAt: true,
      professional: { select: professionalPublicSelect },
      service: {
        select: {
          id: true,
          title: true,
          description: true,
          price: true,
          durationMin: true,
          modality: true,
          status: true,
          professional: { select: professionalPublicSelect },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(favorites)
}
