"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import { Pencil, Upload, MapPin, Phone, Mail, Share2, Check, ExternalLink, ImageUp, Crop, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import SpecialtyAutocomplete from "@/components/auth/SpecialtyAutocomplete"
import { AvatarCropDialog } from "@/components/profesionales/AvatarCropDialog"

interface Props {
  username: string
  firstName: string
  lastName: string
  specialty: string | null
  location: string | null
  phone: string | null
  email: string
  avatarUrl: string | null
  bio: string | null
}

export function CompactProfileHeader({
  username,
  firstName,
  lastName,
  specialty,
  location,
  phone,
  email,
  avatarUrl,
  bio,
}: Props) {
  const [open, setOpen] = useState(false)
  const [first, setFirst] = useState(firstName)
  const [last, setLast] = useState(lastName)
  const [tagline, setTagline] = useState(specialty ?? "")
  const [loc, setLoc] = useState(location ?? "")
  const [tel, setTel] = useState(phone ?? "")
  const [about, setAbout] = useState(bio ?? "")
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    avatarUrl ? `/api/avatar?key=${encodeURIComponent(avatarUrl)}` : null
  )
  const [saving, setSaving] = useState(false)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { update: updateSession } = useSession()

  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase()
  const fullName = `${firstName} ${lastName}`

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setCropSrc(URL.createObjectURL(file))
    e.target.value = ""
  }

  async function saveAvatarKey(key: string | null) {
    setSaving(true)
    try {
      const res = await fetch("/api/profesional/perfil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: key }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "Error al guardar")
      }
      await updateSession({ image: key ? `/api/avatar?key=${encodeURIComponent(key)}` : null })
      toast.success(key ? "Foto actualizada" : "Foto eliminada")
      router.refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al guardar la foto")
    } finally {
      setSaving(false)
    }
  }

  async function handleCropSaved(blob: Blob) {
    const file = new File([blob], "avatar.jpg", { type: blob.type })
    setPreviewUrl(URL.createObjectURL(blob))

    const fd = new FormData()
    fd.append("file", file)
    const uploadRes = await fetch("/api/profesional/upload-avatar", { method: "POST", body: fd })
    if (!uploadRes.ok) {
      const err = await uploadRes.json()
      toast.error(err.error ?? "Error subiendo imagen")
      return
    }
    const { key } = await uploadRes.json()
    await saveAvatarKey(key)
  }

  function handleDiscard() {
    setPreviewUrl(null)
    saveAvatarKey(null)
  }

  async function handleSave() {
    if (!first.trim() || !last.trim()) {
      toast.error("Nombre y apellido requeridos")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/profesional/perfil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: first.trim(),
          lastName: last.trim(),
          specialty: tagline.trim(),
          location: loc.trim(),
          phone: tel.trim(),
          bio: about.trim(),
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "Error al guardar")
      }

      toast.success("Perfil actualizado")
      setOpen(false)
      router.refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  async function handleShare() {
    const url = `${window.location.origin}/perfil/profesional/${username}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("No se pudo copiar el link")
    }
  }

  return (
    <div>
      <div className="w-full max-w-6xl mx-auto px-6 sm:px-10 pt-8 pb-8 flex flex-col sm:flex-row sm:items-start justify-between gap-6">
      <div className="flex items-center gap-6">
        <div className="relative shrink-0">
          <Avatar className="h-32 w-32 sm:h-36 sm:w-36">
            {previewUrl && <AvatarImage src={previewUrl} alt={fullName} />}
            <AvatarFallback className="bg-brand-violet text-white text-4xl font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow cursor-pointer hover:bg-brand-bg transition-colors"
                aria-label="Cambiar foto"
              >
                <Upload size={18} className="text-brand-gray" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => fileRef.current?.click()}>
                <ImageUp size={14} />
                Subir imagen
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer gap-2"
                disabled={!previewUrl}
                onClick={() => previewUrl && setCropSrc(previewUrl)}
              >
                <Crop size={14} />
                Editar
              </DropdownMenuItem>
              {previewUrl && (
                <DropdownMenuItem className="cursor-pointer gap-2 text-red-600" onClick={handleDiscard}>
                  <Trash2 size={14} />
                  Descartar imagen
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFile}
          />
        </div>

        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-3xl font-bold text-brand-dark">{fullName}</h1>
            <button onClick={() => setOpen(true)} aria-label="Editar nombre">
              <Pencil size={18} className="text-brand-gray hover:text-brand-violet transition-colors" />
            </button>
            <span className="text-brand-gray text-sm">@{username}</span>
          </div>

          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 mt-1 text-left"
            aria-label="Editar especialidad"
          >
            <p className="text-brand-dark text-base font-medium">{specialty || "Agregá tu especialidad"}</p>
            <Pencil size={14} className="text-brand-gray" />
          </button>

          <div className="flex items-center gap-5 mt-2 flex-wrap">
            <button
              onClick={() => setOpen(true)}
              className="flex items-center gap-1.5 text-base text-brand-gray"
              aria-label="Editar ubicación"
            >
              <MapPin size={18} />
              <span>{location || "Sin ubicación"}</span>
            </button>
            <button
              onClick={() => setOpen(true)}
              className="flex items-center gap-1.5 text-base text-brand-gray"
              aria-label="Editar teléfono"
            >
              {phone ? <Phone size={18} /> : <Mail size={18} />}
              <span>{phone || email}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <Button variant="outline" onClick={handleShare} className="gap-1.5 text-base h-10 px-4">
          {copied ? <Check size={16} /> : <Share2 size={16} />}
          {copied ? "Copiado" : "Compartir"}
        </Button>
        <Link href={`/perfil/profesional/${username}`} target="_blank">
          <Button variant="outline" className="gap-1.5 text-base h-10 px-4">
            <ExternalLink size={16} />
            Vista previa
          </Button>
        </Link>
      </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md bg-brand-bg border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-brand-dark">Editar perfil</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center gap-3 py-2">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-brand-violet text-white text-xl font-bold flex items-center justify-center ring-4 ring-white shadow-md overflow-hidden select-none">
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewUrl} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-brand-violet text-white flex items-center justify-center shadow hover:opacity-90 transition-opacity"
                    aria-label="Cambiar foto"
                  >
                    <Upload size={12} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center">
                  <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => fileRef.current?.click()}>
                    <ImageUp size={14} />
                    Subir imagen
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer gap-2"
                    disabled={!previewUrl}
                    onClick={() => previewUrl && setCropSrc(previewUrl)}
                  >
                    <Crop size={14} />
                    Editar
                  </DropdownMenuItem>
                  {previewUrl && (
                    <DropdownMenuItem className="cursor-pointer gap-2 text-red-600" onClick={handleDiscard}>
                      <Trash2 size={14} />
                      Descartar imagen
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <p className="text-xs text-brand-gray">JPG, PNG o WebP · máx 5 MB</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="firstName" className="text-xs text-brand-gray">Nombre</Label>
              <Input id="firstName" value={first} onChange={(e) => setFirst(e.target.value)} className="bg-white border-gray-200 text-brand-dark" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lastName" className="text-xs text-brand-gray">Apellido</Label>
              <Input id="lastName" value={last} onChange={(e) => setLast(e.target.value)} className="bg-white border-gray-200 text-brand-dark" />
            </div>
          </div>

          <SpecialtyAutocomplete value={tagline} onChange={setTagline} />

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="location" className="text-xs text-brand-gray">Ubicación</Label>
              <Input id="location" value={loc} onChange={(e) => setLoc(e.target.value)} className="bg-white border-gray-200 text-brand-dark" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone" className="text-xs text-brand-gray">Teléfono</Label>
              <Input id="phone" value={tel} onChange={(e) => setTel(e.target.value)} className="bg-white border-gray-200 text-brand-dark" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bio" className="text-xs text-brand-gray">Biografía</Label>
            <Textarea id="bio" value={about} onChange={(e) => setAbout(e.target.value)} className="bg-white border-gray-200 text-brand-dark" rows={4} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-brand-green text-white hover:opacity-90">
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {cropSrc && (
        <AvatarCropDialog
          imageSrc={cropSrc}
          open={!!cropSrc}
          onOpenChange={(o) => !o && setCropSrc(null)}
          onSave={handleCropSaved}
        />
      )}
    </div>
  )
}
