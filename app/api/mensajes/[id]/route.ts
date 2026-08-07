import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mail";
import { getBotReply } from "@/lib/professionalAssistant";

const ESCALATION_THROTTLE_MS = 60 * 60 * 1000;

async function notifyProfessionalEscalation(conversationId: string, professionalUserId: string, professionalEmail: string | null, professionalFirstName: string, clientName: string) {
  const recent = await prisma.notification.findFirst({
    where: {
      userId: professionalUserId,
      type: "chat_escalation",
      link: `/profesional/mensajes/${conversationId}`,
      createdAt: { gt: new Date(Date.now() - ESCALATION_THROTTLE_MS) },
    },
    select: { id: true },
  });
  if (recent) return;

  await prisma.notification.create({
    data: {
      userId: professionalUserId,
      audience: "PROFESSIONAL",
      type: "chat_escalation",
      title: `${clientName} quiere hablar con vos`,
      body: "El asistente derivó una conversación que necesita tu atención directa.",
      link: `/profesional/mensajes/${conversationId}`,
    },
  });

  if (professionalEmail) {
    await sendMail({
      to: professionalEmail,
      subject: `${clientName} quiere hablar con vos`,
      html: `<p>Hola ${professionalFirstName},</p><p><strong>${clientName}</strong> pidió hablar directamente con vos en el chat. Ingresá a Conecta Tu Proff para responderle.</p>`,
    });
  }
}

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
    const [messages, conversation] = await Promise.all([
      prisma.message.findMany({
        where: { conversationId: id, ...(since ? { createdAt: { gt: new Date(since) } } : {}) },
        orderBy: { createdAt: "asc" },
        select: { id: true, senderRole: true, body: true, createdAt: true, escalatesToHuman: true },
      }),
      prisma.conversation.findUnique({ where: { id }, select: { botEnabled: true } }),
    ]);
    return NextResponse.json({ messages, botEnabled: conversation?.botEnabled ?? true });
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
  const escalate = body.escalate === true;
  const text = typeof body.body === "string" ? body.body.trim() : "";
  if (!escalate && !text) return NextResponse.json({ error: "EMPTY_BODY" }, { status: 400 });

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      select: {
        professionalId: true,
        botEnabled: true,
        professional: { select: { userId: true, firstName: true, lastName: true, user: { select: { email: true } } } },
        client: { select: { userId: true, firstName: true, lastName: true } },
      },
    });
    if (!conversation) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

    if (escalate) {
      if (membership.senderRole !== "CLIENT") return NextResponse.json({ error: "INVALID_ROLE" }, { status: 400 });
      await notifyProfessionalEscalation(
        id,
        conversation.professional.userId,
        conversation.professional.user.email,
        conversation.professional.firstName,
        `${conversation.client.firstName} ${conversation.client.lastName}`
      );
      return NextResponse.json({ ok: true, escalated: true });
    }

    const message = await prisma.message.create({
      data: { conversationId: id, senderRole: membership.senderRole, body: text },
      select: { id: true, senderRole: true, body: true, createdAt: true },
    });

    if (membership.senderRole === "PROFESSIONAL" && conversation.botEnabled) {
      await prisma.conversation.update({ where: { id }, data: { botEnabled: false } });
    } else {
      await prisma.conversation.update({ where: { id }, data: { updatedAt: new Date() } });
    }

    const recipientUserId =
      membership.senderRole === "PROFESSIONAL" ? conversation.client.userId : conversation.professional.userId;
    const senderName =
      membership.senderRole === "PROFESSIONAL"
        ? `${conversation.professional.firstName} ${conversation.professional.lastName}`
        : `${conversation.client.firstName} ${conversation.client.lastName}`;

    const recipientRole = membership.senderRole === "PROFESSIONAL" ? "CLIENT" : "PROFESSIONAL";
    await prisma.notification.create({
      data: {
        userId: recipientUserId,
        audience: recipientRole,
        type: "message",
        title: `Nuevo mensaje de ${senderName}`,
        body: text.slice(0, 120),
        link: recipientRole === "PROFESSIONAL" ? `/profesional/mensajes/${id}` : `/cliente/mensajes/${id}`,
      },
    });

    let botMessage = null;
    if (membership.senderRole === "CLIENT" && conversation.botEnabled) {
      const reply = await getBotReply(id, conversation.professionalId);
      if (reply) {
        botMessage = await prisma.message.create({
          data: { conversationId: id, senderRole: "BOT", body: reply.text, escalatesToHuman: reply.escalate },
          select: { id: true, senderRole: true, body: true, createdAt: true, escalatesToHuman: true },
        });
        await prisma.conversation.update({ where: { id }, data: { updatedAt: new Date() } });
        if (reply.escalate) {
          await notifyProfessionalEscalation(
            id,
            conversation.professional.userId,
            conversation.professional.user.email,
            conversation.professional.firstName,
            `${conversation.client.firstName} ${conversation.client.lastName}`
          );
        }
      }
    }

    return NextResponse.json({ ok: true, message, botMessage });
  } catch (e) {
    console.error("POST /api/mensajes/[id]", e);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { id } = await params;
  const role = (session.user as { role?: string }).role;
  const membership = await getMembership(id, session.user.id, role);
  if (!membership || membership.senderRole !== "PROFESSIONAL") {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const body = await req.json();
  if (typeof body.botEnabled !== "boolean") return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });

  try {
    await prisma.conversation.update({ where: { id }, data: { botEnabled: body.botEnabled } });
    return NextResponse.json({ ok: true, botEnabled: body.botEnabled });
  } catch (e) {
    console.error("PATCH /api/mensajes/[id]", e);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
