# Owner Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build owner admin panel with sidebar navigation, categories CRUD (categories + subcategories), and users stub page.

**Architecture:** Server components for data fetching + client components for interactive CRUD. API routes protected by session role check. Sidebar lives in owner layout. Categories page manages categories and their subcategories inline.

**Tech Stack:** Next.js App Router, Prisma, shadcn/ui (dialog.tsx available), TailwindCSS, brand tokens.

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `app/owner/layout.tsx` | Modify | Add sidebar + main content wrapper |
| `components/owner/Sidebar.tsx` | Create | Left sidebar with nav links |
| `app/owner/page.tsx` | Modify | Redirect to /owner/categorias |
| `app/owner/categorias/page.tsx` | Create | Categories + subcategories CRUD UI |
| `app/owner/usuarios/page.tsx` | Create | Users list (stub) |
| `app/api/owner/categorias/route.ts` | Create | GET all categories, POST new category |
| `app/api/owner/categorias/[id]/route.ts` | Create | PUT rename, DELETE category |
| `app/api/owner/categorias/[id]/subcategorias/route.ts` | Create | GET subcats, POST new subcat |
| `app/api/owner/categorias/[id]/subcategorias/[subId]/route.ts` | Create | PUT rename, DELETE subcat |
| `lib/owner-auth.ts` | Create | Helper: verify OWNER/SUPER_ADMIN from request |

---

### Task 1: Auth helper for API routes

**Files:**
- Create: `lib/owner-auth.ts`

- [ ] Create `lib/owner-auth.ts`:

```typescript
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function requireOwner() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || (role !== "OWNER" && role !== "SUPER_ADMIN")) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { session };
}
```

---

### Task 2: Categories API — list + create

**Files:**
- Create: `app/api/owner/categorias/route.ts`

- [ ] Create `app/api/owner/categorias/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/owner-auth";
import slugify from "slugify";

export async function GET() {
  const { error } = await requireOwner();
  if (error) return error;

  const categories = await prisma.category.findMany({
    include: { subcategories: { orderBy: { name: "asc" } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(categories);
}

export async function POST(req: Request) {
  const { error } = await requireOwner();
  if (error) return error;

  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });

  const slug = slugify(name, { lower: true, strict: true });
  try {
    const category = await prisma.category.create({ data: { name: name.trim(), slug } });
    return NextResponse.json(category, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Ya existe una categoría con ese nombre" }, { status: 409 });
  }
}
```

- [ ] Check if `slugify` is installed:

```bash
npm ls slugify
```

If not found, install:
```bash
npm install slugify
```

---

### Task 3: Categories API — update + delete

**Files:**
- Create: `app/api/owner/categorias/[id]/route.ts`

- [ ] Create `app/api/owner/categorias/[id]/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/owner-auth";
import slugify from "slugify";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireOwner();
  if (error) return error;

  const { id } = await params;
  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });

  const slug = slugify(name, { lower: true, strict: true });
  try {
    const category = await prisma.category.update({
      where: { id },
      data: { name: name.trim(), slug },
    });
    return NextResponse.json(category);
  } catch {
    return NextResponse.json({ error: "No se pudo actualizar" }, { status: 409 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireOwner();
  if (error) return error;

  const { id } = await params;
  await prisma.category.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
```

---

### Task 4: Subcategories API — list + create

**Files:**
- Create: `app/api/owner/categorias/[id]/subcategorias/route.ts`

- [ ] Create `app/api/owner/categorias/[id]/subcategorias/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/owner-auth";
import slugify from "slugify";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireOwner();
  if (error) return error;

  const { id: categoryId } = await params;
  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });

  const slug = slugify(name, { lower: true, strict: true });
  try {
    const sub = await prisma.subcategory.create({
      data: { name: name.trim(), slug, categoryId },
    });
    return NextResponse.json(sub, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Ya existe esa subcategoría" }, { status: 409 });
  }
}
```

---

### Task 5: Subcategories API — update + delete

**Files:**
- Create: `app/api/owner/categorias/[id]/subcategorias/[subId]/route.ts`

- [ ] Create `app/api/owner/categorias/[id]/subcategorias/[subId]/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/owner-auth";
import slugify from "slugify";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; subId: string }> }
) {
  const { error } = await requireOwner();
  if (error) return error;

  const { subId } = await params;
  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });

  const slug = slugify(name, { lower: true, strict: true });
  try {
    const sub = await prisma.subcategory.update({
      where: { id: subId },
      data: { name: name.trim(), slug },
    });
    return NextResponse.json(sub);
  } catch {
    return NextResponse.json({ error: "No se pudo actualizar" }, { status: 409 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; subId: string }> }
) {
  const { error } = await requireOwner();
  if (error) return error;

  const { subId } = await params;
  await prisma.subcategory.delete({ where: { id: subId } });
  return NextResponse.json({ ok: true });
}
```

---

### Task 6: Sidebar component

**Files:**
- Create: `components/owner/Sidebar.tsx`

- [ ] Create `components/owner/Sidebar.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Users } from "lucide-react";

const links = [
  { href: "/owner/categorias", label: "Categorías", icon: LayoutGrid },
  { href: "/owner/usuarios", label: "Usuarios", icon: Users },
];

export default function OwnerSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 min-h-screen bg-brand-dark flex flex-col py-6 px-3 gap-1 shrink-0">
      <p className="text-white/40 text-xs font-semibold uppercase tracking-wider px-3 mb-3">
        Panel Owner
      </p>
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              active
                ? "bg-brand-green text-white"
                : "text-white/60 hover:text-white hover:bg-white/10"
            }`}
          >
            <Icon size={16} />
            {label}
          </Link>
        );
      })}
    </aside>
  );
}
```

---

### Task 7: Owner layout — add sidebar

**Files:**
- Modify: `app/owner/layout.tsx`

- [ ] Replace `app/owner/layout.tsx`:

```tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import OwnerSidebar from "@/components/owner/Sidebar";

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session) redirect("/owner/login");

  const role = (session.user as { role?: string }).role;
  if (role !== "OWNER" && role !== "SUPER_ADMIN") redirect("/");

  return (
    <div className="flex min-h-screen bg-brand-bg">
      <OwnerSidebar />
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
```

---

### Task 8: Owner home — redirect to categorías

**Files:**
- Modify: `app/owner/page.tsx`

- [ ] Replace `app/owner/page.tsx`:

```tsx
import { redirect } from "next/navigation";

export default function OwnerPage() {
  redirect("/owner/categorias");
}
```

---

### Task 9: Categories page (CRUD UI)

**Files:**
- Create: `app/owner/categorias/page.tsx`

This is a client component that fetches categories and manages CRUD via modals.

- [ ] Create `app/owner/categorias/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface Subcategory {
  id: string;
  name: string;
  slug: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  subcategories: Subcategory[];
}

export default function CategoriasPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [dialog, setDialog] = useState<{
    type: "cat-add" | "cat-edit" | "sub-add" | "sub-edit" | "cat-delete" | "sub-delete" | null;
    categoryId?: string;
    subId?: string;
    current?: string;
  }>({ type: null });
  const [inputVal, setInputVal] = useState("");
  const [saving, setSaving] = useState(false);

  async function fetchCategories() {
    const res = await fetch("/api/owner/categorias");
    if (!res.ok) { toast.error("Error al cargar categorías"); return; }
    setCategories(await res.json());
    setLoading(false);
  }

  useEffect(() => { fetchCategories(); }, []);

  function openDialog(type: typeof dialog.type, opts?: { categoryId?: string; subId?: string; current?: string }) {
    setDialog({ type, ...opts });
    setInputVal(opts?.current ?? "");
  }

  function closeDialog() {
    setDialog({ type: null });
    setInputVal("");
  }

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const { type, categoryId, subId } = dialog;
      let res: Response;

      if (type === "cat-add") {
        res = await fetch("/api/owner/categorias", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: inputVal }),
        });
      } else if (type === "cat-edit") {
        res = await fetch(`/api/owner/categorias/${categoryId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: inputVal }),
        });
      } else if (type === "sub-add") {
        res = await fetch(`/api/owner/categorias/${categoryId}/subcategorias`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: inputVal }),
        });
      } else if (type === "sub-edit") {
        res = await fetch(`/api/owner/categorias/${categoryId}/subcategorias/${subId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: inputVal }),
        });
      } else if (type === "cat-delete") {
        res = await fetch(`/api/owner/categorias/${categoryId}`, { method: "DELETE" });
      } else if (type === "sub-delete") {
        res = await fetch(`/api/owner/categorias/${categoryId}/subcategorias/${subId}`, { method: "DELETE" });
      } else { return; }

      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Error"); return; }

      toast.success("Guardado");
      await fetchCategories();
      closeDialog();
    } catch {
      toast.error("Error inesperado");
    } finally {
      setSaving(false);
    }
  }

  const isDelete = dialog.type === "cat-delete" || dialog.type === "sub-delete";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-brand-dark font-display">Categorías</h1>
        <button
          onClick={() => openDialog("cat-add")}
          className="flex items-center gap-2 bg-brand-green text-white px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <Plus size={16} /> Nueva categoría
        </button>
      </div>

      {loading ? (
        <p className="text-brand-gray text-sm">Cargando...</p>
      ) : categories.length === 0 ? (
        <p className="text-brand-gray text-sm">No hay categorías todavía.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {categories.map(cat => {
            const isOpen = expanded.has(cat.id);
            return (
              <div key={cat.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3">
                  <button
                    onClick={() => toggleExpand(cat.id)}
                    className="text-brand-gray hover:text-brand-dark transition-colors"
                  >
                    {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                  <span className="flex-1 font-medium text-brand-dark text-sm">{cat.name}</span>
                  <span className="text-xs text-brand-gray">{cat.subcategories.length} subcats</span>
                  <button
                    onClick={() => openDialog("cat-edit", { categoryId: cat.id, current: cat.name })}
                    className="p-1.5 rounded-lg text-brand-gray hover:text-brand-violet hover:bg-brand-violet/10 transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => openDialog("cat-delete", { categoryId: cat.id, current: cat.name })}
                    className="p-1.5 rounded-lg text-brand-gray hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {isOpen && (
                  <div className="border-t border-gray-100 px-4 py-3 flex flex-col gap-2">
                    {cat.subcategories.map(sub => (
                      <div key={sub.id} className="flex items-center gap-2 pl-6">
                        <span className="flex-1 text-sm text-brand-gray">{sub.name}</span>
                        <button
                          onClick={() => openDialog("sub-edit", { categoryId: cat.id, subId: sub.id, current: sub.name })}
                          className="p-1.5 rounded-lg text-brand-gray hover:text-brand-violet hover:bg-brand-violet/10 transition-colors"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={() => openDialog("sub-delete", { categoryId: cat.id, subId: sub.id, current: sub.name })}
                          className="p-1.5 rounded-lg text-brand-gray hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => openDialog("sub-add", { categoryId: cat.id })}
                      className="flex items-center gap-1 pl-6 text-xs text-brand-violet font-medium hover:underline mt-1"
                    >
                      <Plus size={12} /> Agregar subcategoría
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={dialog.type !== null} onOpenChange={open => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog.type === "cat-add" && "Nueva categoría"}
              {dialog.type === "cat-edit" && "Editar categoría"}
              {dialog.type === "sub-add" && "Nueva subcategoría"}
              {dialog.type === "sub-edit" && "Editar subcategoría"}
              {dialog.type === "cat-delete" && "Eliminar categoría"}
              {dialog.type === "sub-delete" && "Eliminar subcategoría"}
            </DialogTitle>
          </DialogHeader>

          {isDelete ? (
            <p className="text-sm text-brand-gray">
              ¿Confirmás que querés eliminar <strong>{dialog.current}</strong>? Esta acción no se puede deshacer.
            </p>
          ) : (
            <input
              autoFocus
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSave()}
              placeholder="Nombre"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-violet/30"
            />
          )}

          <DialogFooter>
            <button
              onClick={closeDialog}
              className="px-4 py-2 text-sm text-brand-gray hover:text-brand-dark transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || (!isDelete && !inputVal.trim())}
              className={`px-4 py-2 text-sm font-semibold text-white rounded-xl transition-opacity disabled:opacity-60 ${
                isDelete ? "bg-red-500 hover:opacity-90" : "bg-brand-violet hover:opacity-90"
              }`}
            >
              {saving ? "Guardando..." : isDelete ? "Eliminar" : "Guardar"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

---

### Task 10: Usuarios stub page

**Files:**
- Create: `app/owner/usuarios/page.tsx`

- [ ] Create `app/owner/usuarios/page.tsx`:

```tsx
export default function UsuariosPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-dark font-display mb-6">Usuarios</h1>
      <p className="text-brand-gray text-sm">Próximamente.</p>
    </div>
  );
}
```

---

## Verification

1. `npm run dev` — sin errores de compilación
2. Login en `/owner/login` → redirige a `/owner/categorias`
3. Sidebar visible con links Categorías y Usuarios
4. Crear categoría → aparece en lista
5. Expandir → ver subcategorías + agregar una
6. Editar nombre → se actualiza
7. Eliminar → desaparece con confirmación
8. `/owner/usuarios` → muestra stub "Próximamente"
9. Intentar `/owner/categorias` sin sesión → redirige a `/owner/login`
