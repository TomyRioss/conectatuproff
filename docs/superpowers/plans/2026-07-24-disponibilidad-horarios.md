# Disponibilidad y horarios — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Profesional configura horario semanal general y horario propio por servicio; el cliente reserva desde un calendario mensual que respeta esas reglas.

**Architecture:** Un resolver server-side único (`lib/availability.ts`) decide qué ventanas horarias aplican (servicio > profesional > fallback hardcodeado) y lo reutilizan tanto el endpoint de slots diarios como el nuevo endpoint mensual. Dos editores nuevos (dialog para horario general, step de wizard para horario de servicio) escriben sobre `ProfessionalAvailability` / `ServiceAvailability`. El `BookingWizard` cambia su selector de día de un strip horizontal a un grid mensual navegable.

**Tech Stack:** Next.js App Router, Prisma, TypeScript, TailwindCSS, shadcn/ui.

## Global Constraints
- Nunca ejecutar comandos `prisma` (generate, migrate, db push, studio, etc.) sin permiso explícito del usuario en ese momento puntual — incluye Task 1, que requiere `npx prisma generate` para que el resto de las tasks tipen contra el modelo nuevo. Pedir permiso antes de ese paso específico, no asumirlo por la aprobación general del plan.
- Sin test suite en el repo — verificación via `npx tsc --noEmit` (debe quedar limpio en los archivos tocados por cada task; hay errores preexistentes no relacionados, no son responsabilidad de este plan) y, en la task final, prueba manual en browser (Playwright) del flujo completo.
- shadcn/ui + TailwindCSS, brand tokens (`brand-green`, `brand-violet`, `brand-dark`, `brand-gray`, `brand-bg`), mobile-first (375px) y desktop (1280px), ningún archivo nuevo > 500 líneas.
- Errores: catch server-side con `console.error`, feedback visual (`toast`) al usuario, nunca silencioso.
- Commits frecuentes, uno por task.

---

### Task 1: Schema — modelo `ServiceAvailability`

**Files:**
- Modify: `prisma/schema.prisma:295-324` (model `Service`), agregar modelo nuevo después de `ProfessionalAvailability` (línea ~476)

**Interfaces:**
- Produces: modelo Prisma `ServiceAvailability { id, serviceId, dayOfWeek, startTime, endTime }`, relación `Service.availability`, disponible en `prisma.serviceAvailability.*` para todas las tasks siguientes.

- [ ] **Step 1: Agregar el modelo al schema**

En `prisma/schema.prisma`, después del modelo `ProfessionalAvailability` (que termina en `@@map("professional_availability")` alrededor de la línea 476), agregar:

```prisma
model ServiceAvailability {
  id        String   @id @default(cuid())
  serviceId String
  dayOfWeek Int      // 0=Dom 1=Lun … 6=Sab
  startTime String   // "HH:MM" en timezone del profesional
  endTime   String   // "HH:MM"
  createdAt DateTime @default(now())

  service Service @relation(fields: [serviceId], references: [id], onDelete: Cascade)

  @@map("service_availability")
}
```

- [ ] **Step 2: Agregar la relación inversa en `Service`**

En `prisma/schema.prisma:319-321`, dentro del modelo `Service`, junto a `sessionPackages`:

```prisma
  sessionPackages ServiceSessionPackage[]
  availability    ServiceAvailability[]
```

- [ ] **Step 3: Pedir permiso y generar el client de Prisma**

Este paso toca herramientas de Prisma — parar y pedir permiso explícito al usuario antes de ejecutar. Una vez autorizado:

Run: `npx prisma generate`
Expected: `Generated Prisma Client` sin errores. Esto NO toca la base de datos (no crea la tabla), solo regenera los tipos TS para que las tasks siguientes compilen contra `prisma.serviceAvailability`.

Nota aparte para el usuario: la tabla `service_availability` todavía no existe en la base — se necesita `npx prisma migrate dev` (o `db push`) más adelante, con permiso explícito separado, antes de que el feature funcione en runtime real.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat(db): add ServiceAvailability model for per-service schedules"
```

---

### Task 2: Resolver de disponibilidad compartido

**Files:**
- Create: `lib/availability.ts`

**Interfaces:**
- Consumes: `prisma` de `@/lib/prisma`, `prisma.serviceAvailability.findMany`, `prisma.professionalAvailability.findMany` (Task 1).
- Produces: `TimeWindow`, `toMinutes(hhmm: string): number`, `resolveWeeklyWindows(professionalId: string, serviceId?: string | null): Promise<Map<number, TimeWindow[]>>` — usado por Task 3 y Task 4.

- [ ] **Step 1: Escribir `lib/availability.ts`**

```typescript
import { prisma } from "@/lib/prisma";

export const DEFAULT_START = "09:00";
export const DEFAULT_END = "18:00";
export const DEFAULT_DAYS = [1, 2, 3, 4, 5, 6]; // ponytail: fallback Lun-Sáb 9-18 cuando nadie configuró nada

export type TimeWindow = { start: number; end: number };

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Resuelve las ventanas horarias de cada día de la semana (0=Dom..6=Sáb).
 * Prioridad: horario propio del servicio (si tiene alguna fila configurada,
 * reemplaza por completo, día por día) > horario general del profesional >
 * fallback hardcodeado Lun-Sáb 9-18.
 */
export async function resolveWeeklyWindows(
  professionalId: string,
  serviceId?: string | null
): Promise<Map<number, TimeWindow[]>> {
  let rows: { dayOfWeek: number; startTime: string; endTime: string }[] = [];

  if (serviceId) {
    rows = await prisma.serviceAvailability.findMany({
      where: { serviceId },
      select: { dayOfWeek: true, startTime: true, endTime: true },
    });
  }

  const usingFallback = rows.length === 0;
  if (rows.length === 0) {
    rows = await prisma.professionalAvailability.findMany({
      where: { professionalId },
      select: { dayOfWeek: true, startTime: true, endTime: true },
    });
  }

  const map = new Map<number, TimeWindow[]>();
  for (let day = 0; day <= 6; day++) {
    const dayRows = rows.filter((r) => r.dayOfWeek === day);
    if (dayRows.length > 0) {
      map.set(
        day,
        dayRows.map((r) => ({ start: toMinutes(r.startTime), end: toMinutes(r.endTime) }))
      );
    } else if (rows.length === 0 && usingFallback && DEFAULT_DAYS.includes(day)) {
      map.set(day, [{ start: toMinutes(DEFAULT_START), end: toMinutes(DEFAULT_END) }]);
    } else {
      map.set(day, []);
    }
  }
  return map;
}
```

- [ ] **Step 2: Verificar tipado**

Run: `npx tsc --noEmit`
Expected: sin errores nuevos en `lib/availability.ts` (requiere que Task 1 Step 3 ya se haya corrido, si no `prisma.serviceAvailability` no existe todavía y este paso falla — no seguir sin eso resuelto).

- [ ] **Step 3: Commit**

```bash
git add lib/availability.ts
git commit -m "feat: add shared weekly availability resolver"
```

---

### Task 3: Endpoint de slots diarios — usar el resolver + `serviceId`

**Files:**
- Modify: `app/api/profesional/[id]/disponibilidad/route.ts` (archivo completo, 76 líneas)

**Interfaces:**
- Consumes: `resolveWeeklyWindows` de Task 2.
- Produces: `GET /api/profesional/[id]/disponibilidad?date=YYYY-MM-DD&durationMin=&serviceId=` sin cambios en la forma de la respuesta (`{ slots: string[] }`), pero ahora respeta horario de servicio si existe.

- [ ] **Step 1: Reescribir el route usando el resolver**

Reemplazar todo el contenido de `app/api/profesional/[id]/disponibilidad/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveWeeklyWindows } from "@/lib/availability";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date"); // "YYYY-MM-DD"
  const durationMin = Number(searchParams.get("durationMin") ?? 60);
  const serviceId = searchParams.get("serviceId");

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Parámetro date inválido" }, { status: 400 });
  }

  const [year, month, day] = date.split("-").map(Number);
  const dayStart = new Date(year, month - 1, day, 0, 0, 0);
  const dayEnd = new Date(year, month - 1, day, 23, 59, 59);
  const dayOfWeek = dayStart.getDay();

  if (dayStart < new Date(new Date().setHours(0, 0, 0, 0))) {
    return NextResponse.json({ slots: [] });
  }

  const [weeklyWindows, blocked, appointments] = await Promise.all([
    resolveWeeklyWindows(id, serviceId),
    prisma.blockedSlot.findMany({ where: { professionalId: id, startAt: { lt: dayEnd }, endAt: { gt: dayStart } } }),
    prisma.appointment.findMany({
      where: { professionalId: id, startAt: { gte: dayStart, lte: dayEnd }, status: { in: ["PENDING", "CONFIRMED"] } },
      select: { startAt: true, durationMin: true },
    }),
  ]);

  const windows = weeklyWindows.get(dayOfWeek) ?? [];

  const busy = [
    ...blocked.map((b) => ({
      start: b.startAt <= dayStart ? 0 : b.startAt.getHours() * 60 + b.startAt.getMinutes(),
      end: b.endAt >= dayEnd ? 24 * 60 : b.endAt.getHours() * 60 + b.endAt.getMinutes(),
    })),
    ...appointments.map((a) => {
      const start = a.startAt.getHours() * 60 + a.startAt.getMinutes();
      return { start, end: start + (a.durationMin ?? 60) };
    }),
  ];

  const slots: string[] = [];
  const step = 30;
  const isToday = dayStart.toDateString() === new Date().toDateString();
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();

  for (const w of windows) {
    for (let t = w.start; t + durationMin <= w.end; t += step) {
      if (isToday && t <= nowMinutes) continue;
      const overlaps = busy.some((b) => t < b.end && t + durationMin > b.start);
      if (overlaps) continue;
      const h = String(Math.floor(t / 60)).padStart(2, "0");
      const m = String(t % 60).padStart(2, "0");
      slots.push(`${h}:${m}`);
    }
  }

  return NextResponse.json({ slots });
}
```

- [ ] **Step 2: Verificar tipado**

Run: `npx tsc --noEmit`
Expected: sin errores nuevos en este archivo.

- [ ] **Step 3: Commit**

```bash
git add "app/api/profesional/[id]/disponibilidad/route.ts"
git commit -m "feat: resolve daily slots via shared availability resolver, accept serviceId"
```

---

### Task 4: Endpoint de disponibilidad mensual

**Files:**
- Create: `app/api/profesional/[id]/disponibilidad/mes/route.ts`

**Interfaces:**
- Consumes: `resolveWeeklyWindows` de Task 2.
- Produces: `GET /api/profesional/[id]/disponibilidad/mes?month=YYYY-MM&serviceId=` → `{ dates: string[] }` (formato `YYYY-MM-DD`), usado por Task 9/10.

- [ ] **Step 1: Escribir el route**

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveWeeklyWindows } from "@/lib/availability";

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // "YYYY-MM"
  const serviceId = searchParams.get("serviceId");
  const durationMin = Number(searchParams.get("durationMin") ?? 60);

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: "Parámetro month inválido" }, { status: 400 });
  }

  const [year, monthNum] = month.split("-").map(Number);
  const rangeStart = new Date(year, monthNum - 1, 1);
  const rangeEnd = new Date(year, monthNum, 1);
  const today = new Date(new Date().setHours(0, 0, 0, 0));

  const [weeklyWindows, blocked, appointments] = await Promise.all([
    resolveWeeklyWindows(id, serviceId),
    prisma.blockedSlot.findMany({
      where: { professionalId: id, startAt: { lt: rangeEnd }, endAt: { gt: rangeStart } },
    }),
    prisma.appointment.findMany({
      where: { professionalId: id, startAt: { gte: rangeStart, lt: rangeEnd }, status: { in: ["PENDING", "CONFIRMED"] } },
      select: { startAt: true, durationMin: true },
    }),
  ]);

  const dates: string[] = [];
  const daysInMonth = new Date(year, monthNum, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const dayStart = new Date(year, monthNum - 1, day, 0, 0, 0);
    const dayEnd = new Date(year, monthNum - 1, day, 23, 59, 59);
    if (dayStart < today) continue;

    const windows = weeklyWindows.get(dayStart.getDay()) ?? [];
    if (windows.length === 0) continue;

    const busy = [
      ...blocked
        .filter((b) => b.startAt < dayEnd && b.endAt > dayStart)
        .map((b) => ({
          start: b.startAt <= dayStart ? 0 : b.startAt.getHours() * 60 + b.startAt.getMinutes(),
          end: b.endAt >= dayEnd ? 24 * 60 : b.endAt.getHours() * 60 + b.endAt.getMinutes(),
        })),
      ...appointments
        .filter((a) => a.startAt >= dayStart && a.startAt <= dayEnd)
        .map((a) => {
          const start = a.startAt.getHours() * 60 + a.startAt.getMinutes();
          return { start, end: start + (a.durationMin ?? 60) };
        }),
    ];

    const isToday = dayStart.toDateString() === new Date().toDateString();
    const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();

    const hasSlot = windows.some((w) => {
      for (let t = w.start; t + durationMin <= w.end; t += 30) {
        if (isToday && t <= nowMinutes) continue;
        const overlaps = busy.some((b) => t < b.end && t + durationMin > b.start);
        if (!overlaps) return true;
      }
      return false;
    });

    if (hasSlot) dates.push(toDateKey(dayStart));
  }

  return NextResponse.json({ dates });
}
```

- [ ] **Step 2: Verificar tipado**

Run: `npx tsc --noEmit`
Expected: sin errores nuevos en este archivo.

- [ ] **Step 3: Commit**

```bash
git add "app/api/profesional/[id]/disponibilidad/mes/route.ts"
git commit -m "feat: add monthly availability endpoint for calendar dots"
```

---

### Task 5: API — horario semanal general del profesional (lectura/escritura)

**Files:**
- Create: `app/api/profesional/disponibilidad/route.ts`

**Interfaces:**
- Consumes: `auth()` de `@/lib/auth`, `prisma` de `@/lib/prisma`.
- Produces: `GET /api/profesional/disponibilidad` → `{ days: { dayOfWeek: number; startTime: string; endTime: string }[] }`; `PUT /api/profesional/disponibilidad` body `{ days: { dayOfWeek: number; startTime: string; endTime: string }[] }` → `{ ok: true }`. Usado por Task 6.

- [ ] **Step 1: Escribir el route**

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getOwnProfessionalId(userId: string) {
  const pro = await prisma.professional.findUnique({ where: { userId }, select: { id: true } });
  return pro?.id ?? null;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PROFESSIONAL") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const professionalId = await getOwnProfessionalId(session.user.id);
  if (!professionalId) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });

  const days = await prisma.professionalAvailability.findMany({
    where: { professionalId },
    orderBy: { dayOfWeek: "asc" },
    select: { dayOfWeek: true, startTime: true, endTime: true },
  });
  return NextResponse.json({ days });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PROFESSIONAL") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const professionalId = await getOwnProfessionalId(session.user.id);
  if (!professionalId) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });

  const body = await req.json();
  const days: { dayOfWeek: number; startTime: string; endTime: string }[] = Array.isArray(body?.days)
    ? body.days.filter(
        (d: unknown): d is { dayOfWeek: number; startTime: string; endTime: string } =>
          !!d &&
          typeof d === "object" &&
          typeof (d as Record<string, unknown>).dayOfWeek === "number" &&
          typeof (d as Record<string, unknown>).startTime === "string" &&
          typeof (d as Record<string, unknown>).endTime === "string"
      )
    : [];

  try {
    await prisma.$transaction([
      prisma.professionalAvailability.deleteMany({ where: { professionalId } }),
      prisma.professionalAvailability.createMany({
        data: days.map((d) => ({ professionalId, dayOfWeek: d.dayOfWeek, startTime: d.startTime, endTime: d.endTime })),
      }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("PUT /api/profesional/disponibilidad", e);
    return NextResponse.json({ error: "Error al guardar horario" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verificar tipado**

Run: `npx tsc --noEmit`
Expected: sin errores nuevos en este archivo.

- [ ] **Step 3: Commit**

```bash
git add app/api/profesional/disponibilidad/route.ts
git commit -m "feat: add professional weekly availability CRUD endpoint"
```

---

### Task 6: UI — dialog de horario semanal general en Agenda

**Files:**
- Create: `components/agenda/WeeklyAvailabilityDialog.tsx`
- Modify: `app/(dashboard)/profesional/agenda/page.tsx:1-26` (archivo completo)

**Interfaces:**
- Consumes: `GET`/`PUT /api/profesional/disponibilidad` de Task 5. `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogTrigger` de `@/components/ui/dialog`. `Button` de `@/components/ui/button`.
- Produces: `<WeeklyAvailabilityDialog />` — componente auto-contenido con su propio trigger button, sin props.

- [ ] **Step 1: Escribir `WeeklyAvailabilityDialog.tsx`**

```typescript
"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Settings } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const DOW_LABELS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

type DayRow = { enabled: boolean; startTime: string; endTime: string };

function emptyWeek(): DayRow[] {
  return DOW_LABELS.map((_, i) => ({ enabled: i >= 1 && i <= 5, startTime: "09:00", endTime: "18:00" }));
}

export function WeeklyAvailabilityDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [week, setWeek] = useState<DayRow[]>(emptyWeek());

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/profesional/disponibilidad")
      .then((r) => r.json())
      .then((data: { days?: { dayOfWeek: number; startTime: string; endTime: string }[] }) => {
        const next = emptyWeek().map((row, i) => ({ ...row, enabled: false }));
        for (const d of data.days ?? []) {
          next[d.dayOfWeek] = { enabled: true, startTime: d.startTime, endTime: d.endTime };
        }
        setWeek(next);
      })
      .catch(() => toast.error("No se pudo cargar el horario"))
      .finally(() => setLoading(false));
  }, [open]);

  function updateDay(index: number, patch: Partial<DayRow>) {
    setWeek((w) => w.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  async function save() {
    setSaving(true);
    try {
      const days = week
        .map((row, dayOfWeek) => ({ dayOfWeek, ...row }))
        .filter((row) => row.enabled)
        .map(({ dayOfWeek, startTime, endTime }) => ({ dayOfWeek, startTime, endTime }));

      const res = await fetch("/api/profesional/disponibilidad", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days }),
      });
      if (!res.ok) throw new Error("save failed");
      toast.success("Horario guardado");
      setOpen(false);
    } catch (e) {
      console.error("save weekly availability", e);
      toast.error("No se pudo guardar el horario");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="gap-2 border-gray-200 text-brand-dark">
          <Settings size={14} /> Configurar horario
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Horario semanal</DialogTitle>
        </DialogHeader>
        {loading ? (
          <p className="text-sm text-brand-gray py-4">Cargando...</p>
        ) : (
          <div className="flex flex-col gap-3 py-2">
            {DOW_LABELS.map((label, i) => (
              <div key={label} className="flex items-center gap-3">
                <label className="flex items-center gap-2 w-32 shrink-0">
                  <input
                    type="checkbox"
                    checked={week[i].enabled}
                    onChange={(e) => updateDay(i, { enabled: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-brand-violet focus:ring-brand-violet/30"
                  />
                  <span className="text-sm text-brand-dark">{label}</span>
                </label>
                <input
                  type="time"
                  disabled={!week[i].enabled}
                  value={week[i].startTime}
                  onChange={(e) => updateDay(i, { startTime: e.target.value })}
                  className="h-9 rounded-md border border-gray-200 bg-white px-2 text-sm text-brand-dark disabled:opacity-40 disabled:bg-brand-bg"
                />
                <span className="text-brand-gray text-sm">a</span>
                <input
                  type="time"
                  disabled={!week[i].enabled}
                  value={week[i].endTime}
                  onChange={(e) => updateDay(i, { endTime: e.target.value })}
                  className="h-9 rounded-md border border-gray-200 bg-white px-2 text-sm text-brand-dark disabled:opacity-40 disabled:bg-brand-bg"
                />
              </div>
            ))}
          </div>
        )}
        <DialogFooter>
          <Button type="button" onClick={save} disabled={saving || loading} className="bg-brand-green text-white hover:opacity-90">
            {saving ? "Guardando..." : "Guardar horario"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Wirear el trigger en la página de Agenda**

Reemplazar todo el contenido de `app/(dashboard)/profesional/agenda/page.tsx`:

```typescript
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import AgendaCalendario from "@/components/agenda/AgendaCalendario"
import GoogleCalendarButton from "@/components/agenda/GoogleCalendarButton"
import { WeeklyAvailabilityDialog } from "@/components/agenda/WeeklyAvailabilityDialog"

export default async function AgendaPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const pro = await prisma.professional.findUnique({
    where: { userId: session.user.id },
    select: { id: true, googleConnected: true },
  })
  if (!pro) redirect("/profesional/onboarding")

  return (
    <main className="min-h-screen bg-brand-bg px-4 py-8 max-w-5xl xl:max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <h1 className="text-2xl font-bold text-brand-dark">Agenda</h1>
        <div className="flex items-center gap-3">
          <WeeklyAvailabilityDialog />
          <GoogleCalendarButton initialConnected={pro.googleConnected} />
        </div>
      </div>
      <AgendaCalendario />
    </main>
  )
}
```

- [ ] **Step 3: Verificar tipado**

Run: `npx tsc --noEmit`
Expected: sin errores nuevos en `components/agenda/WeeklyAvailabilityDialog.tsx` ni en `app/(dashboard)/profesional/agenda/page.tsx`.

- [ ] **Step 4: Commit**

```bash
git add components/agenda/WeeklyAvailabilityDialog.tsx "app/(dashboard)/profesional/agenda/page.tsx"
git commit -m "feat: add weekly availability editor to agenda page"
```

---

### Task 7: Wizard — tipos y persistencia de `availability` en servicios

**Files:**
- Modify: `components/profesionales/wizard/types.ts` (archivo completo, 42 líneas)
- Modify: `app/api/profesional/servicios/route.ts:1-107` (archivo completo)
- Modify: `app/api/profesional/servicios/[id]/route.ts:1-111` (archivo completo)

**Interfaces:**
- Produces: `WizardState.availability: { dayOfWeek: number; startTime: string; endTime: string }[]`, campo `availability` aceptado por `POST`/`PATCH /api/profesional/servicios`. Usado por Task 8.

- [ ] **Step 1: Extender `types.ts`**

Reemplazar todo el contenido de `components/profesionales/wizard/types.ts`:

```typescript
export type Category = { id: string; name: string; slug: string }

export type SessionPackage = { sessionCount: string; price: string; frequencyType: FrequencyType }
export type Faq = { question: string; answer: string }
export type GalleryItem = { key: string; type: "image" | "video" }
export type AvailabilityBlock = { dayOfWeek: number; startTime: string; endTime: string }

export type FrequencyType = "UNICA" | "SEMANAL" | "MENSUAL"

export type WizardState = {
  title: string
  price: string
  durationMin: string
  frequencyType: FrequencyType
  frequencyCount: string
  frequencyPeriods: string
  modality: string
  categoryId: string
  extraSessionPrice: string
  sessionPackages: SessionPackage[]
  description: string
  faqs: Faq[]
  gallery: GalleryItem[]
  availability: AvailabilityBlock[]
}

export const initialWizardState: WizardState = {
  title: "",
  price: "",
  durationMin: "",
  frequencyType: "UNICA",
  frequencyCount: "",
  frequencyPeriods: "",
  modality: "",
  categoryId: "",
  extraSessionPrice: "",
  sessionPackages: [],
  description: "",
  faqs: [],
  gallery: [],
  availability: [],
}

export const STEPS = ["Nombre", "Precio y packs", "Horarios", "Descripción", "Galería", "Revisar"] as const
```

- [ ] **Step 2: Aceptar `availability` en `POST /api/profesional/servicios`**

En `app/api/profesional/servicios/route.ts`, agregar `availability` a la desestructuración del body (línea 37-54) y a los datos de creación (línea 79-100). Reemplazar todo el contenido del archivo:

```typescript
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { ServiceFrequency } from "@/lib/generated/prisma/enums"

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
  const {
    title,
    description,
    price,
    durationMin,
    frequencyType,
    frequencyCount,
    frequencyPeriods,
    modality,
    categoryId,
    imageUrl,
    videoUrl,
    extraSessionPrice,
    gallery,
    faqs,
    sessionPackages,
    availability,
    status,
  } = body

  const isDraft = status === "DRAFT"

  if (!title?.trim()) {
    return NextResponse.json({ error: "Título requerido" }, { status: 400 })
  }
  const priceNum = price !== undefined && price !== null && price !== "" ? Number(price) : null
  if (!isDraft && (!priceNum || priceNum <= 0)) {
    return NextResponse.json({ error: "Precio inválido" }, { status: 400 })
  }
  if (priceNum !== null && !Number.isFinite(priceNum)) {
    return NextResponse.json({ error: "Precio inválido" }, { status: 400 })
  }

  const galleryUrls: string[] = Array.isArray(gallery) ? gallery.filter(Boolean).slice(0, 3) : []
  const faqList: { question: string; answer: string }[] = Array.isArray(faqs)
    ? faqs.filter((f) => f?.question?.trim() && f?.answer?.trim())
    : []
  const packageList: { sessionCount: number; price: number; frequencyType: ServiceFrequency | null }[] = Array.isArray(sessionPackages)
    ? sessionPackages
        .filter((p) => Number(p?.sessionCount) > 0 && Number(p?.price) > 0)
        .map((p) => ({ sessionCount: Number(p.sessionCount), price: Number(p.price), frequencyType: p.frequencyType && p.frequencyType !== "UNICA" ? (p.frequencyType as ServiceFrequency) : null }))
    : []
  const availabilityList: { dayOfWeek: number; startTime: string; endTime: string }[] = Array.isArray(availability)
    ? availability.filter((a) => typeof a?.dayOfWeek === "number" && a?.startTime && a?.endTime)
    : []

  try {
    const service = await prisma.service.create({
      data: {
        professionalId,
        title: title.trim(),
        description: description?.trim() || null,
        price: priceNum,
        status: isDraft ? "DRAFT" : undefined,
        durationMin: durationMin ? Number(durationMin) : null,
        frequencyType: frequencyType || null,
        frequencyCount: frequencyCount ? Number(frequencyCount) : null,
        frequencyPeriods: frequencyPeriods ? Number(frequencyPeriods) : null,
        modality: modality || null,
        categoryId: categoryId || null,
        imageUrl: imageUrl || null,
        videoUrl: videoUrl || null,
        extraSessionPrice: extraSessionPrice ? Number(extraSessionPrice) : null,
        gallery: { create: galleryUrls.map((imageUrl, order) => ({ imageUrl, order })) },
        faqs: { create: faqList.map((f, order) => ({ question: f.question.trim(), answer: f.answer.trim(), order })) },
        sessionPackages: { create: packageList },
        availability: { create: availabilityList },
      },
    })
    return NextResponse.json(service, { status: 201 })
  } catch (e) {
    console.error("POST /api/profesional/servicios", e)
    return NextResponse.json({ error: "Error al crear servicio" }, { status: 500 })
  }
}
```

- [ ] **Step 3: Aceptar `availability` en `PATCH /api/profesional/servicios/[id]`**

Reemplazar todo el contenido de `app/api/profesional/servicios/[id]/route.ts`:

```typescript
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { ServiceFrequency } from "@/lib/generated/prisma/enums"

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
  const {
    title,
    description,
    price,
    durationMin,
    frequencyType,
    frequencyCount,
    frequencyPeriods,
    modality,
    categoryId,
    imageUrl,
    videoUrl,
    extraSessionPrice,
    gallery,
    faqs,
    sessionPackages,
    availability,
    status,
  } = body

  const isDraft = status === "DRAFT" || (status === undefined && existing.status === "DRAFT")

  if (title !== undefined && !title?.trim()) {
    return NextResponse.json({ error: "Título requerido" }, { status: 400 })
  }
  if (price !== undefined && price !== null && price !== "" && !isDraft && Number(price) <= 0) {
    return NextResponse.json({ error: "Precio inválido" }, { status: 400 })
  }
  if (status !== undefined && !["ACTIVE", "DRAFT", "PAUSED"].includes(status)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 })
  }

  try {
    const data: Record<string, unknown> = {}
    if (title !== undefined) data.title = title.trim()
    if (description !== undefined) data.description = description?.trim() || null
    if (price !== undefined) data.price = price !== null && price !== "" ? Number(price) : null
    if (durationMin !== undefined) data.durationMin = durationMin ? Number(durationMin) : null
    if (frequencyType !== undefined) data.frequencyType = frequencyType || null
    if (frequencyCount !== undefined) data.frequencyCount = frequencyCount ? Number(frequencyCount) : null
    if (frequencyPeriods !== undefined) data.frequencyPeriods = frequencyPeriods ? Number(frequencyPeriods) : null
    if (modality !== undefined) data.modality = modality || null
    if (categoryId !== undefined) data.categoryId = categoryId || null
    if (imageUrl !== undefined) data.imageUrl = imageUrl || null
    if (videoUrl !== undefined) data.videoUrl = videoUrl || null
    if (extraSessionPrice !== undefined) data.extraSessionPrice = extraSessionPrice ? Number(extraSessionPrice) : null
    if (status !== undefined) data.status = status

    if (gallery !== undefined) {
      const galleryUrls: string[] = Array.isArray(gallery) ? gallery.filter(Boolean).slice(0, 3) : []
      data.gallery = {
        deleteMany: {},
        create: galleryUrls.map((url, order) => ({ imageUrl: url, order })),
      }
    }
    if (faqs !== undefined) {
      const faqList: { question: string; answer: string }[] = Array.isArray(faqs)
        ? faqs.filter((f) => f?.question?.trim() && f?.answer?.trim())
        : []
      data.faqs = {
        deleteMany: {},
        create: faqList.map((f, order) => ({ question: f.question.trim(), answer: f.answer.trim(), order })),
      }
    }
    if (sessionPackages !== undefined) {
      const packageList: { sessionCount: number; price: number; frequencyType: ServiceFrequency | null }[] = Array.isArray(sessionPackages)
        ? sessionPackages
            .filter((p) => Number(p?.sessionCount) > 0 && Number(p?.price) > 0)
            .map((p) => ({
              sessionCount: Number(p.sessionCount),
              price: Number(p.price),
              frequencyType: p.frequencyType && p.frequencyType !== "UNICA" ? (p.frequencyType as ServiceFrequency) : null,
            }))
        : []
      data.sessionPackages = {
        deleteMany: {},
        create: packageList,
      }
    }
    if (availability !== undefined) {
      const availabilityList: { dayOfWeek: number; startTime: string; endTime: string }[] = Array.isArray(availability)
        ? availability.filter((a) => typeof a?.dayOfWeek === "number" && a?.startTime && a?.endTime)
        : []
      data.availability = {
        deleteMany: {},
        create: availabilityList,
      }
    }

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

- [ ] **Step 4: Verificar tipado**

Run: `npx tsc --noEmit`
Expected: sin errores nuevos en los 3 archivos tocados.

- [ ] **Step 5: Commit**

```bash
git add components/profesionales/wizard/types.ts app/api/profesional/servicios/route.ts "app/api/profesional/servicios/[id]/route.ts"
git commit -m "feat: persist per-service availability blocks"
```

---

### Task 8: Wizard — step de horarios por servicio

**Files:**
- Create: `components/profesionales/wizard/StepDisponibilidad.tsx`
- Modify: `components/profesionales/wizard/ServiceWizard.tsx:1-204` (archivo completo)
- Modify: `app/(dashboard)/profesional/servicios/[id]/editar/page.tsx:1-51` (archivo completo)

**Interfaces:**
- Consumes: `WizardState`, `AvailabilityBlock` de `./types` (Task 7).
- Produces: `<StepDisponibilidad state update />`, wireado como step 2 (índice) del wizard, entre "Precio y packs" y "Descripción".

- [ ] **Step 1: Escribir `StepDisponibilidad.tsx`**

```typescript
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { WizardState } from "./types"

const DOW_LABELS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]

export function StepDisponibilidad({
  state,
  update,
}: {
  state: WizardState
  update: (patch: Partial<WizardState>) => void
}) {
  function addBlock() {
    update({ availability: [...state.availability, { dayOfWeek: 1, startTime: "09:00", endTime: "10:00" }] })
  }

  function updateBlock(index: number, patch: Partial<WizardState["availability"][number]>) {
    update({ availability: state.availability.map((b, i) => (i === index ? { ...b, ...patch } : b)) })
  }

  function removeBlock(index: number) {
    update({ availability: state.availability.filter((_, i) => i !== index) })
  }

  return (
    <div className="max-w-xl">
      <h2 className="text-2xl font-bold text-brand-dark">Horarios de este servicio</h2>
      <p className="text-brand-gray text-sm mt-1">
        Opcional. Si no agregás horarios, el cliente reserva dentro de tu horario general de atención. Si agregás al
        menos uno, solo esos días y horas quedan disponibles para reservar este servicio.
      </p>

      <div className="flex items-center justify-between mt-6">
        <p className="text-sm font-semibold text-brand-dark">Bloques configurados</p>
        <Button type="button" variant="outline" onClick={addBlock} className="gap-1.5 border-gray-200 text-brand-dark">
          <Plus size={14} /> Agregar horario
        </Button>
      </div>

      <div className="flex flex-col gap-3 mt-4">
        {state.availability.length === 0 && (
          <p className="text-sm text-brand-gray">Sin horarios propios configurados.</p>
        )}
        {state.availability.map((block, i) => (
          <div key={i} className="flex items-center gap-3">
            <select
              value={block.dayOfWeek}
              onChange={(e) => updateBlock(i, { dayOfWeek: Number(e.target.value) })}
              className="h-9 rounded-md border border-gray-200 bg-white px-3 pr-8 text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-violet/30 focus:border-brand-violet"
            >
              {DOW_LABELS.map((label, dow) => (
                <option key={dow} value={dow}>{label}</option>
              ))}
            </select>
            <input
              type="time"
              value={block.startTime}
              onChange={(e) => updateBlock(i, { startTime: e.target.value })}
              className="h-9 rounded-md border border-gray-200 bg-white px-2 text-sm text-brand-dark"
            />
            <span className="text-brand-gray text-sm">a</span>
            <input
              type="time"
              value={block.endTime}
              onChange={(e) => updateBlock(i, { endTime: e.target.value })}
              className="h-9 rounded-md border border-gray-200 bg-white px-2 text-sm text-brand-dark"
            />
            <button type="button" onClick={() => removeBlock(i)} aria-label="Quitar horario" className="text-brand-gray hover:text-red-600">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Wirear el step en `ServiceWizard.tsx`**

Reemplazar todo el contenido de `components/profesionales/wizard/ServiceWizard.tsx`:

```typescript
"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StepNombre } from "./StepNombre"
import { StepPrecio } from "./StepPrecio"
import { StepDisponibilidad } from "./StepDisponibilidad"
import { StepDescripcion } from "./StepDescripcion"
import { StepGaleria } from "./StepGaleria"
import { StepRevisar } from "./StepRevisar"
import { STEPS, initialWizardState, type WizardState } from "./types"

function validateStep(step: number, state: WizardState) {
  if (step === 0) return state.title.trim().length > 0
  if (step === 1) return Number(state.price) > 0
  return true
}

function buildPayload(state: WizardState, videoUrl: string) {
  return {
    title: state.title,
    description: state.description || undefined,
    price: state.price ? Number(state.price) : undefined,
    durationMin: state.durationMin ? Number(state.durationMin) : undefined,
    frequencyType: state.frequencyType,
    frequencyCount: state.frequencyType !== "UNICA" && state.frequencyCount ? Number(state.frequencyCount) : undefined,
    frequencyPeriods: state.frequencyType !== "UNICA" && state.frequencyPeriods ? Number(state.frequencyPeriods) : undefined,
    modality: state.modality || undefined,
    categoryId: state.categoryId || undefined,
    imageUrl: state.gallery[0]?.key || undefined,
    videoUrl: videoUrl || undefined,
    extraSessionPrice: state.extraSessionPrice ? Number(state.extraSessionPrice) : undefined,
    gallery: state.gallery.map((g) => g.key),
    faqs: state.faqs.filter((f) => f.question.trim() && f.answer.trim()),
    sessionPackages: state.sessionPackages
      .filter((p) => Number(p.sessionCount) > 0 && Number(p.price) > 0)
      .map((p) => ({ sessionCount: Number(p.sessionCount), price: Number(p.price), frequencyType: p.frequencyType })),
    availability: state.availability,
  }
}

export function ServiceWizard({
  serviceId,
  initialState,
  initialVideoUrl,
}: {
  serviceId?: string
  initialState?: WizardState
  initialVideoUrl?: string
} = {}) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [state, setState] = useState<WizardState>(initialState ?? initialWizardState)
  const [videoUrl, setVideoUrl] = useState(initialVideoUrl ?? "")
  const [publishing, setPublishing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [draftId, setDraftId] = useState<string | null>(serviceId ?? null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const skipNextAutosave = useRef(true)

  function update(patch: Partial<WizardState>) {
    setState((s) => ({ ...s, ...patch }))
  }

  useEffect(() => {
    if (skipNextAutosave.current) {
      skipNextAutosave.current = false
      return
    }
    if (!state.title.trim()) return

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setSaving(true)
      try {
        const payload = { ...buildPayload(state, videoUrl), status: "DRAFT" as const }
        const res = await fetch(
          draftId ? `/api/profesional/servicios/${draftId}` : "/api/profesional/servicios",
          {
            method: draftId ? "PATCH" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        )
        const data = await res.json().catch(() => null)
        if (res.ok && !draftId && data?.id) setDraftId(data.id)
      } catch {
        // autosave silencioso: no interrumpe al usuario
      } finally {
        setSaving(false)
      }
    }, 900)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, videoUrl])

  function goNext() {
    if (!validateStep(step, state)) {
      toast.error(step === 0 ? "Ponele un nombre al servicio" : "Ingresá un precio válido")
      return
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 0))
  }

  async function publish() {
    setPublishing(true)
    try {
      const payload = { ...buildPayload(state, videoUrl), status: "ACTIVE" as const }
      const res = await fetch(
        draftId ? `/api/profesional/servicios/${draftId}` : "/api/profesional/servicios",
        {
          method: draftId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      )
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        toast.error(data?.error ?? "No se pudo publicar el servicio")
        return
      }
      toast.success("Servicio publicado")
      router.push("/profesional/servicios")
      router.refresh()
    } catch {
      toast.error("No se pudo publicar el servicio")
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <div className="relative flex items-center justify-between mb-10">
        <div className="flex items-center gap-2 flex-1">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2 flex-1">
              <div className="flex items-center gap-2">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                    i < step
                      ? "bg-brand-green text-white"
                      : i === step
                      ? "bg-brand-dark text-white"
                      : "bg-gray-200 text-brand-gray"
                  }`}
                >
                  {i < step ? <Check size={14} /> : i + 1}
                </div>
                <span className={`text-sm font-medium hidden sm:inline ${i === step ? "text-brand-dark" : "text-brand-gray"}`}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && <div className={`h-0.5 flex-1 ${i < step ? "bg-brand-green" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>
        {saving && (
          <span className="flex items-center gap-1.5 text-xs text-brand-gray ml-4 shrink-0 absolute right-4 sm:right-6 top-10">
            <Loader2 size={12} className="animate-spin" /> Guardando borrador...
          </span>
        )}
      </div>

      {step === 0 && <StepNombre state={state} update={update} />}
      {step === 1 && <StepPrecio state={state} update={update} />}
      {step === 2 && <StepDisponibilidad state={state} update={update} />}
      {step === 3 && <StepDescripcion state={state} update={update} />}
      {step === 4 && <StepGaleria state={state} update={update} videoUrl={videoUrl} setVideoUrl={setVideoUrl} />}
      {step === 5 && <StepRevisar state={state} videoUrl={videoUrl} />}

      <div className="max-w-2xl flex items-center justify-between mt-10 pt-6 border-t border-gray-200">
        {step > 0 ? (
          <Button type="button" variant="outline" onClick={goBack} className="border-gray-200 text-brand-dark">
            Atrás
          </Button>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-3">
          <Button type="button" variant="ghost" onClick={() => router.push("/profesional/servicios")} className="text-brand-gray hover:text-brand-dark">
            Cancelar
          </Button>
          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={goNext} className="bg-brand-dark text-white hover:opacity-90">
              Continuar
            </Button>
          ) : (
            <Button type="button" onClick={publish} disabled={publishing} className="bg-brand-green text-white hover:opacity-90">
              {publishing ? "Publicando..." : "Publicar servicio"}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Cargar `availability` existente al editar un servicio**

Reemplazar todo el contenido de `app/(dashboard)/profesional/servicios/[id]/editar/page.tsx`:

```typescript
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import { ServiceWizard } from "@/components/profesionales/wizard/ServiceWizard"
import type { WizardState } from "@/components/profesionales/wizard/types"

export default async function EditarServicioPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  if ((session.user as { role?: string }).role !== "PROFESSIONAL") redirect("/")

  const professional = await prisma.professional.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })
  if (!professional) redirect("/profesional/onboarding")

  const { id } = await params
  const service = await prisma.service.findUnique({
    where: { id },
    include: {
      gallery: { orderBy: { order: "asc" } },
      faqs: { orderBy: { order: "asc" } },
      sessionPackages: true,
      availability: true,
    },
  })
  if (!service || service.professionalId !== professional.id) notFound()

  const initialState: WizardState = {
    title: service.title,
    price: service.price ? String(service.price) : "",
    durationMin: service.durationMin ? String(service.durationMin) : "",
    frequencyType: service.frequencyType ?? "UNICA",
    frequencyCount: service.frequencyCount ? String(service.frequencyCount) : "",
    frequencyPeriods: service.frequencyPeriods ? String(service.frequencyPeriods) : "",
    modality: service.modality ?? "",
    categoryId: service.categoryId ?? "",
    extraSessionPrice: service.extraSessionPrice ? String(service.extraSessionPrice) : "",
    sessionPackages: service.sessionPackages.map((p) => ({
      sessionCount: String(p.sessionCount),
      price: String(p.price),
      frequencyType: p.frequencyType ?? "UNICA",
    })),
    description: service.description ?? "",
    faqs: service.faqs.map((f) => ({ question: f.question, answer: f.answer })),
    gallery: service.gallery.map((g) => ({ key: g.imageUrl, type: "image" as const })),
    availability: service.availability.map((a) => ({ dayOfWeek: a.dayOfWeek, startTime: a.startTime, endTime: a.endTime })),
  }

  return <ServiceWizard serviceId={service.id} initialState={initialState} initialVideoUrl={service.videoUrl ?? ""} />
}
```

- [ ] **Step 4: Verificar tipado**

Run: `npx tsc --noEmit`
Expected: sin errores nuevos en los 3 archivos tocados.

- [ ] **Step 5: Commit**

```bash
git add components/profesionales/wizard/StepDisponibilidad.tsx components/profesionales/wizard/ServiceWizard.tsx "app/(dashboard)/profesional/servicios/[id]/editar/page.tsx"
git commit -m "feat: add per-service schedule step to service wizard"
```

---

### Task 9: Componente de calendario mensual (cliente)

**Files:**
- Create: `components/agendar/MonthAvailabilityCalendar.tsx`

**Interfaces:**
- Consumes: nada externo más allá de React — recibe todo por props.
- Produces: `<MonthAvailabilityCalendar selectedDate availableDates loading month onMonthChange onSelectDate />`, usado por Task 10.

- [ ] **Step 1: Escribir el componente**

```typescript
"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

const DOW = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function MonthAvailabilityCalendar({
  month,
  selectedDate,
  availableDates,
  loading,
  onMonthChange,
  onSelectDate,
}: {
  month: Date; // cualquier día dentro del mes visible
  selectedDate: Date | null;
  availableDates: Set<string>;
  loading: boolean;
  onMonthChange: (next: Date) => void;
  onSelectDate: (date: Date) => void;
}) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstOfMonth = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const leadingBlanks = firstOfMonth.getDay();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === monthIndex;
  const canGoPrev = !(isCurrentMonth || (year === today.getFullYear() && monthIndex < today.getMonth()) || year < today.getFullYear());

  const cells: (Date | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, monthIndex, i + 1)),
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => onMonthChange(new Date(year, monthIndex - 1, 1))}
          disabled={!canGoPrev}
          aria-label="Mes anterior"
          className="h-8 w-8 rounded-full border border-gray-200 flex items-center justify-center text-brand-dark hover:bg-brand-bg disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={16} />
        </button>
        <p className="text-sm font-semibold text-brand-dark">
          {MONTHS[monthIndex]} {year}
        </p>
        <button
          type="button"
          onClick={() => onMonthChange(new Date(year, monthIndex + 1, 1))}
          aria-label="Mes siguiente"
          className="h-8 w-8 rounded-full border border-gray-200 flex items-center justify-center text-brand-dark hover:bg-brand-bg"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase text-brand-gray mb-1">
        {DOW.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-brand-gray py-6 text-center">Cargando disponibilidad...</p>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (!d) return <div key={`blank-${i}`} />;
            const key = toDateKey(d);
            const isPast = d < today;
            const available = !isPast && availableDates.has(key);
            const active = selectedDate && toDateKey(selectedDate) === key;
            return (
              <button
                key={key}
                type="button"
                disabled={!available}
                onClick={() => onSelectDate(d)}
                className={`aspect-square rounded-lg border text-sm font-semibold flex flex-col items-center justify-center gap-0.5 transition-colors ${
                  active
                    ? "bg-brand-violet border-brand-violet text-white"
                    : available
                    ? "bg-white border-gray-200 text-brand-dark hover:border-brand-violet/40"
                    : "bg-brand-bg border-transparent text-brand-gray/50 cursor-not-allowed"
                }`}
              >
                <span>{d.getDate()}</span>
                {available && !active && <span className="h-1 w-1 rounded-full bg-brand-green" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verificar tipado**

Run: `npx tsc --noEmit`
Expected: sin errores nuevos en este archivo.

- [ ] **Step 3: Commit**

```bash
git add components/agendar/MonthAvailabilityCalendar.tsx
git commit -m "feat: add month grid calendar component for booking"
```

---

### Task 10: Wirear el calendario mensual en `BookingWizard`

**Files:**
- Modify: `components/agendar/BookingWizard.tsx:1-346` (archivo completo)

**Interfaces:**
- Consumes: `MonthAvailabilityCalendar` de Task 9, endpoint `GET /api/profesional/[id]/disponibilidad/mes` de Task 4, endpoint `GET /api/profesional/[id]/disponibilidad` con `serviceId` de Task 3.

- [ ] **Step 1: Reemplazar el strip de 21 días por el calendario mensual**

Reemplazar todo el contenido de `components/agendar/BookingWizard.tsx`:

```typescript
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, CheckCircle2, Clock, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { MonthAvailabilityCalendar } from "./MonthAvailabilityCalendar";

type Service = {
  id: string;
  title: string;
  price: string | null;
  currency: string;
  durationMin: number | null;
  serviceType: string | null;
};

type Professional = {
  id: string;
  name: string;
  specialty: string | null;
  location: string | null;
  avatarSrc: string | null;
};

const DOW_LONG = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function BookingWizard({
  username,
  professional,
  services,
  initialServiceId,
}: {
  username: string;
  professional: Professional;
  services: Service[];
  initialServiceId?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedService, setSelectedService] = useState<Service | null>(
    services.find((s) => s.id === initialServiceId) ?? services[0] ?? null
  );
  const [visibleMonth, setVisibleMonth] = useState<Date>(() => new Date());
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());
  const [loadingMonth, setLoadingMonth] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  useEffect(() => {
    setLoadingMonth(true);
    const monthParam = `${visibleMonth.getFullYear()}-${String(visibleMonth.getMonth() + 1).padStart(2, "0")}`;
    const durationMin = selectedService?.durationMin ?? 60;
    const serviceParam = selectedService?.id ? `&serviceId=${selectedService.id}` : "";
    fetch(`/api/profesional/${professional.id}/disponibilidad/mes?month=${monthParam}&durationMin=${durationMin}${serviceParam}`)
      .then((r) => r.json())
      .then((data: { dates?: string[] }) => setAvailableDates(new Set(data.dates ?? [])))
      .catch(() => setAvailableDates(new Set()))
      .finally(() => setLoadingMonth(false));
  }, [visibleMonth, selectedService, professional.id]);

  useEffect(() => {
    if (!selectedDate) return;
    setSelectedTime(null);
    setLoadingSlots(true);
    const durationMin = selectedService?.durationMin ?? 60;
    const serviceParam = selectedService?.id ? `&serviceId=${selectedService.id}` : "";
    fetch(`/api/profesional/${professional.id}/disponibilidad?date=${toDateKey(selectedDate)}&durationMin=${durationMin}${serviceParam}`)
      .then((r) => r.json())
      .then((data) => setSlots(data.slots ?? []))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [selectedDate, selectedService, professional.id]);

  async function confirmar() {
    if (!selectedDate || !selectedTime) return;
    setSubmitting(true);
    const [h, m] = selectedTime.split(":").map(Number);
    const startAt = new Date(selectedDate);
    startAt.setHours(h, m, 0, 0);

    try {
      const res = await fetch("/api/citas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ professionalId: professional.id, serviceId: selectedService?.id, startAt: startAt.toISOString() }),
      });
      const body = await res.json();
      if (res.status === 409) {
        toast.error("Ese horario ya no está disponible, elegí otro.");
        setStep(1);
        setSelectedTime(null);
        return;
      }
      if (res.ok && body.conversationId) setConversationId(body.conversationId);
      if (!res.ok) {
        toast.error("No se pudo confirmar la cita, intentá de nuevo.");
        return;
      }
      setDone(true);
    } catch {
      toast.error("Ocurrió un error, intentá de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-16 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-brand-green">
          <CheckCircle2 className="text-white" size={32} />
        </div>
        <h1 className="text-xl font-bold text-brand-dark mb-2">¡Cita confirmada!</h1>
        <p className="text-sm text-brand-gray mb-6">
          {professional.name} recibió tu reserva para el{" "}
          <b>
            {DOW_LONG[selectedDate!.getDay()]} {selectedDate!.getDate()} de {MONTHS[selectedDate!.getMonth()]}
          </b>{" "}
          a las <b>{selectedTime} hs</b>.
        </p>
        <div className="flex flex-col gap-2 items-center">
          {conversationId && (
            <Link
              href={`/cliente/mensajes/${conversationId}`}
              className="inline-block rounded-full bg-brand-violet text-white text-sm font-medium px-6 py-2.5 hover:opacity-90 transition-opacity"
            >
              Enviar mensaje a {professional.name}
            </Link>
          )}
          <Link
            href={`/perfil/profesional/${username}`}
            className="inline-block text-sm font-medium text-brand-dark px-6 py-2.5 hover:text-brand-violet transition-colors"
          >
            Volver al perfil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => (step === 1 ? router.back() : setStep(1))}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-brand-dark hover:bg-gray-50"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <p className="font-bold text-brand-dark">Reservá tu cita</p>
          <p className="text-xs text-brand-gray">con {professional.name}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 bg-white rounded-2xl border border-gray-200 p-3 mb-4">
        <Avatar className="h-11 w-11">
          {professional.avatarSrc && <AvatarImage src={professional.avatarSrc} alt={professional.name} />}
          <AvatarFallback className="bg-brand-violet text-white text-sm font-semibold">
            {professional.name[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-brand-dark truncate">
            {professional.name}
            {professional.specialty ? ` · ${professional.specialty}` : ""}
          </p>
          {selectedService && <p className="text-xs text-brand-violet font-medium truncate">{selectedService.title}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-5">
        {[1, 2].map((n) => (
          <div key={n} className="flex items-center gap-2 flex-1">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                step === n ? "bg-brand-violet text-white" : step > n ? "bg-brand-green text-white" : "bg-white border border-gray-200 text-brand-gray"
              }`}
            >
              {n}
            </div>
            <span className={`text-xs font-medium ${step === n ? "text-brand-dark" : "text-brand-gray"}`}>
              {n === 1 ? "Fecha y hora" : "Confirmación"}
            </span>
            {n === 1 && <div className={`h-0.5 flex-1 rounded ${step > 1 ? "bg-brand-green" : "bg-gray-200"}`} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          {services.length > 0 && (
            <div className="mb-5">
              <p className="text-sm font-semibold text-brand-dark mb-2">Servicio</p>
              <div className="flex flex-col gap-2">
                {services.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setSelectedService(s);
                      setSelectedDate(null);
                    }}
                    className={`text-left rounded-xl border px-3 py-2.5 transition-colors ${
                      selectedService?.id === s.id ? "border-brand-violet bg-brand-violet/5" : "border-gray-200 hover:border-brand-violet/40"
                    }`}
                  >
                    <p className="text-sm font-semibold text-brand-dark">{s.title}</p>
                    <p className="text-xs text-brand-gray">
                      {s.durationMin ? `${s.durationMin} min` : ""}
                      {s.price ? ` · $${Number(s.price).toLocaleString("es-AR")}` : ""}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="text-sm font-semibold text-brand-dark mb-2">Elegí un día</p>
          <MonthAvailabilityCalendar
            month={visibleMonth}
            selectedDate={selectedDate}
            availableDates={availableDates}
            loading={loadingMonth}
            onMonthChange={setVisibleMonth}
            onSelectDate={setSelectedDate}
          />

          {selectedDate && (
            <>
              <p className="text-sm font-semibold text-brand-dark mt-5 mb-2">Horarios disponibles</p>
              {loadingSlots ? (
                <p className="text-sm text-brand-gray">Cargando horarios...</p>
              ) : slots.length === 0 ? (
                <p className="text-sm text-brand-gray">No hay horarios disponibles ese día.</p>
              ) : (
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {slots.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSelectedTime(t)}
                      className={`rounded-lg border py-2 text-sm font-semibold transition-colors ${
                        selectedTime === t ? "bg-brand-violet border-brand-violet text-white" : "bg-white border-gray-200 text-brand-dark hover:border-brand-violet/40"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          <button
            type="button"
            disabled={!selectedDate || !selectedTime}
            onClick={() => setStep(2)}
            className="w-full mt-4 rounded-full bg-brand-green text-white text-sm font-semibold py-2.5 hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Continuar
          </button>
        </div>
      )}

      {step === 2 && selectedDate && selectedTime && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="bg-brand-dark px-5 py-4 text-white">
            <span className="inline-block text-[10px] font-bold uppercase tracking-wide bg-white/20 rounded-full px-2.5 py-1 mb-2">
              Tu cita
            </span>
            <p className="text-lg font-bold">{selectedService?.title ?? "Consulta general"}</p>
          </div>
          <div className="px-5 divide-y divide-gray-100">
            <div className="flex items-center gap-3 py-4">
              <Clock size={18} className="text-brand-violet" />
              <div>
                <p className="text-xs text-brand-gray font-medium">Duración</p>
                <p className="text-sm font-semibold text-brand-dark">{selectedService?.durationMin ?? 60} minutos</p>
              </div>
            </div>
            <div className="flex items-center gap-3 py-4">
              <Calendar size={18} className="text-brand-violet" />
              <div>
                <p className="text-xs text-brand-gray font-medium">Fecha y hora</p>
                <p className="text-sm font-semibold text-brand-dark">
                  {DOW_LONG[selectedDate.getDay()]} {selectedDate.getDate()} de {MONTHS[selectedDate.getMonth()]} · {selectedTime} hs
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 py-4">
              <User size={18} className="text-brand-violet" />
              <div>
                <p className="text-xs text-brand-gray font-medium">Profesional</p>
                <p className="text-sm font-semibold text-brand-dark">
                  {professional.name}
                  {professional.location ? ` · ${professional.location}` : ""}
                </p>
              </div>
            </div>
          </div>
          {selectedService?.price && (
            <div className="flex items-center justify-between bg-brand-bg px-5 py-4 border-t border-gray-200">
              <span className="text-sm font-semibold text-brand-dark">Total</span>
              <span className="text-xl font-bold text-brand-violet">
                {Number(selectedService.price).toLocaleString("es-AR", { style: "currency", currency: selectedService.currency })}
              </span>
            </div>
          )}
          <div className="flex gap-3 p-5 pt-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 rounded-full border border-gray-200 text-sm font-medium text-brand-dark py-2.5 hover:bg-gray-50 transition-colors"
            >
              Volver
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={confirmar}
              className="flex-1 rounded-full bg-brand-green text-white text-sm font-semibold py-2.5 hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {submitting ? "Confirmando..." : "Confirmar cita"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verificar tipado**

Run: `npx tsc --noEmit`
Expected: sin errores nuevos en este archivo.

- [ ] **Step 3: Commit**

```bash
git add components/agendar/BookingWizard.tsx
git commit -m "feat: replace day strip with month calendar in booking wizard"
```

- [ ] **Step 4: Verificación manual end-to-end (requiere DB migrada — Task 1 Step 3 nota)**

Con la migración de Prisma ya aplicada (permiso separado, fuera de este plan) y el server corriendo:
1. Login como profesional → `/profesional/agenda` → click "Configurar horario" → tildar Lun-Vie 9-18 → Guardar → toast de éxito.
2. Editar un servicio → step "Horarios" → agregar bloque Martes 20:00-21:00 → Publicar.
3. Login como cliente (o cambiar de modo) → ir al servicio con horario propio → "Agendar" → el grid mensual solo muestra punto verde en los martes → seleccionar un martes → slots muestran 20:00 (y siguientes según duración).
4. Agendar desde el perfil del profesional (sin servicio con horario propio, o servicio distinto) → el grid muestra disponibilidad según el horario general Lun-Vie 9-18.
5. Confirmar reserva completa (step 2 → Confirmar cita) sin errores en consola.

Reportar cualquier desvío antes de dar la tarea por terminada.

---

## Spec Coverage Check
- Modelo `ServiceAvailability` → Task 1.
- Resolución servicio > profesional > fallback, sin trackear origen → Task 2.
- Horario semanal general (config + persistencia) → Task 5, Task 6.
- Horario por servicio (config + persistencia) → Task 7, Task 8.
- Endpoint diario con `serviceId` → Task 3.
- Endpoint mensual para puntos verdes → Task 4.
- Calendario mensual cliente con navegación → Task 9, Task 10.
- Fallback sin `ServiceAvailability` configurada → cubierto en `resolveWeeklyWindows` (Task 2).
