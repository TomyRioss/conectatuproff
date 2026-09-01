import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import { guardProfileSetup } from "@/lib/guard-setup"

export default async function PerfilLayout({ children }: { children: React.ReactNode }) {
  await guardProfileSetup()

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-brand-bg">
        {children}
      </main>
      <Footer />
    </>
  )
}
