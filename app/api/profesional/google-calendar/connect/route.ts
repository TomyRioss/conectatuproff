import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAuthUrl } from "@/lib/googleCalendar";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PROFESSIONAL") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const pro = await prisma.professional.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!pro) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });

  return NextResponse.redirect(getAuthUrl(pro.id));
}
