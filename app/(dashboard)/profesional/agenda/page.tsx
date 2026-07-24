import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import AgendaCalendario from "@/components/agenda/AgendaCalendario"
import GoogleCalendarButton from "@/components/agenda/GoogleCalendarButton"
import { WeeklyAvailabilityDialog } from "@/components/agenda/WeeklyAvailabilityDialog"

export default async function AgendaPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const pro = await prisma.professional.findUnique({
    where: { userId: session.user.id },
    select: { id: true, googleConnected: true },
  })
  if (!pro) redirect("/profesional/onboarding")

  return (
    <main className="min-h-screen bg-brand-bg px-4 py-8 max-w-5xl xl:max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <h1 className="text-2xl font-bold text-brand-dark">Agenda</h1>
        <div className="flex items-center gap-3">
          <WeeklyAvailabilityDialog />
          <GoogleCalendarButton initialConnected={pro.googleConnected} />
        </div>
      </div>
      <AgendaCalendario />
    </main>
  )
}
