import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import MessagesShell from "@/components/mensajes/MessagesShell";
import type { ConversationListItem } from "@/components/mensajes/ConversationList";

export const dynamic = "force-dynamic";

export default async function ClienteMensajesLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id || (session.user as { role?: string }).role !== "CLIENT") {
    redirect("/login?callbackUrl=/cliente/mensajes");
  }

  const client = await prisma.client.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!client) redirect("/");

  const conversations = await prisma.conversation.findMany({
    where: { clientId: client.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      professional: { select: { firstName: true, lastName: true, avatarUrl: true, user: { select: { image: true } } } },
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: { body: true, createdAt: true } },
    },
  });

  const items: ConversationListItem[] = conversations.map((c) => ({
    id: c.id,
    otherName: `${c.professional.firstName} ${c.professional.lastName}`,
    otherAvatar: c.professional.avatarUrl
      ? `/api/avatar?key=${encodeURIComponent(c.professional.avatarUrl)}`
      : c.professional.user.image,
    lastMessage: c.messages[0]?.body ?? null,
    lastMessageAt: c.messages[0]?.createdAt.toISOString() ?? null,
  }));

  return (
    <MessagesShell conversations={items} basePath="/cliente/mensajes">
      {children}
    </MessagesShell>
  );
}
