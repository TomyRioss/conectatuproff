import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getOwnProfessionalId(userId: string) {
  const pro = await prisma.professional.findUnique({ where: { userId }, select: { id: true, isVerified: true } });
  return pro ?? null;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PROFESSIONAL") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const pro = await getOwnProfessionalId(session.user.id);
  if (!pro) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });

  const days = await prisma.professionalAvailability.findMany({
    where: { professionalId: pro.id },
    orderBy: { dayOfWeek: "asc" },
    select: { dayOfWeek: true, startTime: true, endTime: true },
  });
  return NextResponse.json({ days });
}

const HHMM_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PROFESSIONAL") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const pro = await getOwnProfessionalId(session.user.id);
  if (!pro) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const days: { dayOfWeek: number; startTime: string; endTime: string }[] = Array.isArray(body?.days)
    ? body.days.filter((d: unknown): d is { dayOfWeek: number; startTime: string; endTime: string } => {
        if (!d || typeof d !== "object") return false;
        const row = d as Record<string, unknown>;
        return (
          Number.isInteger(row.dayOfWeek) &&
          (row.dayOfWeek as number) >= 0 &&
          (row.dayOfWeek as number) <= 6 &&
          typeof row.startTime === "string" &&
          typeof row.endTime === "string"
        );
      })
    : [];

  // Validación server-side: formato HH:MM y ventana positiva. Sin esto se
  // persisten ventanas negativas/vacías silenciosamente.
  for (const d of days) {
    if (!HHMM_RE.test(d.startTime) || !HHMM_RE.test(d.endTime)) {
      return NextResponse.json({ error: "Formato de horario inválido" }, { status: 400 });
    }
    const toMin = (s: string) => {
      const [h, m] = s.split(":").map(Number);
      return h * 60 + m;
    };
    if (toMin(d.endTime) <= toMin(d.startTime)) {
      return NextResponse.json({ error: "La hora de fin debe ser mayor a la de inicio" }, { status: 400 });
    }
  }

  try {
    await prisma.$transaction([
      prisma.professionalAvailability.deleteMany({ where: { professionalId: pro.id } }),
      prisma.professionalAvailability.createMany({
        data: days.map((d) => ({ professionalId: pro.id, dayOfWeek: d.dayOfWeek, startTime: d.startTime, endTime: d.endTime })),
      }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("PUT /api/profesional/disponibilidad", e);
    return NextResponse.json({ error: "Error al guardar horario" }, { status: 500 });
  }
}
