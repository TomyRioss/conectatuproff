import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import ConfiguracionForm from "./ConfiguracionForm"

export default async function ConfiguracionPage() {
  const session = await auth()
  const role = (session?.user as { role?: string })?.role
  if (!session?.user?.id) redirect("/login")
  if (role !== "CLIENT" && role !== "PROFESSIONAL") redirect("/")

  return <ConfiguracionForm />
}
