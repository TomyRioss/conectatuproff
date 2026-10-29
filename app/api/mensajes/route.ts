import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const role = (session.user as { role?: string }).role;

  try {
    const conversations = await prisma.conversation.findMany({
      where:
        role === "PROFESSIONAL"
          ? { professional: { userId: session.user.id } }
          : { client: { userId: session.user.id } },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        updatedAt: true,
        professional: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, user: { select: { image: true } } } },
        client: { select: { firstName: true, lastName: true, avatarUrl: true, user: { select: { image: true } } } },
        messages: { orderBy: { createdAt: "desc" }, take: 1, select: { body: true, createdAt: true } },
      },
    });

    const result = conversations.map((c) => {
      const other = role === "PROFESSIONAL" ? c.client : c.professional;
      const avatar = other.avatarUrl ? `/api/avatar?key=${encodeURIComponent(other.avatarUrl)}` : other.user.image;
      return {
        id: c.id,
        professionalId: role === "PROFESSIONAL" ? undefined : c.professional.id,
        otherName: `${other.firstName} ${other.lastName}`,
        otherAvatar: avatar,
        lastMessage: c.messages[0]?.body ?? null,
        lastMessageAt: c.messages[0]?.createdAt ?? null,
      };
    });

    return NextResponse.json({ conversations: result });
  } catch (e) {
    console.error("GET /api/mensajes", e);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}

// Inicia una conversación cliente → profesional sin necesidad de reservar un
// turno antes. Reutiliza la conversación existente si ya hay una.
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || (session.user as { role?: string }).role !== "CLIENT") {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const professionalId = typeof body?.professionalId === "string" ? body.professionalId : "";
  const text = typeof body?.body === "string" ? body.body.trim() : "";
  if (!professionalId || !text) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  try {
    const client = await prisma.client.findUnique({ where: { userId: session.user.id }, select: { id: true } });
    if (!client) return NextResponse.json({ error: "Perfil de cliente no encontrado" }, { status: 404 });

    const professional = await prisma.professional.findFirst({
      where: { id: professionalId, isActive: true, isVerified: true, user: { isActive: true } },
      select: { id: true },
    });
    if (!professional) return NextResponse.json({ error: "Profesional no disponible" }, { status: 404 });

    const conversation = await prisma.conversation.upsert({
      where: { professionalId_clientId: { professionalId: professional.id, clientId: client.id } },
      update: { updatedAt: new Date() },
      create: { professionalId: professional.id, clientId: client.id },
      select: { id: true },
    });

    const message = await prisma.message.create({
      data: { conversationId: conversation.id, senderRole: "CLIENT", body: text },
      select: { id: true, senderRole: true, body: true, createdAt: true },
    });

    const professionalUser = await prisma.professional.findUnique({
      where: { id: professional.id },
      select: { userId: true, firstName: true },
    });
    if (professionalUser) {
      const clientUser = await prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true } });
      await prisma.notification.create({
        data: {
          userId: professionalUser.userId,
          audience: "PROFESSIONAL",
          type: "message",
          title: `Nuevo mensaje de ${clientUser?.name ?? "un cliente"}`,
          body: text.slice(0, 120),
          link: `/profesional/mensajes/${conversation.id}`,
        },
      });
    }

    return NextResponse.json({ ok: true, conversationId: conversation.id, message }, { status: 201 });
  } catch (e) {
    console.error("POST /api/mensajes", e);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
