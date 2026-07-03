import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import AgendaCalendario from "@/components/agenda/AgendaCalendario"

export default async function AgendaPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const pro = await prisma.professional.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })
  if (!pro) redirect("/profesional/onboarding")

  return (
    <main className="min-h-screen bg-brand-bg px-4 py-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-brand-dark mb-6">Agenda</h1>
      <AgendaCalendario />
    </main>
  )
}
