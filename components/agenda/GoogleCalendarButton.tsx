"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { CalendarCheck2, Unlink } from "lucide-react"

export default function GoogleCalendarButton({ initialConnected }: { initialConnected: boolean }) {
  const [connected, setConnected] = useState(initialConnected)
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const google = searchParams.get("google")
    if (google === "connected") {
      toast.success("Google Calendar conectado")
      setConnected(true)
      router.replace("/profesional/agenda")
    } else if (google === "error") {
      toast.error("No se pudo conectar Google Calendar")
      router.replace("/profesional/agenda")
    }
  }, [searchParams, router])

  const disconnect = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/profesional/google-calendar/disconnect", { method: "POST" })
      if (!res.ok) throw new Error()
      setConnected(false)
      toast.success("Google Calendar desconectado")
    } catch {
      toast.error("Error al desconectar Google Calendar")
    } finally {
      setLoading(false)
    }
  }

  if (connected) {
    return (
      <Button variant="outline" size="sm" onClick={disconnect} disabled={loading}>
        <Unlink className="h-4 w-4 mr-1.5" />
        Desconectar Google Calendar
      </Button>
    )
  }

  return (
    <Button asChild variant="outline" size="sm">
      <a href="/api/profesional/google-calendar/connect">
        <CalendarCheck2 className="h-4 w-4 mr-1.5" />
        Conectar Google Calendar
      </a>
    </Button>
  )
}
