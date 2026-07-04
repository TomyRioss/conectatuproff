import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import { EditServiceForm } from "@/components/profesionales/EditServiceForm"

export default async function EditarServicioPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  if ((session.user as { role?: string }).role !== "PROFESSIONAL") redirect("/")

  const professional = await prisma.professional.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })
  if (!professional) redirect("/profesional/onboarding")

  const { id } = await params
  const service = await prisma.service.findUnique({ where: { id } })
  if (!service || service.professionalId !== professional.id) notFound()

  return <EditServiceForm service={JSON.parse(JSON.stringify(service))} />
}
