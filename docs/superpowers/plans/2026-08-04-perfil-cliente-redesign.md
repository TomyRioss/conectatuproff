# Perfil Cliente Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rediseñar `/perfil/cliente/[username]` a card estilo Workana (avatar izq + stats grid) agregando "último login" y lista de reseñas escritas por el cliente.

**Architecture:** Server component (`page.tsx`) sigue siendo el único punto de fetch (Prisma). Se agrega un helper puro `formatRelativeTime` en `lib/utils.ts` para "Último login" y "fecha reseña". No hay cambios de schema — `User.lastActivity` y `Review` ya existen.

**Tech Stack:** Next.js App Router (server component), Prisma, Tailwind (brand tokens), lucide-react icons. No hay test runner en el repo (`package.json` sin jest/vitest/playwright) — verificación es visual vía dev server + Playwright MCP.

## Global Constraints

- Nunca hex hardcodeado en markup — usar brand tokens Tailwind (`brand-dark`, `brand-violet`, `brand-green`, `brand-gray`, `brand-bg`).
- Nunca CSS puro, nunca modificar `global.css`.
- Responsive mobile-first (375px) y desktop (1280px).
- Componentes no mayores a 500 líneas.
- Sin cambios a Prisma/schema/DB (ya cubierto por campos existentes).
- Cero SVG custom salvo pedido explícito (usar lucide-react, ya en uso).

---

### Task 1: Helper `formatRelativeTime` + reemplazo header por card Workana-style

**Files:**
- Modify: `lib/utils.ts` (agregar función)
- Modify: `app/perfil/cliente/[username]/page.tsx:1-126` (header + query)

**Interfaces:**
- Produces: `formatRelativeTime(date: Date | null): string` — exportado desde `lib/utils.ts`. Devuelve `"Nunca"` si `date` es `null`; si no, string tipo `"Hace 3 horas"`, `"Hace 2 días"`, `"Hace 1 mes"`, etc. (unidades: segundos→"Hace instantes" si <60s, minutos <60, horas <24, días <30, meses <12, si no años).
- Consumes (Task 2): mismo `formatRelativeTime` para fecha de cada reseña.

- [ ] **Step 1: Agregar `formatRelativeTime` a `lib/utils.ts`**

```typescript
export function formatRelativeTime(date: Date | null): string {
  if (!date) return "Nunca"
  const diffMs = Date.now() - new Date(date).getTime()
  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 60) return "Hace instantes"
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `Hace ${diffMin} ${diffMin === 1 ? "minuto" : "minutos"}`
  const diffHrs = Math.floor(diffMin / 60)
  if (diffHrs < 24) return `Hace ${diffHrs} ${diffHrs === 1 ? "hora" : "horas"}`
  const diffDays = Math.floor(diffHrs / 24)
  if (diffDays < 30) return `Hace ${diffDays} ${diffDays === 1 ? "día" : "días"}`
  const diffMonths = Math.floor(diffDays / 30)
  if (diffMonths < 12) return `Hace ${diffMonths} ${diffMonths === 1 ? "mes" : "meses"}`
  const diffYears = Math.floor(diffMonths / 12)
  return `Hace ${diffYears} ${diffYears === 1 ? "año" : "años"}`
}
```

- [ ] **Step 2: En `page.tsx`, incluir `lastActivity` en la query y calcular `ultimoLogin`**

Reemplazar el `select` del `user` dentro de `prisma.client.findFirst` (línea 24):

```typescript
      user: { select: { email: true, username: true, lastActivity: true } },
```

Después de `miembroDesde` (línea ~37), agregar:

```typescript
  const ultimoLogin = formatRelativeTime(cliente.user.lastActivity)
```

Importar el helper arriba del archivo:

```typescript
import { formatRelativeTime } from "@/lib/utils"
```

- [ ] **Step 3: Reemplazar bloque banner+avatar+identidad (líneas 42-92) por card Workana-style**

Reemplazar todo el bloque desde `{/* ── Banner + Avatar wrapper ── */}` hasta el cierre de `{/* ── Identidad ── */}` (líneas 42-92 del archivo original) por:

```tsx
      {/* ── Header card ── */}
      <div className="px-4 md:px-6 pt-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col md:flex-row gap-5 md:items-center">
          <div className="w-20 h-20 rounded-full bg-brand-violet text-white text-2xl font-bold flex items-center justify-center shadow select-none overflow-hidden flex-shrink-0">
            {avatarKey ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/avatar?key=${encodeURIComponent(avatarKey)}`}
                alt="avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              initials
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl md:text-2xl font-bold text-brand-dark leading-tight">
                {cliente.firstName} {cliente.lastName}
              </h1>
              <EditProfileModal
                firstName={cliente.firstName}
                lastName={cliente.lastName}
                avatarKey={avatarKey}
                initials={initials}
              />
              {cliente.isVerified && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-green-100 text-green-700">
                  <CheckCircle size={12} />Cuenta verificada
                </span>
              )}
            </div>
            {cliente.user.username && (
              <p className="text-sm text-brand-gray mt-0.5">@{cliente.user.username}</p>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 md:border-l md:border-gray-100 md:pl-6">
            <HeaderStat label="Turnos" value={String(cliente._count.appointments)} />
            <HeaderStat label="Reseñas" value={String(cliente._count.reviews)} />
            <HeaderStat label="Último login" value={ultimoLogin} />
            <HeaderStat label="Miembro desde" value={miembroDesde} />
          </div>
        </div>
      </div>
```

Agregar el sub-componente al final del archivo (junto a `DataRow`/`StatCard`):

```tsx
function HeaderStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <p className="text-xs text-brand-gray">{label}</p>
      <p className="text-sm font-semibold text-brand-dark truncate">{value}</p>
    </div>
  )
}
```

Eliminar el `pt-20` sobrante en el div de "Contenido principal" (ya no hay avatar absoluto que compense) — dejar `pb-10 px-4 md:px-6 pt-5`.

- [ ] **Step 4: Quitar sección "Miembro desde" duplicada dentro de "Información personal"**

En `Section title="Información personal"`, eliminar la línea (ya está en el header stats):

```tsx
            <DataRow icon={<CalendarDays size={16} />} label="Miembro desde" value={miembroDesde} />
```

Si `CalendarDays` queda sin uso en ese bloque, revisar que siga importado (se sigue usando en `StatCard`/`HeaderStat` de sección actividad — no tocar el import).

- [ ] **Step 5: Verificación visual**

Levantar dev server (`npm run dev`), navegar a `http://localhost:3000/perfil/cliente/tomyyyp` logueado como ese cliente. Confirmar: card header con avatar izq, 4 stats visibles, responsive en 375px (columnas se apilan) y 1280px.

- [ ] **Step 6: Commit**

```bash
git add lib/utils.ts "app/perfil/cliente/[username]/page.tsx"
git commit -m "feat: redesign perfil cliente header as Workana-style card with last login stat"
```

---

### Task 2: Sección "Historial de reseñas"

**Files:**
- Modify: `app/perfil/cliente/[username]/page.tsx` (query + nueva sección)

**Interfaces:**
- Consumes: `formatRelativeTime` de Task 1 (`lib/utils.ts`).

- [ ] **Step 1: Agregar query de reseñas después del fetch de `cliente`**

Después del bloque `if (!cliente || cliente.userId !== session.user.id) redirect("/login")` (línea 29), agregar:

```typescript
  const misResenas = await prisma.review.findMany({
    where: { clientId: cliente.id },
    include: {
      professional: { select: { firstName: true, lastName: true, avatarUrl: true } },
    },
    orderBy: { createdAt: "desc" },
  })
```

- [ ] **Step 2: Agregar sección debajo de "Información personal" (dentro del `md:col-span-2`)**

En el div `md:col-span-2 flex flex-col gap-5`, después del `<Section title="Información personal">...</Section>` existente, agregar:

```tsx
          <Section title="Historial de reseñas">
            {misResenas.length === 0 ? (
              <p className="px-5 py-6 text-sm text-brand-gray">Aún no dejaste reseñas.</p>
            ) : (
              misResenas.map((r) => (
                <div key={r.id} className="px-5 py-4 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-brand-dark">
                      {r.professional.firstName} {r.professional.lastName}
                    </p>
                    <span className="text-xs text-brand-gray flex-shrink-0">
                      {formatRelativeTime(r.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={i < r.rating ? "fill-brand-green text-brand-green" : "text-gray-300"}
                      />
                    ))}
                  </div>
                  {r.comment && (
                    <p className="text-sm text-brand-gray">{r.comment}</p>
                  )}
                </div>
              ))
            )}
          </Section>
```

- [ ] **Step 3: Verificación visual**

Reiniciar/recargar dev server, confirmar sección aparece debajo de "Información personal" con reseñas del cliente `tomyyyp` (o estado vacío si no tiene ninguna). Revisar 375px y 1280px.

- [ ] **Step 4: Commit**

```bash
git add "app/perfil/cliente/[username]/page.tsx"
git commit -m "feat: add reviews history section to client profile"
```
