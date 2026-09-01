import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/owner-auth";

export async function GET() {
  const { error } = await requireOwner();
  if (error) return error;

  try {
    const [total, active, draft, paused, avgPrice, categories, services] =
      await prisma.$transaction([
        prisma.service.count(),
        prisma.service.count({ where: { status: "ACTIVE" } }),
        prisma.service.count({ where: { status: "DRAFT" } }),
        prisma.service.count({ where: { status: "PAUSED" } }),
        prisma.service.aggregate({ _avg: { price: true }, where: { price: { not: null } } }),
        prisma.category.findMany({
          select: {
            id: true,
            name: true,
            _count: { select: { services: true, professionals: true } },
          },
          orderBy: { name: "asc" },
        }),
        prisma.service.findMany({
          select: {
            id: true,
            title: true,
            price: true,
            currency: true,
            status: true,
            createdAt: true,
            professional: { select: { firstName: true, lastName: true } },
            category: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 200,
        }),
      ]);

    return NextResponse.json({
      total,
      active,
      draft,
      paused,
      avgPrice: avgPrice._avg.price ? Number(avgPrice._avg.price) : null,
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        services: c._count.services,
        professionals: c._count.professionals,
      })),
      services: services.map((s) => ({
        id: s.id,
        title: s.title,
        price: s.price ? Number(s.price) : null,
        currency: s.currency,
        status: s.status,
        category: s.category?.name ?? null,
        professional: `${s.professional.firstName} ${s.professional.lastName}`,
        createdAt: s.createdAt,
      })),
    });
  } catch (e) {
    console.error("[owner/dashboard/catalogo] GET failed:", e);
    return NextResponse.json({ error: "No se pudo cargar el catálogo" }, { status: 500 });
  }
}
