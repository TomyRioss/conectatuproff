"use client"

import { use, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { PortfolioForm } from "@/components/profesionales/PortfolioForm"

export default function NewPortfolioItemPage({
  params,
}: {
  params: Promise<{ handle: string }>
}) {
  const { handle } = use(params)
  const router = useRouter()
  const { data: session, status } = useSession()
  const role = (session?.user as { role?: string } | undefined)?.role
  const authorized = status !== "loading" && !!session?.user?.id && role === "PROFESSIONAL"

  useEffect(() => {
    if (status !== "loading" && !authorized) {
      router.replace(`/${handle}/portfolio`)
    }
  }, [status, authorized, handle, router])

  if (!authorized) return null

  return (
    <main className="min-h-screen bg-brand-bg">
      <div className="max-w-5xl mx-auto px-6 sm:px-10 py-10">
        <PortfolioForm onSaved={() => router.push(`/${handle}/portfolio`)} />
      </div>
    </main>
  )
}
