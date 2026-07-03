# Servicios Profesional Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a PROFESSIONAL user create, edit, activate/deactivate, and delete their own service posts (title, price, duration, modality, image) from `/profesional/servicios`.

**Architecture:** Standard Next.js App Router CRUD — API routes under `app/api/profesional/servicios/` backed by the existing Prisma `Service` model, a server-rendered list page that fetches services and renders client components for the create/edit dialog and per-card actions. Images upload to R2 (existing `lib/r2.ts`) and are served back through the existing generic `/api/avatar?key=` route.

**Tech Stack:** Next.js App Router, Prisma, TypeScript, TailwindCSS, shadcn/ui (Dialog, Button, Input, Label, Badge, Card), sonner (toast), lucide-react icons.

## Global Constraints

- Never touch the database, Prisma schema, or run Prisma commands — `Service` model already has every field needed (title, description, price, currency, durationMin, imageUrl, modality, categoryId, isActive).
- Every mutation: `console.error` server-side on catch, toast (sonner) client-side on failure — never fail silently.
- shadcn/ui + TailwindCSS only, brand tokens (`brand-green`, `brand-violet`, `brand-dark`, `brand-gray`, `brand-bg`), no hardcoded hex, no raw CSS.
- Mobile-first (375px) and desktop (1280px) responsive.
- No file over 500 lines — split components if it grows past that.
- No test runner configured in this repo (no jest/vitest/playwright script) — verification is via `npx tsc --noEmit`, manual `curl` against the dev server, and a manual browser pass at the end. Do not add a test framework.

---

### Task 1: GET/POST `/api/profesional/servicios`

**Files:**
- Create: `app/api/profesional/servicios/route.ts`

**Interfaces:**
- Consumes: `auth()` from `@/lib/auth`, `prisma` from `@/lib/prisma`.
- Produces: `GET` returns `Service[]` (all fields, ordered `createdAt desc`) for the signed-in professional. `POST` accepts `{ title: string, description?: string, price: number, durationMin?: number, modality?: "ONLINE"|"IN_PERSON"|"HYBRID", categoryId?: string, imageUrl?: string }` and returns the created `Service`. Later tasks (2, 4, 6) call these two endpoints by these exact shapes.

- [ ] **Step 1: Write the route**

```typescript
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function getOwnProfessionalId(userId: string) {
  const pro = await prisma.professional.findUnique({ where: { userId }, select: { id: true } })
  return pro?.id ?? null
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PROFESSIONAL") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const professionalId = await getOwnProfessionalId(session.user.id)
  if (!professionalId) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 })

  const services = await prisma.service.findMany({
    where: { professionalId },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(services)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PROFESSIONAL") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const professionalId = await getOwnProfessionalId(session.user.id)
  if (!professionalId) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 })

  const body = await req.json()
  const { title, description, price, durationMin, modality, categoryId, imageUrl } = body

  if (!title?.trim()) {
    return NextResponse.json({ error: "Título requerido" }, { status: 400 })
  }
  const priceNum = Number(price)
  if (!Number.isFinite(priceNum) || priceNum <= 0) {
    return NextResponse.json({ error: "Precio inválido" }, { status: 400 })
  }

  try {
    const service = await prisma.service.create({
      data: {
        professionalId,
        title: title.trim(),
        description: description?.trim() || null,
        price: priceNum,
        durationMin: durationMin ? Number(durationMin) : null,
        modality: modality || null,
        categoryId: categoryId || null,
        imageUrl: imageUrl || null,
      },
    })
    return NextResponse.json(service, { status: 201 })
  } catch (e) {
    console.error("POST /api/profesional/servicios", e)
    return NextResponse.json({ error: "Error al crear servicio" }, { status: 500 })
  }
}
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit`
Expected: no errors referencing `app/api/profesional/servicios/route.ts`

- [ ] **Step 3: Manual check against running dev server**

Run: `curl -i http://localhost:3000/api/profesional/servicios`
Expected: `401` JSON `{"error":"No autorizado"}` (no session cookie sent) — confirms route is wired and guarded.

- [ ] **Step 4: Commit**

```bash
git add app/api/profesional/servicios/route.ts
git commit -m "feat: add GET/POST endpoint for professional services"
```

---

### Task 2: PATCH/DELETE `/api/profesional/servicios/[id]`

**Files:**
- Create: `app/api/profesional/servicios/[id]/route.ts`

**Interfaces:**
- Consumes: same auth/professional lookup pattern as Task 1.
- Produces: `PATCH` accepts a partial subset of `{ title, description, price, durationMin, modality, categoryId, imageUrl, isActive }` and returns the updated `Service`. `DELETE` returns `{ ok: true }`. Both 404 if the service doesn't belong to the signed-in professional. Task 4 (form dialog, edit mode) and Task 5 (card actions) call these by these exact shapes.

- [ ] **Step 1: Write the route**

```typescript
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function getOwnService(userId: string, serviceId: string) {
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: { professional: { select: { userId: true } } },
  })
  if (!service || service.professional.userId !== userId) return null
  return service
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PROFESSIONAL") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { id } = await params
  const existing = await getOwnService(session.user.id, id)
  if (!existing) return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 })

  const body = await req.json()
  const { title, description, price, durationMin, modality, categoryId, imageUrl, isActive } = body

  if (title !== undefined && !title?.trim()) {
    return NextResponse.json({ error: "Título requerido" }, { status: 400 })
  }
  if (price !== undefined && (!Number.isFinite(Number(price)) || Number(price) <= 0)) {
    return NextResponse.json({ error: "Precio inválido" }, { status: 400 })
  }

  try {
    const data: Record<string, unknown> = {}
    if (title !== undefined) data.title = title.trim()
    if (description !== undefined) data.description = description?.trim() || null
    if (price !== undefined) data.price = Number(price)
    if (durationMin !== undefined) data.durationMin = durationMin ? Number(durationMin) : null
    if (modality !== undefined) data.modality = modality || null
    if (categoryId !== undefined) data.categoryId = categoryId || null
    if (imageUrl !== undefined) data.imageUrl = imageUrl || null
    if (isActive !== undefined) data.isActive = Boolean(isActive)

    const service = await prisma.service.update({ where: { id }, data })
    return NextResponse.json(service)
  } catch (e) {
    console.error("PATCH /api/profesional/servicios/[id]", e)
    return NextResponse.json({ error: "Error al guardar" }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PROFESSIONAL") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { id } = await params
  const existing = await getOwnService(session.user.id, id)
  if (!existing) return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 })

  try {
    await prisma.service.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("DELETE /api/profesional/servicios/[id]", e)
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 })
  }
}
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit`
Expected: no errors referencing `app/api/profesional/servicios/[id]/route.ts`

- [ ] **Step 3: Manual check**

Run: `curl -i -X PATCH http://localhost:3000/api/profesional/servicios/does-not-exist -d '{}' -H "Content-Type: application/json"`
Expected: `401` (no session) — confirms guard order runs before lookup.

- [ ] **Step 4: Commit**

```bash
git add "app/api/profesional/servicios/[id]/route.ts"
git commit -m "feat: add PATCH/DELETE endpoint for a single service"
```

---

### Task 3: Upload image endpoint

**Files:**
- Create: `app/api/profesional/servicios/upload-image/route.ts`

**Interfaces:**
- Consumes: `uploadFile` from `@/lib/r2`, `auth` from `@/lib/auth`.
- Produces: `POST` (multipart `file` field) returns `{ key: string }`. Task 4's form dialog uses this key as `imageUrl` when creating/editing a service; the key is later rendered as `/api/avatar?key=${encodeURIComponent(key)}`.

- [ ] **Step 1: Write the route (mirrors `app/api/profesional/upload-avatar/route.ts`)**

```typescript
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { uploadFile } from "@/lib/r2"
import { randomUUID } from "crypto"

const MAX_BYTES = 5 * 1024 * 1024

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PROFESSIONAL") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "Archivo requerido" }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Máximo 5 MB" }, { status: 400 })

  const allowed = ["image/jpeg", "image/png", "image/webp"]
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: "Formato no permitido" }, { status: 400 })
  }

  const ext = file.type.split("/")[1]
  const key = `profesionales/servicios/${session.user.id}/${randomUUID()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  await uploadFile(key, buffer, file.type)
  return NextResponse.json({ key })
}
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit`
Expected: no errors referencing this file.

- [ ] **Step 3: Manual check**

Run: `curl -i -X POST http://localhost:3000/api/profesional/servicios/upload-image`
Expected: `401` (no session, no role) — confirms guard runs.

- [ ] **Step 4: Commit**

```bash
git add app/api/profesional/servicios/upload-image/route.ts
git commit -m "feat: add service image upload endpoint"
```

---

### Task 4: `ServiceFormDialog` component

**Files:**
- Create: `components/profesionales/ServiceFormDialog.tsx`

**Interfaces:**
- Consumes: shadcn `Dialog`/`DialogContent` (`@/components/ui/dialog`), `Button` (`@/components/ui/button`), `Input` (`@/components/ui/input`), `Label` (`@/components/ui/label`), `toast` from `sonner`. Fetches `GET /api/categorias` for the category `<select>` (same endpoint Navbar already uses, shape `{id,name,slug}[]`). Calls `POST /api/profesional/servicios` (create) or `PATCH /api/profesional/servicios/:id` (edit) from Task 1/2. Calls `POST /api/profesional/servicios/upload-image` from Task 3.
- Produces: `<ServiceFormDialog open, onOpenChange, service?, onSaved>` — `service` prop (optional) is the full `Service` row from Prisma when editing, `undefined` when creating. `onSaved()` callback fires after a successful create/edit so the parent page can `router.refresh()`. Task 6 (page) renders this and Task 5 (card) triggers it in edit mode.

- [ ] **Step 1: Write the component**

```tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, Upload } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Category = { id: string; name: string; slug: string }

type Service = {
  id: string
  title: string
  description: string | null
  price: unknown
  durationMin: number | null
  modality: "ONLINE" | "IN_PERSON" | "HYBRID" | null
  categoryId: string | null
  imageUrl: string | null
}

export function ServiceFormDialog({
  open,
  onOpenChange,
  service,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  service?: Service
  onSaved: () => void
}) {
  const router = useRouter()
  const isEdit = !!service

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [durationMin, setDurationMin] = useState("")
  const [modality, setModality] = useState<string>("")
  const [categoryId, setCategoryId] = useState<string>("")
  const [imageUrl, setImageUrl] = useState<string>("")
  const [categories, setCategories] = useState<Category[]>([])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setTitle(service?.title ?? "")
    setDescription(service?.description ?? "")
    setPrice(service ? String(service.price) : "")
    setDurationMin(service?.durationMin ? String(service.durationMin) : "")
    setModality(service?.modality ?? "")
    setCategoryId(service?.categoryId ?? "")
    setImageUrl(service?.imageUrl ?? "")
  }, [open, service])

  useEffect(() => {
    fetch("/api/categorias")
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {})
  }, [])

  async function handleImageUpload(file: File) {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/profesional/servicios/upload-image", { method: "POST", body: formData })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        toast.error(data?.error ?? "No se pudo subir la imagen")
        return
      }
      setImageUrl(data.key)
      toast.success("Imagen subida")
    } catch {
      toast.error("No se pudo subir la imagen")
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit() {
    if (!title.trim()) {
      toast.error("Título requerido")
      return
    }
    if (!price || Number(price) <= 0) {
      toast.error("Precio inválido")
      return
    }

    setSaving(true)
    try {
      const payload = {
        title,
        description: description || undefined,
        price: Number(price),
        durationMin: durationMin ? Number(durationMin) : undefined,
        modality: modality || undefined,
        categoryId: categoryId || undefined,
        imageUrl: imageUrl || undefined,
      }
      const res = await fetch(
        isEdit ? `/api/profesional/servicios/${service!.id}` : "/api/profesional/servicios",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      )
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        toast.error(data?.error ?? "Error al guardar")
        return
      }
      toast.success(isEdit ? "Servicio actualizado" : "Servicio creado")
      onOpenChange(false)
      onSaved()
      router.refresh()
    } catch {
      toast.error("Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <h2 className="text-lg font-bold text-brand-dark font-display">
          {isEdit ? "Editar servicio" : "Nuevo servicio"}
        </h2>

        <div className="flex flex-col gap-3 mt-2">
          <div>
            <Label htmlFor="title">Título</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div>
            <Label htmlFor="description">Descripción</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full min-h-20 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-violet/30 focus:border-brand-violet"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="price">Precio (ARS)</Label>
              <Input id="price" type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="durationMin">Duración (min)</Label>
              <Input id="durationMin" type="number" min="0" value={durationMin} onChange={(e) => setDurationMin(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="modality">Modalidad</Label>
              <select
                id="modality"
                value={modality}
                onChange={(e) => setModality(e.target.value)}
                className="w-full h-9 rounded-md border border-gray-200 bg-white px-3 text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-violet/30 focus:border-brand-violet"
              >
                <option value="">Sin especificar</option>
                <option value="ONLINE">Online</option>
                <option value="IN_PERSON">Presencial</option>
                <option value="HYBRID">Híbrido</option>
              </select>
            </div>
            <div>
              <Label htmlFor="categoryId">Categoría</Label>
              <select
                id="categoryId"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full h-9 rounded-md border border-gray-200 bg-white px-3 text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-violet/30 focus:border-brand-violet"
              >
                <option value="">Sin categoría</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label>Imagen</Label>
            <div className="flex items-center gap-3">
              {imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/api/avatar?key=${encodeURIComponent(imageUrl)}`}
                  alt=""
                  className="w-14 h-14 rounded-lg object-cover border border-gray-200"
                />
              )}
              <label className="flex items-center gap-2 text-sm text-brand-violet cursor-pointer hover:opacity-80">
                {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                {uploading ? "Subiendo..." : "Subir imagen"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleImageUpload(file)
                  }}
                />
              </label>
            </div>
          </div>

          <Button onClick={handleSubmit} disabled={saving || uploading} className="bg-brand-green text-white hover:opacity-90 mt-2">
            {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear servicio"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit`
Expected: no errors referencing `components/profesionales/ServiceFormDialog.tsx`

- [ ] **Step 3: Commit**

```bash
git add components/profesionales/ServiceFormDialog.tsx
git commit -m "feat: add service create/edit form dialog"
```

---

### Task 5: `ServiceCard` component

**Files:**
- Create: `components/profesionales/ServiceCard.tsx`

**Interfaces:**
- Consumes: `Badge` (`@/components/ui/badge`), `Button` (`@/components/ui/button`), `toast` from `sonner`, `DropdownMenu*` (`@/components/ui/dropdown-menu`). Calls `PATCH`/`DELETE /api/profesional/servicios/:id` from Task 2.
- Produces: `<ServiceCard service, onEdit, onChanged>` — `onEdit(service)` opens the edit dialog (Task 4) in the parent; `onChanged()` tells the parent to refresh the list after toggle/delete. Task 6 (page) renders one `ServiceCard` per service.

- [ ] **Step 1: Write the component**

```tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { MoreVertical, Pencil, Trash2, Power } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type Service = {
  id: string
  title: string
  description: string | null
  price: unknown
  durationMin: number | null
  modality: "ONLINE" | "IN_PERSON" | "HYBRID" | null
  imageUrl: string | null
  isActive: boolean
}

const MODALIDAD_LABEL: Record<string, string> = {
  ONLINE: "Online",
  IN_PERSON: "Presencial",
  HYBRID: "Híbrido",
}

export function ServiceCard({
  service,
  onEdit,
  onChanged,
}: {
  service: Service
  onEdit: (service: Service) => void
  onChanged: () => void
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function toggleActive() {
    setBusy(true)
    try {
      const res = await fetch(`/api/profesional/servicios/${service.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !service.isActive }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        toast.error(data?.error ?? "No se pudo actualizar")
        return
      }
      toast.success(service.isActive ? "Servicio desactivado" : "Servicio activado")
      onChanged()
      router.refresh()
    } catch {
      toast.error("No se pudo actualizar")
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    if (!confirm("¿Eliminar este servicio? Esta acción no se puede deshacer.")) return
    setBusy(true)
    try {
      const res = await fetch(`/api/profesional/servicios/${service.id}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        toast.error(data?.error ?? "No se pudo eliminar")
        return
      }
      toast.success("Servicio eliminado")
      onChanged()
      router.refresh()
    } catch {
      toast.error("No se pudo eliminar")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-2xl bg-brand-bg border border-gray-200 overflow-hidden flex flex-col">
      <div className="aspect-video bg-gray-200 relative">
        {service.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/avatar?key=${encodeURIComponent(service.imageUrl)}`}
            alt={service.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute top-2 right-2">
          <Badge className={service.isActive ? "bg-brand-green text-white" : "bg-gray-400 text-white"}>
            {service.isActive ? "Activo" : "Inactivo"}
          </Badge>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-1 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-brand-dark text-sm leading-snug">{service.title}</h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button disabled={busy} className="text-brand-gray hover:text-brand-dark shrink-0" aria-label="Opciones">
                <MoreVertical size={18} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white border-gray-200">
              <DropdownMenuItem onClick={() => onEdit(service)} className="cursor-pointer gap-2 text-brand-dark">
                <Pencil size={14} /> Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={toggleActive} className="cursor-pointer gap-2 text-brand-dark">
                <Power size={14} /> {service.isActive ? "Desactivar" : "Activar"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="cursor-pointer gap-2 text-red-600 focus:text-red-600">
                <Trash2 size={14} /> Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {service.description && (
          <p className="text-brand-gray text-xs line-clamp-2">{service.description}</p>
        )}

        <div className="mt-auto pt-2 flex items-center justify-between text-sm">
          <span className="font-bold text-brand-dark">${String(service.price)}</span>
          <div className="flex items-center gap-2 text-brand-gray text-xs">
            {service.durationMin && <span>{service.durationMin} min</span>}
            {service.modality && <span>{MODALIDAD_LABEL[service.modality]}</span>}
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit`
Expected: no errors referencing `components/profesionales/ServiceCard.tsx`

- [ ] **Step 3: Commit**

```bash
git add components/profesionales/ServiceCard.tsx
git commit -m "feat: add service card with edit/toggle/delete actions"
```

---

### Task 6: Servicios page

**Files:**
- Create: `app/(dashboard)/profesional/servicios/page.tsx`

**Interfaces:**
- Consumes: `auth()` (`@/lib/auth`), `prisma` (`@/lib/prisma`), `ServiceFormDialog` (Task 4), `ServiceCard` (Task 5).
- Produces: the page rendered at `/profesional/servicios` (the route already linked from `components/layout/Navbar.tsx:85-88`).

- [ ] **Step 1: Write a client list component that fetches and renders**

Create `components/profesionales/ServicesList.tsx`:

```tsx
"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ServiceCard } from "@/components/profesionales/ServiceCard"
import { ServiceFormDialog } from "@/components/profesionales/ServiceFormDialog"

type Service = {
  id: string
  title: string
  description: string | null
  price: unknown
  durationMin: number | null
  modality: "ONLINE" | "IN_PERSON" | "HYBRID" | null
  categoryId: string | null
  imageUrl: string | null
  isActive: boolean
}

export function ServicesList({ initialServices }: { initialServices: Service[] }) {
  const [services, setServices] = useState(initialServices)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Service | undefined>(undefined)

  async function refetch() {
    const res = await fetch("/api/profesional/servicios")
    if (res.ok) setServices(await res.json())
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-brand-dark font-display">Mis servicios</h1>
        <Button
          onClick={() => { setEditing(undefined); setDialogOpen(true) }}
          className="bg-brand-green text-white hover:opacity-90 gap-2"
        >
          <Plus size={16} /> Nuevo servicio
        </Button>
      </div>

      {services.length === 0 ? (
        <p className="text-brand-gray text-sm">Todavía no creaste ningún servicio.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((s) => (
            <ServiceCard
              key={s.id}
              service={s}
              onEdit={(svc) => { setEditing(svc); setDialogOpen(true) }}
              onChanged={refetch}
            />
          ))}
        </div>
      )}

      <ServiceFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        service={editing}
        onSaved={refetch}
      />
    </div>
  )
}
```

- [ ] **Step 2: Write the server page**

```tsx
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { ServicesList } from "@/components/profesionales/ServicesList"

export default async function ProfesionalServiciosPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  if ((session.user as { role?: string }).role !== "PROFESSIONAL") redirect("/")

  const professional = await prisma.professional.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })
  if (!professional) redirect("/profesional/onboarding")

  const services = await prisma.service.findMany({
    where: { professionalId: professional.id },
    orderBy: { createdAt: "desc" },
  })

  return <ServicesList initialServices={JSON.parse(JSON.stringify(services))} />
}
```

- [ ] **Step 3: Verify types compile**

Run: `npx tsc --noEmit`
Expected: no errors referencing `app/(dashboard)/profesional/servicios/page.tsx` or `components/profesionales/ServicesList.tsx`

- [ ] **Step 4: Manual browser verification**

Run: `npm run dev` (if not already running), then in browser log in as a PROFESSIONAL user and visit `http://localhost:3000/profesional/servicios`.
Expected: page loads (no 404), "Nuevo servicio" button opens the dialog, creating a service shows it in the grid, editing/toggling/deleting all show a toast and update the grid.

- [ ] **Step 5: Commit**

```bash
git add "app/(dashboard)/profesional/servicios/page.tsx" components/profesionales/ServicesList.tsx
git commit -m "feat: add servicios page for professionals"
```

---

## Self-Review Notes

- Spec coverage: CRUD (Task 1, 2) ✓, image upload (Task 3) ✓, form UI (Task 4) ✓, card with edit/toggle/delete (Task 5) ✓, page wiring at existing Navbar route (Task 6) ✓, ownership checks in every mutation (Tasks 1, 2, 5) ✓, error toast + console.error on every mutation (Tasks 1, 2, 4, 5) ✓, brand tokens only (all components) ✓, no DB/schema changes ✓.
- Type consistency: `Service` shape (`id, title, description, price, durationMin, modality, categoryId, imageUrl, isActive`) used identically across Tasks 4, 5, 6. Endpoint paths (`/api/profesional/servicios`, `/api/profesional/servicios/:id`, `/api/profesional/servicios/upload-image`) match between Tasks 1/2/3 and their consumers in 4/5.
- No placeholders remain — every step has runnable code or an exact command.
