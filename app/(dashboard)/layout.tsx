import DashboardShell from "@/components/layout/DashboardShell"
import { guardProfileSetup } from "@/lib/guard-setup"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await guardProfileSetup()
  return <DashboardShell>{children}</DashboardShell>
}
