"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { CalendarCheck2, RefreshCw, Unlink } from "lucide-react"

export default function GoogleCalendarButton({ initialConnected }: { initialConnected: boolean }) {
  const [connected, setConnected] = useState(initialConnected)
  const [action, setAction] = useState<"sync" | "disconnect" | null>(null)
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const google = searchParams.get("google")
    if (google === "connected") {
      toast.success("Google Calendar conectado")
      const t = setTimeout(() => setConnected(true), 0)
      router.replace("/profesional/agenda")
      return () => clearTimeout(t)
    } else if (google === "error") {
      toast.error("No se pudo conectar Google Calendar")
      router.replace("/profesional/agenda")
    }
  }, [searchParams, router])

  const disconnect = async () => {
    setAction("disconnect")
    try {
      const res = await fetch("/api/profesional/google-calendar/disconnect", { method: "POST" })
      if (!res.ok) throw new Error()
      setConnected(false)
      toast.success("Google Calendar desconectado")
    } catch {
      toast.error("Error al desconectar Google Calendar")
    } finally {
      setAction(null)
    }
  }

  const syncAppointments = async () => {
    setAction("sync")
    try {
      const res = await fetch("/api/profesional/google-calendar/sync", { method: "POST" })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || "Error al actualizar los turnos")
      toast.success(
        `Google Calendar actualizado: ${result.created} turnos nuevos, ${result.updated} sincronizados y ${result.deleted} cancelados quitados`
      )
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al actualizar Google Calendar")
    } finally {
      setAction(null)
    }
  }

  if (connected) {
    return (
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
        <Button
          type="button"
          size="sm"
          onClick={syncAppointments}
          disabled={action !== null}
          className="min-h-[48px] w-full justify-center gap-1.5 bg-brand-violet text-white hover:opacity-90 sm:w-auto sm:min-h-0"
        >
          <RefreshCw className={`h-4 w-4 ${action === "sync" ? "animate-spin" : ""}`} />
          {action === "sync" ? "Actualizando turnos..." : "Actualizar turnos"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={disconnect}
          disabled={action !== null}
          className="min-h-[48px] w-full justify-center sm:w-auto sm:min-h-0"
        >
          <Unlink className="mr-1.5 h-4 w-4" />
          {action === "disconnect" ? "Desconectando..." : "Desconectar Google Calendar"}
        </Button>
      </div>
    )
  }

  return (
    <Button asChild variant="outline" size="sm" className="w-full sm:w-auto justify-center min-h-[48px] sm:min-h-0">
      {/* <a> intencional: es un endpoint de API que redirige al OAuth de Google. */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/api/profesional/google-calendar/connect">
        <CalendarCheck2 className="h-4 w-4 mr-1.5" />
        Conectar Google Calendar
      </a>
    </Button>
  )
}
