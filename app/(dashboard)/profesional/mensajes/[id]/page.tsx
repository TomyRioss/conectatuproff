import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import ChatThread from "@/components/mensajes/ChatThread";

export const dynamic = "force-dynamic";

export default async function ProfesionalMensajeThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PROFESSIONAL") {
    redirect("/profesional/login?callbackUrl=/profesional/mensajes");
  }

  const { id } = await params;

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    select: {
      professional: { select: { userId: true } },
      client: { select: { firstName: true, lastName: true, avatarUrl: true, user: { select: { image: true } } } },
    },
  });

  if (!conversation || conversation.professional.userId !== session.user.id) notFound();

  const otherAvatar = conversation.client.avatarUrl
    ? `/api/avatar?key=${encodeURIComponent(conversation.client.avatarUrl)}`
    : conversation.client.user.image;

  return (
    <main className="min-h-screen bg-brand-bg">
      <ChatThread
        conversationId={id}
        currentRole="PROFESSIONAL"
        otherName={`${conversation.client.firstName} ${conversation.client.lastName}`}
        otherAvatar={otherAvatar}
        backHref="/profesional/mensajes"
      />
    </main>
  );
}
