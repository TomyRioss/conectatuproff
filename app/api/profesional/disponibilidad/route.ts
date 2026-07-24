import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getOwnProfessionalId(userId: string) {
  const pro = await prisma.professional.findUnique({ where: { userId }, select: { id: true } });
  return pro?.id ?? null;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PROFESSIONAL") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const professionalId = await getOwnProfessionalId(session.user.id);
  if (!professionalId) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });

  const days = await prisma.professionalAvailability.findMany({
    where: { professionalId },
    orderBy: { dayOfWeek: "asc" },
    select: { dayOfWeek: true, startTime: true, endTime: true },
  });
  return NextResponse.json({ days });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PROFESSIONAL") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const professionalId = await getOwnProfessionalId(session.user.id);
  if (!professionalId) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });

  const body = await req.json();
  const days: { dayOfWeek: number; startTime: string; endTime: string }[] = Array.isArray(body?.days)
    ? body.days.filter(
        (d: unknown): d is { dayOfWeek: number; startTime: string; endTime: string } =>
          !!d &&
          typeof d === "object" &&
          typeof (d as Record<string, unknown>).dayOfWeek === "number" &&
          typeof (d as Record<string, unknown>).startTime === "string" &&
          typeof (d as Record<string, unknown>).endTime === "string"
      )
    : [];

  try {
    await prisma.$transaction([
      prisma.professionalAvailability.deleteMany({ where: { professionalId } }),
      prisma.professionalAvailability.createMany({
        data: days.map((d) => ({ professionalId, dayOfWeek: d.dayOfWeek, startTime: d.startTime, endTime: d.endTime })),
      }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("PUT /api/profesional/disponibilidad", e);
    return NextResponse.json({ error: "Error al guardar horario" }, { status: 500 });
  }
}
