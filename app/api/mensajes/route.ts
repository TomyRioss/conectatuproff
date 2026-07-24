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
        professional: { select: { firstName: true, lastName: true, avatarUrl: true, user: { select: { image: true } } } },
        client: { select: { firstName: true, lastName: true, avatarUrl: true, user: { select: { image: true } } } },
        messages: { orderBy: { createdAt: "desc" }, take: 1, select: { body: true, createdAt: true } },
      },
    });

    const result = conversations.map((c) => {
      const other = role === "PROFESSIONAL" ? c.client : c.professional;
      const avatar = other.avatarUrl ? `/api/avatar?key=${encodeURIComponent(other.avatarUrl)}` : other.user.image;
      return {
        id: c.id,
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
