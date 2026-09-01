import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/owner-auth";
import { PRO_PLAN_PRICE } from "@/lib/mercadopago";

export async function GET() {
  const { error } = await requireOwner();
  if (error) return error;

  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      clients,
      professionals,
      services,
      activeServices,
      conversations,
      activeConversations,
      categories,
      reviews,
      pendingPetitions,
      pendingDocs,
      appointmentsTotal,
      apptPending,
      apptConfirmed,
      apptCompleted,
      apptCancelled,
      apptNoShow,
      paidProfessionals,
      avgServicePrice,
    ] = await prisma.$transaction([
      prisma.client.count(),
      prisma.professional.count(),
      prisma.service.count(),
      prisma.service.count({ where: { status: "ACTIVE" } }),
      prisma.conversation.count(),
      prisma.conversation.count({
        where: { messages: { some: { createdAt: { gte: sevenDaysAgo } } } },
      }),
      prisma.category.count(),
      prisma.review.count(),
      prisma.petition.count({ where: { status: "PENDING" } }),
      prisma.professional.count({ where: { isVerified: false } }),
      prisma.appointment.count(),
      prisma.appointment.count({ where: { status: "PENDING" } }),
      prisma.appointment.count({ where: { status: "CONFIRMED" } }),
      prisma.appointment.count({ where: { status: "COMPLETED" } }),
      prisma.appointment.count({ where: { status: "CANCELLED" } }),
      prisma.appointment.count({ where: { status: "NO_SHOW" } }),
      prisma.professional.count({ where: { isPro: true } }),
      prisma.service.aggregate({ _avg: { price: true }, where: { price: { not: null } } }),
    ]);

    return NextResponse.json({
      clients,
      professionals,
      services,
      activeServices,
      conversations,
      activeConversations,
      categories,
      reviews,
      pendingPetitions,
      pendingDocs,
      appointmentsTotal,
      appointmentsByStatus: {
        PENDING: apptPending,
        CONFIRMED: apptConfirmed,
        COMPLETED: apptCompleted,
        CANCELLED: apptCancelled,
        NO_SHOW: apptNoShow,
      },
      paidProfessionals,
      mrr: paidProfessionals * PRO_PLAN_PRICE,
      planPrice: PRO_PLAN_PRICE,
      avgServicePrice: avgServicePrice._avg.price ? Number(avgServicePrice._avg.price) : null,
    });
  } catch (e) {
    console.error("[owner/dashboard] GET failed:", e);
    return NextResponse.json({ error: "No se pudo cargar el dashboard" }, { status: 500 });
  }
}
