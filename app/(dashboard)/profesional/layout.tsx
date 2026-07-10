import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

export default async function ProfesionalDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  if ((session.user as { role?: string }).role !== "PROFESSIONAL") redirect("/")

  const pro = await prisma.professional.findUnique({
    where: { userId: session.user.id },
    select: { isVerified: true },
  })

  if (!pro) redirect("/profesional/onboarding")
  if (!pro.isVerified) redirect("/?pendingReview=1")

  return <>{children}</>
}
