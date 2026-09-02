import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/owner-auth";

export async function GET() {
  const { error } = await requireOwner();
  if (error) return error;

  try {
    const now = new Date();

    const [
      total,
      pending,
      confirmed,
      completed,
      cancelled,
      noShow,
      upcoming,
      appointments,
    ] = await prisma.$transaction([
      prisma.appointment.count(),
      prisma.appointment.count({ where: { status: "PENDING" } }),
      prisma.appointment.count({ where: { status: "CONFIRMED" } }),
      prisma.appointment.count({ where: { status: "COMPLETED" } }),
      prisma.appointment.count({ where: { status: "CANCELLED" } }),
      prisma.appointment.count({ where: { status: "NO_SHOW" } }),
      prisma.appointment.count({
        where: { startAt: { gte: now }, status: { in: ["PENDING", "CONFIRMED"] } },
      }),
      prisma.appointment.findMany({
        select: {
          id: true,
          startAt: true,
          status: true,
          priceAtBooking: true,
          currency: true,
          professional: { select: { firstName: true, lastName: true } },
          client: { select: { firstName: true, lastName: true } },
          service: { select: { title: true } },
        },
        orderBy: { startAt: "desc" },
        take: 200,
      }),
    ]);

    return NextResponse.json({
      total,
      upcoming,
      byStatus: { PENDING: pending, CONFIRMED: confirmed, COMPLETED: completed, CANCELLED: cancelled, NO_SHOW: noShow },
      appointments: appointments.map((a) => ({
        id: a.id,
        startAt: a.startAt,
        status: a.status,
        price: a.priceAtBooking ? Number(a.priceAtBooking) : null,
        currency: a.currency,
        professional: a.professional ? `${a.professional.firstName} ${a.professional.lastName}` : "Usuario no encontrado",
        client: a.client ? `${a.client.firstName} ${a.client.lastName}` : "Usuario no encontrado",
        service: a.service?.title ?? null,
      })),
    });
  } catch (e) {
    console.error("[owner/dashboard/agenda] GET failed:", e);
    return NextResponse.json({ error: "No se pudo cargar la agenda" }, { status: 500 });
  }
}
