import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { ServicesList } from "@/components/profesionales/ServicesList"

export default async function ProfesionalServiciosPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  if ((session.user as { role?: string }).role !== "PROFESSIONAL") redirect("/")

  const professional = await prisma.professional.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })
  if (!professional) redirect("/profesional/onboarding")

  const services = await prisma.service.findMany({
    where: { professionalId: professional.id },
    orderBy: { createdAt: "desc" },
  })

  return <ServicesList initialServices={JSON.parse(JSON.stringify(services))} />
}
