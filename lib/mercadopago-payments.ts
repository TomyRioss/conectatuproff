import { MercadoPagoConfig, Preference } from "mercadopago";
import { prisma } from "@/lib/prisma";

export const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN ?? "",
});

export const preference = new Preference(mpClient);

/**
 * Crea una preferencia de pago de MercadoPago para un turno/servicio y envía
 * el link al chat de la conversación (message senderRole BOT con link).
 * El cliente lo abre desde el chat y paga en la app/web de MP.
 */
export async function crearLinkPagoCita(opts: {
  conversationId: string;
  appointmentId: string;
  professionalId: string;
  clientId: string;
  title: string;
  price: number;
  currency: string;
  baseUrl: string;
}): Promise<{ link: string; messageId: string }> {
  const pref = await preference.create({
    body: {
      items: [
        {
          id: opts.appointmentId,
          title: opts.title,
          quantity: 1,
          unit_price: opts.price,
          currency_id: opts.currency,
        },
      ],
      external_reference: opts.appointmentId,
      metadata: { conversationId: opts.conversationId, appointmentId: opts.appointmentId },
      back_urls: {
        success: `${opts.baseUrl}/cliente/turnos?payment=success`,
        pending: `${opts.baseUrl}/cliente/turnos?payment=pending`,
        failure: `${opts.baseUrl}/cliente/turnos?payment=failure`,
      },
      notification_url: `${opts.baseUrl}/api/webhooks/mercadopago/pagos`,
    },
  });

  const link = pref.init_point ?? pref.sandbox_init_point;
  if (!link) throw new Error("MP_NO_INIT_POINT");

  const message = await prisma.message.create({
    data: {
      conversationId: opts.conversationId,
      senderRole: "BOT",
      body: `💰 [Pagar ${opts.title} por ${opts.price.toLocaleString("es-AR", { style: "currency", currency: opts.currency })}](${link})\n\nToca el botón de arriba para pagar con MercadoPago.`,
      escalatesToHuman: false,
    },
    select: { id: true },
  });

  await prisma.conversation.update({
    where: { id: opts.conversationId },
    data: { updatedAt: new Date() },
  });

  return { link, messageId: message.id };
}
