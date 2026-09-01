import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/owner-auth";
import { PRO_PLAN_PRICE } from "@/lib/mercadopago";

export async function GET() {
  const { error } = await requireOwner();
  if (error) return error;

  try {
    const [total, pro, avgRating, professionals] = await prisma.$transaction([
      prisma.professional.count(),
      prisma.professional.count({ where: { isPro: true } }),
      prisma.professional.aggregate({ _avg: { rating: true } }),
      prisma.professional.findMany({
        select: {
          id: true,
          firstName: true,
          lastName: true,
          specialty: true,
          rating: true,
          isPro: true,
          mpSubscriptionStatus: true,
          isVerified: true,
          proSince: true,
          createdAt: true,
          user: { select: { email: true, isActive: true, isBanned: true } },
          _count: { select: { services: true, appointments: true, reviews: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
    ]);

    return NextResponse.json({
      total,
      pro,
      free: total - pro,
      avgRating: avgRating._avg.rating ?? 0,
      mrr: pro * PRO_PLAN_PRICE,
      planPrice: PRO_PLAN_PRICE,
      professionals: professionals.map((p) => ({
        id: p.id,
        name: `${p.firstName} ${p.lastName}`,
        email: p.user.email,
        specialty: p.specialty,
        rating: p.rating,
        isPro: p.isPro,
        mpSubscriptionStatus: p.mpSubscriptionStatus,
        isVerified: p.isVerified,
        isActive: p.user.isActive,
        isBanned: p.user.isBanned,
        proSince: p.proSince,
        createdAt: p.createdAt,
        services: p._count.services,
        appointments: p._count.appointments,
        reviews: p._count.reviews,
      })),
    });
  } catch (e) {
    console.error("[owner/dashboard/profesionales] GET failed:", e);
    return NextResponse.json({ error: "No se pudo cargar profesionales" }, { status: 500 });
  }
}
