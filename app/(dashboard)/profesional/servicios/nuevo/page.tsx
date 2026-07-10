import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ServiceWizard } from "@/components/profesionales/wizard/ServiceWizard"

export default async function NuevoServicioPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  if ((session.user as { role?: string }).role !== "PROFESSIONAL") redirect("/")

  return (
    <main className="min-h-screen bg-brand-bg">
      <ServiceWizard />
    </main>
  )
}
