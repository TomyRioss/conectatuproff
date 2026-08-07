import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MIN_CANCEL_NOTICE_MS = 24 * 60 * 60 * 1000;

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id || (session.user as { role?: string }).role !== "CLIENT") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const { status } = await req.json();
  if (status !== "CANCELLED") {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }

  try {
    const client = await prisma.client.findUnique({ where: { userId: session.user.id }, select: { id: true } });
    if (!client) return NextResponse.json({ error: "Perfil de cliente no encontrado" }, { status: 404 });

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      select: { clientId: true, status: true, startAt: true },
    });
    if (!appointment || appointment.clientId !== client.id) {
      return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
    }
    if (appointment.status !== "PENDING" && appointment.status !== "CONFIRMED") {
      return NextResponse.json({ error: "Este turno no se puede cancelar" }, { status: 400 });
    }
    if (appointment.startAt.getTime() - Date.now() < MIN_CANCEL_NOTICE_MS) {
      return NextResponse.json({ error: "CANCEL_WINDOW_CLOSED" }, { status: 400 });
    }

    const updated = await prisma.appointment.update({ where: { id }, data: { status: "CANCELLED" } });
    return NextResponse.json(updated);
  } catch (e) {
    console.error("PATCH /api/citas/[id]", e);
    return NextResponse.json({ error: "Error al cancelar turno" }, { status: 500 });
  }
}
