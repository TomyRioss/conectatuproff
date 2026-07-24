import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import ChatThread from "@/components/mensajes/ChatThread";

export const dynamic = "force-dynamic";

export default async function ClienteMensajeThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id || (session.user as { role?: string }).role !== "CLIENT") {
    redirect("/login?callbackUrl=/cliente/mensajes");
  }

  const { id } = await params;

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    select: {
      client: { select: { userId: true } },
      professional: { select: { firstName: true, lastName: true, avatarUrl: true, user: { select: { image: true } } } },
    },
  });

  if (!conversation || conversation.client.userId !== session.user.id) notFound();

  const otherAvatar = conversation.professional.avatarUrl
    ? `/api/avatar?key=${encodeURIComponent(conversation.professional.avatarUrl)}`
    : conversation.professional.user.image;

  return (
    <ChatThread
      conversationId={id}
      currentRole="CLIENT"
      otherName={`${conversation.professional.firstName} ${conversation.professional.lastName}`}
      otherAvatar={otherAvatar}
      backHref="/cliente/mensajes"
    />
  );
}
