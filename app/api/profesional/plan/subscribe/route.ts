import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { preApproval, PRO_PLAN_PRICE } from "@/lib/mercadopago";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PROFESSIONAL") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!process.env.MP_ACCESS_TOKEN) {
    console.error("MP_ACCESS_TOKEN no configurado");
    return NextResponse.json({ error: "Pagos no disponibles por el momento" }, { status: 503 });
  }

  const pro = await prisma.professional.findUnique({
    where: { userId: session.user.id },
    include: { user: { select: { email: true } } },
  });
  if (!pro) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });

  if (pro.isPro) {
    return NextResponse.json({ error: "Ya tenés el plan Pro+" }, { status: 400 });
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  try {
    const result = await preApproval.create({
      body: {
        reason: "ConectaTuProff Pro+",
        payer_email: pro.user.email,
        back_url: `${baseUrl}/profesional/perfil?upgrade=success`,
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          transaction_amount: PRO_PLAN_PRICE,
          currency_id: "ARS",
        },
        status: "pending",
      },
    });

    await prisma.professional.update({
      where: { id: pro.id },
      data: { mpPreapprovalId: result.id, mpSubscriptionStatus: "PENDING" },
    });

    return NextResponse.json({ init_point: result.init_point });
  } catch (err) {
    console.error("Error creando suscripción MercadoPago:", err);
    return NextResponse.json({ error: "No pudimos iniciar el pago. Probá de nuevo." }, { status: 500 });
  }
}
