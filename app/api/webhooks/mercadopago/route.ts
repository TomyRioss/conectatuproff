import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { preApproval } from "@/lib/mercadopago";

const STATUS_MAP: Record<string, "PENDING" | "AUTHORIZED" | "PAUSED" | "CANCELLED"> = {
  pending: "PENDING",
  authorized: "AUTHORIZED",
  paused: "PAUSED",
  cancelled: "CANCELLED",
};

/**
 * Validación del header x-signature de MercadoPago (HMAC-SHA256 sobre
 * `id:<data.id>;request-id:<x-request-id>;ts:<ts>;` con el secret del webhook).
 * Si MP_WEBHOOK_SECRET no está configurado se omite la verificación (deploy
 * legacy) pero se loguea para forzar la configuración en producción.
 */
function verifySignature(req: Request, dataId: string | undefined): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) {
    console.warn("[webhooks/mercadopago] MP_WEBHOOK_SECRET no configurado: webhook sin verificación de firma");
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
    // Cuerpo inválido: 400 para que MP no reintente indefinidamente basura.
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const preapprovalId: string | undefined = body?.data?.id ?? body?.id;

  if (!preapprovalId || body?.type !== "subscription_preapproval") {
    return NextResponse.json({ ok: true });
  }

  if (!verifySignature(req, preapprovalId)) {
    return NextResponse.json({ ok: false, error: "INVALID_SIGNATURE" }, { status: 401 });
  }

  try {
    const info = await preApproval.get({ id: preapprovalId });
    const status = STATUS_MAP[info.status ?? ""] ?? "PENDING";

    const pro = await prisma.professional.findUnique({
      where: { mpPreapprovalId: preapprovalId },
      select: { id: true, proSince: true },
    });
    if (!pro) return NextResponse.json({ ok: true });

    await prisma.professional.update({
      where: { id: pro.id },
      data: {
        mpSubscriptionStatus: status,
        isPro: status === "AUTHORIZED",
        proSince: status === "AUTHORIZED" && !pro.proSince ? new Date() : pro.proSince,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    // Devolver 5xx habilita los reintentos de MercadoPago. Responder 200 acá
    // significaría perder eventos ("pagó pero nunca se activó").
    console.error("Error procesando webhook MercadoPago:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
