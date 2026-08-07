import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const AVATAR_COLORS = ["#1EC97E", "#6C5CE7", "#1A1A2E"];

export async function GET(req: NextRequest) {
  const city = req.nextUrl.searchParams.get("city")?.trim();
  if (!city) return NextResponse.json([]);

  const pros = await prisma.professional.findMany({
    where: {
      isActive: true,
      user: { username: { not: null } },
      location: { contains: city, mode: "insensitive" },
    },
    orderBy: { rating: "desc" },
    take: 6,
    include: {
      user: { select: { username: true, image: true } },
      _count: { select: { reviews: true } },
      services: { where: { status: "ACTIVE" }, select: { price: true }, orderBy: { price: "asc" }, take: 1 },
    },
  });

  const data = pros.map((pro, i) => ({
    slug: pro.user.username as string,
    name: `${pro.firstName} ${pro.lastName}`,
    specialty: pro.specialty ?? "",
    zone: pro.location ?? "",
    rating: pro.rating,
    reviews: pro._count.reviews,
    priceFrom: pro.services[0] ? Number(pro.services[0].price) : null,
    premium: false,
    verified: pro.isVerified,
    initials: `${pro.firstName[0] ?? ""}${pro.lastName[0] ?? ""}`.toUpperCase(),
    color: AVATAR_COLORS[i % AVATAR_COLORS.length],
    avatarSrc: pro.avatarUrl ? `/api/avatar?key=${encodeURIComponent(pro.avatarUrl)}` : pro.user.image,
  }));

  return NextResponse.json(data);
}
