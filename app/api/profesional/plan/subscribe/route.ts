import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Pagos deshabilitados: el plan Pro+ se activa directo, sin cobro.
export async function POST() {
  const session = await auth();
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PROFESSIONAL") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const pro = await prisma.professional.findUnique({ where: { userId: session.user.id }, select: { id: true, isPro: true } });
  if (!pro) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });

  if (pro.isPro) {
    return NextResponse.json({ error: "Ya tenés el plan Pro+" }, { status: 400 });
  }

  try {
    await prisma.professional.update({
      where: { id: pro.id },
      data: {
        isPro: true,
        mpSubscriptionStatus: "AUTHORIZED",
        proSince: new Date(),
        mpPreapprovalId: null,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error activando plan Pro+:", err);
    return NextResponse.json({ error: "No pudimos activar el plan. Probá de nuevo." }, { status: 500 });
  }
}
