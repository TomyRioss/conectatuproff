"use client"

import { usePathname } from "next/navigation"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isMensajes = pathname?.includes("/mensajes")

  return (
    <>
      <Navbar />
      <main className={isMensajes ? "h-[calc(100vh-5rem)] bg-brand-bg overflow-hidden" : "min-h-screen bg-brand-bg"}>
        {children}
      </main>
      {!isMensajes && <Footer />}
    </>
  )
}
