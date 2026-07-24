import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ConversationList, { type ConversationListItem } from "@/components/mensajes/ConversationList";

export const dynamic = "force-dynamic";

export default async function ProfesionalMensajesPage() {
  const session = await auth();
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PROFESSIONAL") {
    redirect("/profesional/login?callbackUrl=/profesional/mensajes");
  }

  const professional = await prisma.professional.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!professional) redirect("/");

  const conversations = await prisma.conversation.findMany({
    where: { professionalId: professional.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      client: { select: { firstName: true, lastName: true, avatarUrl: true, user: { select: { image: true } } } },
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: { body: true, createdAt: true } },
    },
  });

  const items: ConversationListItem[] = conversations.map((c) => ({
    id: c.id,
    otherName: `${c.client.firstName} ${c.client.lastName}`,
    otherAvatar: c.client.avatarUrl ? `/api/avatar?key=${encodeURIComponent(c.client.avatarUrl)}` : c.client.user.image,
    lastMessage: c.messages[0]?.body ?? null,
    lastMessageAt: c.messages[0]?.createdAt.toISOString() ?? null,
  }));

  return (
    <main className="min-h-screen bg-brand-bg pb-20">
      <h1 className="max-w-2xl mx-auto px-4 pt-6 text-xl font-bold text-brand-dark">Mensajes</h1>
      <ConversationList conversations={items} basePath="/profesional/mensajes" />
    </main>
  );
}
