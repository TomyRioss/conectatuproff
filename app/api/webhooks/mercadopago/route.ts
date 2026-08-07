import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { preApproval } from "@/lib/mercadopago";

const STATUS_MAP: Record<string, "PENDING" | "AUTHORIZED" | "PAUSED" | "CANCELLED"> = {
  pending: "PENDING",
  authorized: "AUTHORIZED",
  paused: "PAUSED",
  cancelled: "CANCELLED",
};

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const preapprovalId: string | undefined = body?.data?.id ?? body?.id;

  if (!preapprovalId || body?.type !== "subscription_preapproval") {
    return NextResponse.json({ ok: true });
  }

  try {
    const info = await preApproval.get({ id: preapprovalId });
    const status = STATUS_MAP[info.status ?? ""] ?? "PENDING";

    const pro = await prisma.professional.findUnique({ where: { mpPreapprovalId: preapprovalId } });
    if (!pro) return NextResponse.json({ ok: true });

    await prisma.professional.update({
      where: { id: pro.id },
      data: {
        mpSubscriptionStatus: status,
        isPro: status === "AUTHORIZED",
        proSince: status === "AUTHORIZED" && !pro.proSince ? new Date() : pro.proSince,
      },
    });
  } catch (err) {
    console.error("Error procesando webhook MercadoPago:", err);
  }

  return NextResponse.json({ ok: true });
}
