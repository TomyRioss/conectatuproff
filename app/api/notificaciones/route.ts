import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const role =
    (session.user as { role?: string }).role === "PROFESSIONAL"
      ? ("PROFESSIONAL" as const)
      : ("CLIENT" as const);
  const where = { userId: session.user.id, audience: role };

  try {
    const [notifications, unread] = await Promise.all([
      prisma.notification.findMany({ where, orderBy: { createdAt: "desc" }, take: 30 }),
      // El total de no leídas no puede quedar limitado al tamaño de la página.
      prisma.notification.count({ where: { ...where, read: false } }),
    ]);

    return NextResponse.json({ notifications, unread });
  } catch (e) {
    console.error("GET /api/notificaciones", e);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  try {
    const body = await req.json().catch(() => null);

    if (body?.all === true) {
      await prisma.notification.updateMany({
        where: { userId: session.user.id, read: false },
        data: { read: true },
      });
    } else if (typeof body?.id === "string") {
      await prisma.notification.updateMany({
        where: { id: body.id, userId: session.user.id },
        data: { read: true },
      });
    } else {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("PATCH /api/notificaciones", e);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
