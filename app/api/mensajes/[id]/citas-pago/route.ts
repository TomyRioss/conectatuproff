import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Turnos de la conversación que el profesional puede cobrar con un link de
// MercadoPago: activos (PENDING/CONFIRMED), propios y del cliente del chat.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PROFESSIONAL") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id: conversationId } = await params;

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { professionalId: true, clientId: true, professional: { select: { userId: true } } },
    });
    if (!conversation || conversation.professional.userId !== session.user.id) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        professionalId: conversation.professionalId,
        clientId: conversation.clientId,
        status: { in: ["PENDING", "CONFIRMED"] },
        priceAtBooking: { gt: 0 },
      },
      orderBy: { startAt: "asc" },
      select: {
        id: true,
        startAt: true,
        priceAtBooking: true,
        currency: true,
        service: { select: { title: true } },
      },
    });

    const citas = appointments.map((a) => {
      const d = new Date(a.startAt);
      const fecha = d.toLocaleDateString("es-AR", { day: "numeric", month: "long" });
      const hora = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
      const precio = Number(a.priceAtBooking).toLocaleString("es-AR", {
        style: "currency",
        currency: a.currency,
      });
      return {
        id: a.id,
        label: `${a.service?.title ?? "Consulta"} · ${fecha} ${hora} hs · ${precio}`,
      };
    });

    return NextResponse.json({ citas });
  } catch (e) {
    console.error("GET /api/mensajes/[id]/citas-pago", e);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
