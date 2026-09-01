import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/owner-auth";

export async function GET() {
  const { error } = await requireOwner();
  if (error) return error;

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [total, newLast30Days, verified, clients] = await prisma.$transaction([
      prisma.client.count(),
      prisma.client.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.client.count({ where: { isVerified: true } }),
      prisma.client.findMany({
        select: {
          id: true,
          firstName: true,
          lastName: true,
          location: true,
          isVerified: true,
          createdAt: true,
          user: { select: { email: true, isActive: true, isBanned: true } },
          _count: { select: { appointments: true, reviews: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
    ]);

    return NextResponse.json({
      total,
      newLast30Days,
      verified,
      clients: clients.map((c) => ({
        id: c.id,
        name: `${c.firstName} ${c.lastName}`,
        email: c.user.email,
        location: c.location,
        isVerified: c.isVerified,
        isActive: c.user.isActive,
        isBanned: c.user.isBanned,
        createdAt: c.createdAt,
        appointments: c._count.appointments,
        reviews: c._count.reviews,
      })),
    });
  } catch (e) {
    console.error("[owner/dashboard/clientes] GET failed:", e);
    return NextResponse.json({ error: "No se pudo cargar clientes" }, { status: 500 });
  }
}
