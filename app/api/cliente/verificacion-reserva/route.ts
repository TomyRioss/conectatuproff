import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || (session.user as { role?: string }).role !== "CLIENT") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const dni = typeof body?.dni === "string" ? body.dni.replace(/\D/g, "") : "";
  const frontKey = typeof body?.frontKey === "string" ? body.frontKey : "";
  const torsoKey = typeof body?.torsoKey === "string" ? body.torsoKey : "";
  if (!/^\d{7,8}$/.test(dni)) return NextResponse.json({ error: "DNI inválido" }, { status: 400 });

  const prefix = `dni-docs/${session.user.id}/`;
  if (!frontKey.startsWith(`${prefix}front-`) || !torsoKey.startsWith(`${prefix}torso-`)) {
    return NextResponse.json({ error: "Subí ambas imágenes de verificación" }, { status: 400 });
  }

  try {
    const client = await prisma.client.findUnique({ where: { userId: session.user.id }, select: { id: true } });
    if (!client) return NextResponse.json({ error: "Perfil de cliente no encontrado" }, { status: 404 });

    await prisma.$transaction([
      prisma.client.update({ where: { id: client.id }, data: { dni: Number(dni) } }),
      prisma.user.update({
        where: { id: session.user.id },
        data: {
          dniPhotoFront: frontKey,
          dniPhotoTorso: torsoKey,
          dniStatus: "PENDING",
          dniSubmittedAt: new Date(),
        },
      }),
    ]);

    return NextResponse.json({ ok: true, dniStatus: "PENDING" });
  } catch (error) {
    console.error("POST /api/cliente/verificacion-reserva", error);
    return NextResponse.json({ error: "No se pudo enviar la verificación" }, { status: 500 });
  }
}
