"use client"

import { useState, useRef } from "react"
import { Pencil, X, Upload } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Props {
  firstName: string
  lastName: string
  avatarKey: string | null
  initials: string
}

export default function EditProfileModal({ firstName, lastName, avatarKey, initials }: Props) {
  const [open, setOpen] = useState(false)
  const [first, setFirst] = useState(firstName)
  const [last, setLast] = useState(lastName)
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    avatarKey ? `/api/avatar?key=${encodeURIComponent(avatarKey)}` : null
  )
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { update } = useSession()

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPendingFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  async function handleSave() {
    if (!first.trim() || !last.trim()) {
      toast.error("Nombre y apellido requeridos")
      return
    }
    setSaving(true)
    try {
      let newAvatarKey: string | undefined

      if (pendingFile) {
        const fd = new FormData()
        fd.append("file", pendingFile)
        const uploadRes = await fetch("/api/cliente/upload-avatar", { method: "POST", body: fd })
        if (!uploadRes.ok) {
          const err = await uploadRes.json()
          throw new Error(err.error ?? "Error subiendo imagen")
        }
        const { key } = await uploadRes.json()
        newAvatarKey = key
      }

      const res = await fetch("/api/cliente/perfil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: first.trim(),
          lastName: last.trim(),
          ...(newAvatarKey !== undefined ? { avatarUrl: newAvatarKey } : {}),
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "Error al guardar")
      }

      const newImageUrl = newAvatarKey ? `/api/avatar?key=${encodeURIComponent(newAvatarKey)}` : undefined
      if (newImageUrl !== undefined) await update({ image: newImageUrl })
      toast.success("Perfil actualizado")
      setOpen(false)
      router.refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-sm text-brand-gray hover:text-brand-violet transition-colors"
        aria-label="Editar perfil"
      >
        <Pencil size={14} />
        Editar
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md bg-brand-bg border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-brand-dark">Editar perfil</DialogTitle>
          </DialogHeader>

          {/* Avatar */}
          <div className="flex flex-col items-center gap-3 py-2">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-brand-violet text-white text-2xl font-bold flex items-center justify-center ring-4 ring-white shadow-md overflow-hidden select-none">
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewUrl} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-brand-violet text-white flex items-center justify-center shadow hover:opacity-90 transition-opacity"
                aria-label="Cambiar foto"
              >
                <Upload size={12} />
              </button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFile}
            />
            <p className="text-xs text-brand-gray">JPG, PNG o WebP · máx 5 MB</p>
          </div>

          {/* Nombre */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="firstName" className="text-xs text-brand-gray">Nombre</Label>
              <Input
                id="firstName"
                value={first}
                onChange={(e) => setFirst(e.target.value)}
                className="bg-white border-gray-200 text-brand-dark"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lastName" className="text-xs text-brand-gray">Apellido</Label>
              <Input
                id="lastName"
                value={last}
                onChange={(e) => setLast(e.target.value)}
                className="bg-white border-gray-200 text-brand-dark"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-brand-green text-white hover:opacity-90"
            >
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
