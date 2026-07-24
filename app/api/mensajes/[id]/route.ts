import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getMembership(conversationId: string, userId: string, role?: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { professional: { select: { userId: true } }, client: { select: { userId: true } } },
  });
  if (!conversation) return null;
  const isProfessional = role === "PROFESSIONAL" && conversation.professional.userId === userId;
  const isClient = role === "CLIENT" && conversation.client.userId === userId;
  if (!isProfessional && !isClient) return null;
  return { senderRole: isProfessional ? ("PROFESSIONAL" as const) : ("CLIENT" as const) };
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { id } = await params;
  const role = (session.user as { role?: string }).role;
  const membership = await getMembership(id, session.user.id, role);
  if (!membership) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const since = new URL(req.url).searchParams.get("since");

  try {
    const messages = await prisma.message.findMany({
      where: { conversationId: id, ...(since ? { createdAt: { gt: new Date(since) } } : {}) },
      orderBy: { createdAt: "asc" },
      select: { id: true, senderRole: true, body: true, createdAt: true },
    });
    return NextResponse.json({ messages });
  } catch (e) {
    console.error("GET /api/mensajes/[id]", e);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { id } = await params;
  const role = (session.user as { role?: string }).role;
  const membership = await getMembership(id, session.user.id, role);
  if (!membership) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const body = await req.json();
  const text = typeof body.body === "string" ? body.body.trim() : "";
  if (!text) return NextResponse.json({ error: "EMPTY_BODY" }, { status: 400 });

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      select: {
        professional: { select: { userId: true, firstName: true, lastName: true } },
        client: { select: { userId: true, firstName: true, lastName: true } },
      },
    });
    if (!conversation) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

    const message = await prisma.message.create({
      data: { conversationId: id, senderRole: membership.senderRole, body: text },
      select: { id: true, senderRole: true, body: true, createdAt: true },
    });

    await prisma.conversation.update({ where: { id }, data: { updatedAt: new Date() } });

    const recipientUserId =
      membership.senderRole === "PROFESSIONAL" ? conversation.client.userId : conversation.professional.userId;
    const senderName =
      membership.senderRole === "PROFESSIONAL"
        ? `${conversation.professional.firstName} ${conversation.professional.lastName}`
        : `${conversation.client.firstName} ${conversation.client.lastName}`;

    await prisma.notification.create({
      data: {
        userId: recipientUserId,
        type: "message",
        title: `Nuevo mensaje de ${senderName}`,
        body: text.slice(0, 120),
        link: `/mensajes/${id}`,
      },
    });

    return NextResponse.json({ ok: true, message });
  } catch (e) {
    console.error("POST /api/mensajes/[id]", e);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
