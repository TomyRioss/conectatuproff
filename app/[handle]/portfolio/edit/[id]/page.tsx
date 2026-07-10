"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { PortfolioForm, type PortfolioFormValue } from "@/components/profesionales/PortfolioForm"

export default function EditPortfolioItemPage({
  params,
}: {
  params: Promise<{ handle: string; id: string }>
}) {
  const { handle, id } = use(params)
  const router = useRouter()
  const { data: session, status } = useSession()
  const [item, setItem] = useState<PortfolioFormValue | null>(null)
  const [loading, setLoading] = useState(true)

  const role = (session?.user as { role?: string } | undefined)?.role

  useEffect(() => {
    if (status === "loading") return
    if (!session?.user?.id || role !== "PROFESSIONAL") {
      router.replace(`/${handle}/portfolio`)
      return
    }
    fetch("/api/profesional/portfolio")
      .then((r) => r.json())
      .then((items: PortfolioFormValue[]) => {
        const found = items.find((i) => i.id === id)
        if (!found) {
          router.replace(`/${handle}/portfolio`)
          return
        }
        setItem(found)
      })
      .finally(() => setLoading(false))
  }, [status, session, role, handle, id, router])

  if (status === "loading" || loading || !item) return null

  return (
    <main className="min-h-screen bg-brand-bg">
      <div className="max-w-5xl mx-auto px-6 sm:px-10 py-10">
        <PortfolioForm item={item} onSaved={() => router.push(`/${handle}/portfolio`)} />
      </div>
    </main>
  )
}
