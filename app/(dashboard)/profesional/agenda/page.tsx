import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import AgendaCalendario from "@/components/agenda/AgendaCalendario"
import AgendaCitasPanel from "@/components/agenda/AgendaCitasPanel"
import GoogleCalendarButton from "@/components/agenda/GoogleCalendarButton"
import { CalendarAdminNotice } from "@/components/agenda/CalendarAdminNotice"

export default async function AgendaPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const pro = await prisma.professional.findUnique({
    where: { userId: session.user.id },
    select: { id: true, googleConnected: true },
  })
  if (!pro) redirect("/profesional/onboarding")

  return (
    <main className="min-h-screen bg-brand-bg px-4 py-6 sm:py-8 max-w-5xl xl:max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3 sm:gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl sm:text-2xl font-bold text-brand-dark">Agenda</h1>
        </div>
        <GoogleCalendarButton initialConnected={pro.googleConnected} />
      </div>
            <CalendarAdminNotice />
<AgendaCalendario />
      <div id="mis-citas" className="mt-8">
        <AgendaCitasPanel />
      </div>
    </main>
  )
}
