import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/owner-auth";

export async function GET() {
  const { error } = await requireOwner();
  if (error) return error;

  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [total, active, escalated, conversations] = await prisma.$transaction([
      prisma.conversation.count(),
      prisma.conversation.count({
        where: { messages: { some: { createdAt: { gte: sevenDaysAgo } } } },
      }),
      prisma.conversation.count({
        where: { messages: { some: { escalatesToHuman: true } } },
      }),
      prisma.conversation.findMany({
        select: {
          id: true,
          botEnabled: true,
          updatedAt: true,
          professional: { select: { firstName: true, lastName: true } },
          client: { select: { firstName: true, lastName: true } },
          _count: { select: { messages: true } },
          messages: {
            select: { body: true, createdAt: true, escalatesToHuman: true },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        orderBy: { updatedAt: "desc" },
        take: 200,
      }),
    ]);

    return NextResponse.json({
      total,
      active,
      escalated,
      conversations: conversations.map((c) => ({
        id: c.id,
        professional: `${c.professional.firstName} ${c.professional.lastName}`,
        client: `${c.client.firstName} ${c.client.lastName}`,
        botEnabled: c.botEnabled,
        messages: c._count.messages,
        updatedAt: c.updatedAt,
        lastMessage: c.messages[0]?.body ?? null,
        escalated: c.messages[0]?.escalatesToHuman ?? false,
      })),
    });
  } catch (e) {
    console.error("[owner/dashboard/conversaciones] GET failed:", e);
    return NextResponse.json({ error: "No se pudieron cargar las conversaciones" }, { status: 500 });
  }
}
