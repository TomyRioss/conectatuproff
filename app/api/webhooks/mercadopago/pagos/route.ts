import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Webhook de pagos puntuales (Preferences) de MercadoPago — distinto del
 * webhook de suscripciones (preapproval) en /api/webhooks/mercadopago.
 * Marca el turno como pago en metadata cuando el payment se acredita.
 */
function verifySignature(req: Request, dataId: string | undefined): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) {
    console.warn("[webhooks/mercadopago/pagos] MP_WEBHOOK_SECRET no configurado: webhook sin verificación de firma");
    return true;
  }

  const signatureHeader = req.headers.get("x-signature");
  const requestId = req.headers.get("x-request-id") ?? "";
  if (!signatureHeader) return false;

  const parts = Object.fromEntries(
    signatureHeader.split(",").map((p) => p.split("=").map((s) => s.trim()) as [string, string])
  );
  const { ts, v1 } = parts;
  if (!ts || !v1 || !dataId) return false;

  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");

  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(v1, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  let body: { data?: { id?: string }; id?: string; type?: string } | null = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const paymentId: string | undefined = body?.data?.id ?? (body?.id ? String(body.id) : undefined);

  if (!paymentId || (body?.type !== "payment" && body?.type !== undefined)) {
    return NextResponse.json({ ok: true });
  }

  if (!verifySignature(req, paymentId)) {
    return NextResponse.json({ ok: false, error: "INVALID_SIGNATURE" }, { status: 401 });
  }

  try {
    const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN ?? ""}` },
    });
    if (!res.ok) {
      console.error("[webhooks/mercadopago/pagos] GET payment falló:", res.status);
      return NextResponse.json({ ok: false }, { status: 500 });
    }
    const payment = await res.json();

    // Solo acreditamos pagos aprobados.
    if (payment.status !== "approved") {
      return NextResponse.json({ ok: true });
    }

    const appointmentId: string | undefined = payment?.external_reference;
    if (!appointmentId) return NextResponse.json({ ok: true });

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: { id: true, status: true, notes: true, professional: { select: { userId: true } }, client: { select: { userId: true } } },
    });
    if (!appointment) return NextResponse.json({ ok: true });

    // Marcamos el pago en notes (append) sin tocar el estado del turno.
    const paidMarker = "[PAGADO con MercadoPago]";
    if (!(appointment.notes ?? "").includes(paidMarker)) {
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { notes: `${appointment.notes ? appointment.notes + "\n" : ""}${paidMarker} payment_id=${paymentId}` },
      });
    }

    // Notificamos al profesional del pago acreditado.
    if (appointment.professional?.userId) {
      await prisma.notification.create({
        data: {
          userId: appointment.professional.userId,
          audience: "PROFESSIONAL",
          type: "payment_confirmed",
          title: "Pago recibido 💰",
          body: "El cliente acreditó el pago del turno por MercadoPago.",
          link: "/profesional/agenda",
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error procesando webhook de pago MercadoPago:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
