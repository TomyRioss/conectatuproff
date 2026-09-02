import { prisma } from "@/lib/prisma"
import type { ProfCardData } from "@/components/home/ProfCard"

const AVATAR_COLORS = ["#1EC97E", "#6C5CE7", "#1A1A2E"]

function initialsFor(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase()
}

export async function getFeaturedPros(take = 6): Promise<ProfCardData[]> {
  const pros = await prisma.professional.findMany({
    where: { isActive: true, isVerified: true, user: { isActive: true, username: { not: null } } },
    orderBy: [{ isPro: "desc" }, { rating: "desc" }],
    take,
    include: {
      user: { select: { username: true, image: true } },
      _count: { select: { reviews: true } },
      services: {
        where: { status: "ACTIVE" },
        select: { price: true },
        orderBy: { price: "asc" },
        take: 1,
      },
    },
  })

  return pros.map((pro, i) => ({
    slug: pro.user.username as string,
    name: `${pro.firstName} ${pro.lastName}`,
    specialty: pro.specialty ?? "",
    zone: pro.location ?? "",
    rating: pro.rating,
    reviews: pro._count.reviews,
    priceFrom: pro.services[0] ? Number(pro.services[0].price) : null,
    premium: pro.isPro,
    verified: pro.isVerified,
    initials: initialsFor(pro.firstName, pro.lastName),
    color: AVATAR_COLORS[i % AVATAR_COLORS.length],
    avatarSrc: pro.avatarUrl
      ? `/api/avatar?key=${encodeURIComponent(pro.avatarUrl)}`
      : pro.user.image,
  }))
}
