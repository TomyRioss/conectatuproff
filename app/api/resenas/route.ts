import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user as { role?: string }).role !== "CLIENT") {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const body = await req.json();
    const { professionalId, rating, comment } = body as { professionalId?: string; rating?: number; comment?: string };

    if (!professionalId || typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
    }

    const client = await prisma.client.findUnique({ where: { userId: session.user.id }, select: { id: true } });
    if (!client) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

    const completedAppointment = await prisma.appointment.findFirst({
      where: { clientId: client.id, professionalId, status: "COMPLETED" },
      select: { id: true },
    });
    if (!completedAppointment) {
      return NextResponse.json({ error: "NO_COMPLETED_APPOINTMENT" }, { status: 403 });
    }

    const review = await prisma.review.create({
      data: { clientId: client.id, professionalId, rating, comment: comment?.trim() || null },
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (e: unknown) {
    if (typeof e === "object" && e !== null && "code" in e && (e as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "REVIEW_EXISTS" }, { status: 409 });
    }
    console.error("[POST /api/resenas]", e);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
