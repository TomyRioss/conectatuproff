"use client"

import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { Loader2, ShieldCheck } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

type DniStatus = "NONE" | "PENDING" | "APPROVED" | "REJECTED"

const STATUS_LABEL: Record<DniStatus, string> = {
  NONE: "Sin enviar",
  PENDING: "En revisión",
  APPROVED: "Verificado",
  REJECTED: "Rechazado",
}

const STATUS_CLASS: Record<DniStatus, string> = {
  NONE: "bg-brand-bg text-brand-gray border border-gray-200",
  PENDING: "bg-brand-violet/10 text-brand-violet",
  APPROVED: "bg-brand-green/10 text-brand-green",
  REJECTED: "bg-red-50 text-red-600",
}

export default function ConfiguracionForm() {
  const [loading, setLoading] = useState(true)
  const [hasPassword, setHasPassword] = useState(true)
  const [dniStatus, setDniStatus] = useState<DniStatus>("NONE")

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [savingPassword, setSavingPassword] = useState(false)

  const [front, setFront] = useState<File | null>(null)
  const [back, setBack] = useState<File | null>(null)
  const [sendingDni, setSendingDni] = useState(false)
  const frontRef = useRef<HTMLInputElement>(null)
  const backRef = useRef<HTMLInputElement>(null)

  async function load() {
    try {
      const res = await fetch("/api/configuracion")
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Error al cargar la configuración"); return }
      setHasPassword(data.hasPassword)
      setDniStatus(data.dniStatus)
    } catch {
      toast.error("Error al cargar la configuración")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const t = setTimeout(load, 0)
    return () => clearTimeout(t)
  }, [])

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword.length < 8) { toast.error("La nueva contraseña necesita mínimo 8 caracteres"); return }
    if (newPassword !== confirmPassword) { toast.error("Las contraseñas no coinciden"); return }
    setSavingPassword(true)
    try {
      const res = await fetch("/api/configuracion/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Error al cambiar la contraseña"); return }
      toast.success("Contraseña actualizada")
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("")
      setHasPassword(true)
    } catch {
      toast.error("Error al cambiar la contraseña")
    } finally {
      setSavingPassword(false)
    }
  }

  async function uploadSide(file: File, side: "front" | "back"): Promise<string> {
    const res = await fetch(`/api/configuracion/upload-url?side=${side}&contentType=${encodeURIComponent(file.type)}`)
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? "No se pudo preparar la subida")
    const put = await fetch(data.uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } })
    if (!put.ok) throw new Error("Error al subir la imagen")
    return data.key as string
  }

  async function submitDni(e: React.FormEvent) {
    e.preventDefault()
    if (!front || !back) { toast.error("Subí ambas fotos del DNI (frente y dorso)"); return }
    setSendingDni(true)
    try {
      const [frontKey, backKey] = await Promise.all([uploadSide(front, "front"), uploadSide(back, "back")])
      const res = await fetch("/api/configuracion/dni", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frontKey, backKey }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Error al enviar la documentación"); return }
      toast.success("Documentación enviada. La vamos a revisar pronto.")
      setDniStatus("PENDING")
      setFront(null); setBack(null)
      if (frontRef.current) frontRef.current.value = ""
      if (backRef.current) backRef.current.value = ""
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al enviar la documentación")
    } finally {
      setSendingDni(false)
    }
  }

  const canSendDni = dniStatus === "NONE" || dniStatus === "REJECTED"

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-brand-dark">Configuración</h1>
        <p className="text-sm text-brand-gray mt-1">
          Ajustes de tu cuenta. Aplican a tu perfil de cliente y de profesional.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-brand-gray flex items-center gap-2">
          <Loader2 size={14} className="animate-spin" /> Cargando...
        </p>
      ) : (
        <>
          <Card className="bg-brand-bg">
            <CardHeader>
              <CardTitle className="text-lg">Contraseña</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitPassword} className="flex flex-col gap-4">
                {hasPassword && (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="currentPassword">Contraseña actual</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      autoComplete="current-password"
                    />
                  </div>
                )}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="newPassword">Nueva contraseña</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="confirmPassword">Repetir nueva contraseña</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
                <Button type="submit" disabled={savingPassword} className="self-start bg-brand-green hover:bg-brand-green/90">
                  {savingPassword && <Loader2 size={14} className="animate-spin mr-1.5" />}
                  Guardar contraseña
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-brand-bg">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-lg">Documentación (DNI)</CardTitle>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${STATUS_CLASS[dniStatus]}`}>
                  {STATUS_LABEL[dniStatus]}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {dniStatus === "APPROVED" ? (
                <p className="text-sm text-brand-dark flex items-center gap-2">
                  <ShieldCheck size={16} className="text-brand-green" />
                  Tu identidad ya fue verificada.
                </p>
              ) : dniStatus === "PENDING" ? (
                <p className="text-sm text-brand-gray">
                  Recibimos tu documentación. Te avisamos cuando termine la revisión.
                </p>
              ) : (
                <form onSubmit={submitDni} className="flex flex-col gap-4">
                  {dniStatus === "REJECTED" && (
                    <p className="text-sm text-red-600">
                      Tu documentación anterior fue rechazada. Subí fotos nítidas y volvé a enviarla.
                    </p>
                  )}
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="dniFront">Foto del frente</Label>
                    <Input
                      id="dniFront"
                      ref={frontRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFront(e.target.files?.[0] ?? null)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="dniBack">Foto del dorso</Label>
                    <Input
                      id="dniBack"
                      ref={backRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => setBack(e.target.files?.[0] ?? null)}
                    />
                  </div>
                  <Button type="submit" disabled={sendingDni || !canSendDni} className="self-start bg-brand-green hover:bg-brand-green/90">
                    {sendingDni && <Loader2 size={14} className="animate-spin mr-1.5" />}
                    Enviar documentación
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
