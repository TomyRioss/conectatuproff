import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/owner-auth";
import { PRO_PLAN_PRICE } from "@/lib/mercadopago";

export async function GET() {
  const { error } = await requireOwner();
  if (error) return error;

  try {
    const [paidProfessionals, totalProfessionals, avgServicePrice, pricedServices, proList] =
      await prisma.$transaction([
        prisma.professional.count({ where: { isPro: true } }),
        prisma.professional.count(),
        prisma.service.aggregate({ _avg: { price: true }, where: { price: { not: null } } }),
        prisma.service.count({ where: { price: { not: null } } }),
        prisma.professional.findMany({
          where: { isPro: true },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            proSince: true,
            mpSubscriptionStatus: true,
            user: { select: { email: true } },
          },
          orderBy: { proSince: "desc" },
          take: 200,
        }),
      ]);

    return NextResponse.json({
      planPrice: PRO_PLAN_PRICE,
      paidProfessionals,
      totalProfessionals,
      conversionRate: totalProfessionals > 0 ? paidProfessionals / totalProfessionals : 0,
      mrr: paidProfessionals * PRO_PLAN_PRICE,
      avgServicePrice: avgServicePrice._avg.price ? Number(avgServicePrice._avg.price) : null,
      pricedServices,
      proProfessionals: proList.map((p) => ({
        id: p.id,
        name: `${p.firstName} ${p.lastName}`,
        email: p.user.email,
        proSince: p.proSince,
        mpSubscriptionStatus: p.mpSubscriptionStatus,
      })),
    });
  } catch (e) {
    console.error("[owner/dashboard/ingresos] GET failed:", e);
    return NextResponse.json({ error: "No se pudieron cargar los ingresos" }, { status: 500 });
  }
}
