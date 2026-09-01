import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user as { role?: string }).role !== "CLIENT") {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
    }
    const { professionalId, rating, comment } = body as {
      professionalId?: unknown;
      rating?: unknown;
      comment?: unknown;
    };

    if (
      typeof professionalId !== "string" ||
      typeof rating !== "number" ||
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
    }
    if (comment !== undefined && (typeof comment !== "string" || comment.length > 1000)) {
      return NextResponse.json({ error: "INVALID_COMMENT" }, { status: 400 });
    }

    const client = await prisma.client.findUnique({ where: { userId: session.user.id }, select: { id: true } });
    if (!client) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

    // Solo se puede reseñar tras un turno completado con ese profesional.
    const completedAppointment = await prisma.appointment.findFirst({
      where: { clientId: client.id, professionalId, status: "COMPLETED" },
      select: { id: true },
    });
    if (!completedAppointment) {
      return NextResponse.json({ error: "NO_COMPLETED_APPOINTMENT" }, { status: 403 });
    }

    // Una sola reseña por cliente y profesional (chequeo atómico dentro de la tx;
    // sin constraint en DB por restricciones de migración del MVP).
    const review = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`rev:${client.id}:${professionalId}`}))`;
      const existing = await tx.review.findFirst({
        where: { clientId: client.id, professionalId },
        select: { id: true },
      });
      if (existing) return null;

      return tx.review.create({
        data: { clientId: client.id, professionalId, rating, comment: typeof comment === "string" ? comment.trim() || null : null },
      });
    });

    if (!review) {
      return NextResponse.json({ error: "REVIEW_EXISTS" }, { status: 409 });
    }

    // Recalcular el promedio persistido para que cards/explore no queden stale.
    const agg = await prisma.review.aggregate({
      where: { professionalId },
      _avg: { rating: true },
    });
    await prisma.professional.update({
      where: { id: professionalId },
      data: { rating: Math.round((agg._avg.rating ?? 0) * 10) / 10 },
    }).catch((e) => console.error("[POST /api/resenas] rating update failed:", e));

    return NextResponse.json({ review }, { status: 201 });
  } catch (e) {
    console.error("[POST /api/resenas]", e);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
