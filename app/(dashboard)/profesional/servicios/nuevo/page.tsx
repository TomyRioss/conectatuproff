import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { ServiceWizard } from "@/components/profesionales/wizard/ServiceWizard"

export default async function NuevoServicioPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  if ((session.user as { role?: string }).role !== "PROFESSIONAL") redirect("/")

  const pro = await prisma.professional.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      specialty: true,
      location: true,
      isPro: true,
      user: { select: { username: true, image: true } },
    },
  })
  const professionalServices = pro ? await prisma.service.findMany({
    where: { professionalId: pro.id, status: "ACTIVE" },
    select: { id: true, title: true, imageUrl: true },
    orderBy: { createdAt: "asc" },
  }) : []

  return (
    <main className="min-h-screen bg-brand-bg">
      <ServiceWizard
        professionalPreview={pro ? {
          firstName: pro.firstName,
          lastName: pro.lastName,
          avatarUrl: pro.avatarUrl,
          specialty: pro.specialty,
          location: pro.location,
          isPro: pro.isPro,
          username: pro.user.username,
          image: pro.user.image,
        } : null}
        professionalServicesPreview={professionalServices}
      />
    </main>
  )
}
