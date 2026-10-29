import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { crearLinkPagoCita } from "@/lib/mercadopago-payments";

// El profesional genera un link de pago MercadoPago por el turno y se lo envía
// al cliente por el chat (aparece como mensaje del asistente con el link).
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PROFESSIONAL") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!process.env.MP_ACCESS_TOKEN) {
    return NextResponse.json({ error: "Pagos no disponibles por el momento" }, { status: 503 });
  }

  const { id: conversationId } = await params;
  const body = await req.json().catch(() => null);
  const appointmentId = typeof body?.appointmentId === "string" ? body.appointmentId : "";

  try {
    // El profesional debe ser parte de la conversación.
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { professionalId: true, clientId: true, professional: { select: { userId: true } } },
    });
    if (!conversation || conversation.professional.userId !== session.user.id) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    // El turno debe pertenecer a esta relación profesional-cliente.
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: {
        id: true,
        professionalId: true,
        clientId: true,
        priceAtBooking: true,
        currency: true,
        status: true,
        service: { select: { title: true } },
      },
    });
    if (
      !appointment ||
      appointment.professionalId !== conversation.professionalId ||
      appointment.clientId !== conversation.clientId
    ) {
      return NextResponse.json({ error: "Turno no encontrado en esta conversación" }, { status: 404 });
    }
    if (appointment.status === "CANCELLED") {
      return NextResponse.json({ error: "El turno está cancelado" }, { status: 409 });
    }
    if (!appointment.priceAtBooking || Number(appointment.priceAtBooking) <= 0) {
      return NextResponse.json({ error: "El turno no tiene precio asociado" }, { status: 409 });
    }

    const baseUrl = process.env.AUTH_URL ?? new URL(req.url).origin;

    const { messageId } = await crearLinkPagoCita({
      conversationId,
      appointmentId: appointment.id,
      professionalId: conversation.professionalId,
      clientId: conversation.clientId,
      title: appointment.service?.title ?? "Turno reservado",
      price: Number(appointment.priceAtBooking),
      currency: appointment.currency,
      baseUrl,
    });

    return NextResponse.json({ ok: true, messageId });
  } catch (e) {
    console.error("POST /api/mensajes/[id]/pago", e);
    return NextResponse.json({ error: "No se pudo generar el link de pago" }, { status: 500 });
  }
}
