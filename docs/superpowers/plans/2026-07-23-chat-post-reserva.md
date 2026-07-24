# Chat cliente-profesional post-reserva Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chat de texto entre cliente y profesional, con hilo persistente por par y actualización por polling cada 30s, accesible tras confirmar una reserva.

**Architecture:** 2 tablas nuevas (`Conversation`, `Message`) vía Prisma. API REST bajo `/api/mensajes`. UI client-component con `setInterval` polling. `POST /api/citas` crea/reutiliza la conversación al confirmar cita. Reutiliza `Notification` existente para avisos.

**Tech Stack:** Next.js App Router (Server Components + API routes), Prisma, NextAuth (`@/lib/auth`), Tailwind + shadcn/ui, `sonner` para toasts.

## Global Constraints
- Nunca CSS puro — solo TailwindCSS.
- Solo brand tokens Tailwind (`brand-green`, `brand-violet`, `brand-dark`, `brand-gray`, `brand-bg`) — nunca hex hardcodeado en markup.
- Nunca componentes de más de 500 líneas.
- Errores: `console.error` server-side + feedback visual (`toast`) al usuario, nunca silencioso.
- Sin frameworks de test en el proyecto (`package.json` no tiene jest/vitest) — verificación via `npx tsc --noEmit`, `npm run lint`, y checks manuales (`curl` para API, navegador para UI).
- No tocar `global.css`. No hardcodear SVGs salvo los ya usados con `lucide-react`.

---

## File Structure

- `prisma/schema.prisma` — agrega `Conversation`, `Message`, enum `SenderRole`, relaciones en `Professional`/`Client`.
- `app/api/mensajes/route.ts` — `GET` lista conversaciones del usuario logueado.
- `app/api/mensajes/[id]/route.ts` — `GET` mensajes (poll incremental), `POST` enviar mensaje.
- `app/api/citas/route.ts` — modificar: upsert de conversación tras crear la cita, devolver `conversationId`.
- `components/mensajes/ChatThread.tsx` — thread de mensajes + input, polling 30s.
- `components/mensajes/ConversationList.tsx` — lista de conversaciones.
- `app/(dashboard)/cliente/mensajes/page.tsx` — lista (server component, pasa datos a `ConversationList`).
- `app/(dashboard)/cliente/mensajes/[id]/page.tsx` — thread (server component, pasa datos a `ChatThread`).
- `app/(dashboard)/profesional/mensajes/page.tsx` y `[id]/page.tsx` — idem para profesional.
- `components/agendar/BookingWizard.tsx` — modificar: guardar `conversationId` de la respuesta, botón "Enviar mensaje" en pantalla de éxito.
- `components/layout/Navbar.tsx` — modificar: wire ícono `MessageSquare` a `/cliente/mensajes` o `/profesional/mensajes`.

---

### Task 1: Schema Prisma — Conversation y Message

**Files:**
- Modify: `prisma/schema.prisma`

**Interfaces:**
- Produces: modelos Prisma `Conversation { id, professionalId, clientId, createdAt, updatedAt }`, `Message { id, conversationId, senderRole: SenderRole, body, createdAt }`, enum `SenderRole { CLIENT, PROFESSIONAL }`. Cliente Prisma expone `prisma.conversation` y `prisma.message`.

- [ ] **Step 1: Agregar modelos al schema**

En `prisma/schema.prisma`, después del modelo `Appointment` (busca el bloque que termina en `@@map("appointments")`, alrededor de la línea 545 antes de `model Notification`), agregar:

```prisma
// ─── Conversations ────────────────────────────────────────────────────────────

enum SenderRole {
  CLIENT
  PROFESSIONAL
}

model Conversation {
  id             String   @id @default(cuid())
  professionalId String
  clientId       String
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  professional Professional @relation(fields: [professionalId], references: [id], onDelete: Cascade)
  client       Client       @relation(fields: [clientId], references: [id], onDelete: Cascade)
  messages     Message[]

  @@unique([professionalId, clientId])
  @@map("conversations")
}

model Message {
  id             String     @id @default(cuid())
  conversationId String
  senderRole     SenderRole
  body           String     @db.Text
  createdAt      DateTime   @default(now())

  conversation Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)

  @@index([conversationId, createdAt])
  @@map("messages")
}
```

- [ ] **Step 2: Agregar relaciones inversas**

En `model Professional`, dentro del bloque de relaciones (junto a `favoritedBy   Favorite[]`, línea ~178), agregar:

```prisma
  conversations Conversation[]
```

En `model Client`, dentro del bloque de relaciones (junto a `clientPackages  ClientPackage[]`, línea ~244), agregar:

```prisma
  conversations Conversation[]
```

- [ ] **Step 3: Correr migración**

Run: `npx prisma migrate dev --name add_conversations_and_messages`
Expected: `Your database is now in sync with your schema.` y genera cliente Prisma sin errores.

- [ ] **Step 4: Verificar tipos generados**

Run: `npx tsc --noEmit`
Expected: sin errores nuevos relacionados a `prisma.conversation` / `prisma.message`.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat: add Conversation and Message models"
```

---

### Task 2: API — listar y crear mensajes de una conversación

**Files:**
- Create: `app/api/mensajes/[id]/route.ts`

**Interfaces:**
- Consumes: `auth()` de `@/lib/auth` (retorna `session.user.id`, `session.user.role`), `prisma` de `@/lib/prisma`.
- Produces:
  - `GET /api/mensajes/[id]?since=<ISO>` → `{ messages: { id, senderRole, body, createdAt }[] }`
  - `POST /api/mensajes/[id]` body `{ body: string }` → `{ ok: true, message: { id, senderRole, body, createdAt } }`

- [ ] **Step 1: Implementar route**

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getMembership(conversationId: string, userId: string, role?: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { professional: { select: { userId: true } }, client: { select: { userId: true } } },
  });
  if (!conversation) return null;
  const isProfessional = role === "PROFESSIONAL" && conversation.professional.userId === userId;
  const isClient = role === "CLIENT" && conversation.client.userId === userId;
  if (!isProfessional && !isClient) return null;
  return { senderRole: isProfessional ? ("PROFESSIONAL" as const) : ("CLIENT" as const) };
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { id } = await params;
  const role = (session.user as { role?: string }).role;
  const membership = await getMembership(id, session.user.id, role);
  if (!membership) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const since = new URL(req.url).searchParams.get("since");

  try {
    const messages = await prisma.message.findMany({
      where: { conversationId: id, ...(since ? { createdAt: { gt: new Date(since) } } : {}) },
      orderBy: { createdAt: "asc" },
      select: { id: true, senderRole: true, body: true, createdAt: true },
    });
    return NextResponse.json({ messages });
  } catch (e) {
    console.error("GET /api/mensajes/[id]", e);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { id } = await params;
  const role = (session.user as { role?: string }).role;
  const membership = await getMembership(id, session.user.id, role);
  if (!membership) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const body = await req.json();
  const text = typeof body.body === "string" ? body.body.trim() : "";
  if (!text) return NextResponse.json({ error: "EMPTY_BODY" }, { status: 400 });

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      select: {
        professional: { select: { userId: true, firstName: true, lastName: true } },
        client: { select: { userId: true, firstName: true, lastName: true } },
      },
    });
    if (!conversation) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

    const message = await prisma.message.create({
      data: { conversationId: id, senderRole: membership.senderRole, body: text },
      select: { id: true, senderRole: true, body: true, createdAt: true },
    });

    await prisma.conversation.update({ where: { id }, data: { updatedAt: new Date() } });

    const recipientUserId =
      membership.senderRole === "PROFESSIONAL" ? conversation.client.userId : conversation.professional.userId;
    const senderName =
      membership.senderRole === "PROFESSIONAL"
        ? `${conversation.professional.firstName} ${conversation.professional.lastName}`
        : `${conversation.client.firstName} ${conversation.client.lastName}`;

    await prisma.notification.create({
      data: {
        userId: recipientUserId,
        type: "message",
        title: `Nuevo mensaje de ${senderName}`,
        body: text.slice(0, 120),
        link: `/mensajes/${id}`,
      },
    });

    return NextResponse.json({ ok: true, message });
  } catch (e) {
    console.error("POST /api/mensajes/[id]", e);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sin errores en `app/api/mensajes/[id]/route.ts`.

- [ ] **Step 3: Verificación manual (requiere sesión activa vía navegador, copiar cookie de sesión)**

Con el server corriendo (`npm run dev`) y una conversación de prueba creada manualmente en la DB (o tras completar Task 4), probar:

Run: `curl -i -H "Cookie: <cookie-de-sesion>" "http://localhost:3000/api/mensajes/<conversationId>"`
Expected: `200` con `{"messages":[]}` si no hay mensajes, o `404` si el usuario no pertenece a la conversación.

- [ ] **Step 4: Commit**

```bash
git add app/api/mensajes/[id]/route.ts
git commit -m "feat: add GET/POST /api/mensajes/[id]"
```

---

### Task 3: API — listar conversaciones del usuario

**Files:**
- Create: `app/api/mensajes/route.ts`

**Interfaces:**
- Consumes: mismo patrón de auth que Task 2.
- Produces: `GET /api/mensajes` → `{ conversations: { id, otherName, otherAvatar, lastMessage: string | null, lastMessageAt: string | null }[] }`, ordenadas por `updatedAt desc`.

- [ ] **Step 1: Implementar route**

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const role = (session.user as { role?: string }).role;

  try {
    const conversations = await prisma.conversation.findMany({
      where:
        role === "PROFESSIONAL"
          ? { professional: { userId: session.user.id } }
          : { client: { userId: session.user.id } },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        updatedAt: true,
        professional: { select: { firstName: true, lastName: true, avatarUrl: true, user: { select: { image: true } } } },
        client: { select: { firstName: true, lastName: true, avatarUrl: true, user: { select: { image: true } } } },
        messages: { orderBy: { createdAt: "desc" }, take: 1, select: { body: true, createdAt: true } },
      },
    });

    const result = conversations.map((c) => {
      const other = role === "PROFESSIONAL" ? c.client : c.professional;
      const avatar = other.avatarUrl ? `/api/avatar?key=${encodeURIComponent(other.avatarUrl)}` : other.user.image;
      return {
        id: c.id,
        otherName: `${other.firstName} ${other.lastName}`,
        otherAvatar: avatar,
        lastMessage: c.messages[0]?.body ?? null,
        lastMessageAt: c.messages[0]?.createdAt ?? null,
      };
    });

    return NextResponse.json({ conversations: result });
  } catch (e) {
    console.error("GET /api/mensajes", e);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sin errores nuevos.

- [ ] **Step 3: Commit**

```bash
git add app/api/mensajes/route.ts
git commit -m "feat: add GET /api/mensajes conversation list"
```

---

### Task 4: `POST /api/citas` crea/reutiliza conversación

**Files:**
- Modify: `app/api/citas/route.ts:53-66`

**Interfaces:**
- Consumes: `prisma.conversation.upsert`.
- Produces: respuesta `POST /api/citas` ahora incluye `conversationId: string`.

- [ ] **Step 1: Modificar el bloque de creación de la cita**

En `app/api/citas/route.ts`, reemplazar (líneas 53-66):

```typescript
    const appointment = await prisma.appointment.create({
      data: {
        professionalId,
        clientId: client.id,
        serviceId: serviceId ?? null,
        priceAtBooking: service?.price ?? null,
        currency: service?.currency ?? "ARS",
        startAt: start,
        durationMin,
        status: "PENDING",
      },
    });

    return NextResponse.json({ ok: true, id: appointment.id });
```

por:

```typescript
    const appointment = await prisma.appointment.create({
      data: {
        professionalId,
        clientId: client.id,
        serviceId: serviceId ?? null,
        priceAtBooking: service?.price ?? null,
        currency: service?.currency ?? "ARS",
        startAt: start,
        durationMin,
        status: "PENDING",
      },
    });

    const conversation = await prisma.conversation.upsert({
      where: { professionalId_clientId: { professionalId, clientId: client.id } },
      update: {},
      create: { professionalId, clientId: client.id },
      select: { id: true },
    });

    return NextResponse.json({ ok: true, id: appointment.id, conversationId: conversation.id });
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sin errores. El nombre del índice único `professionalId_clientId` es generado por Prisma a partir de `@@unique([professionalId, clientId])`; si `tsc`/`prisma generate` marca error de nombre, revisar `node_modules/.prisma/client/index.d.ts` por el nombre exacto del campo compuesto y ajustar.

- [ ] **Step 3: Commit**

```bash
git add app/api/citas/route.ts
git commit -m "feat: create conversation on booking confirmation"
```

---

### Task 5: `ChatThread` component (polling + envío)

**Files:**
- Create: `components/mensajes/ChatThread.tsx`

**Interfaces:**
- Consumes: `GET /api/mensajes/[id]?since=`, `POST /api/mensajes/[id]` (Task 2). `toast` de `sonner`.
- Produces: `ChatThread({ conversationId, currentRole, otherName, otherAvatar, backHref }: ChatThreadProps)` — export default, usado por las 4 páginas de thread.

- [ ] **Step 1: Implementar componente**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

type Message = {
  id: string;
  senderRole: "CLIENT" | "PROFESSIONAL";
  body: string;
  createdAt: string;
};

export type ChatThreadProps = {
  conversationId: string;
  currentRole: "CLIENT" | "PROFESSIONAL";
  otherName: string;
  otherAvatar: string | null;
  backHref: string;
};

const POLL_MS = 30000;

export default function ChatThread({ conversationId, currentRole, otherName, otherAvatar, backHref }: ChatThreadProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastCreatedAtRef = useRef<string | null>(null);

  async function fetchNew() {
    const since = lastCreatedAtRef.current;
    const url = since
      ? `/api/mensajes/${conversationId}?since=${encodeURIComponent(since)}`
      : `/api/mensajes/${conversationId}`;
    try {
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      const newMessages: Message[] = data.messages ?? [];
      if (newMessages.length > 0) {
        setMessages((prev) => [...prev, ...newMessages]);
        lastCreatedAtRef.current = newMessages[newMessages.length - 1].createdAt;
      }
    } catch (e) {
      console.error("fetchNew mensajes", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNew();
    const interval = setInterval(fetchNew, POLL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput("");
    try {
      const res = await fetch(`/api/mensajes/${conversationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      if (!res.ok) {
        toast.error("No se pudo enviar el mensaje, intentá de nuevo.");
        setInput(text);
        return;
      }
      const data = await res.json();
      setMessages((prev) => [...prev, data.message]);
      lastCreatedAtRef.current = data.message.createdAt;
    } catch (e) {
      console.error("send mensaje", e);
      toast.error("Ocurrió un error al enviar el mensaje.");
      setInput(text);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] max-w-2xl mx-auto">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white">
        <Link
          href={backHref}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-brand-dark hover:bg-gray-50 shrink-0"
        >
          <ArrowLeft size={16} />
        </Link>
        <Avatar className="h-9 w-9">
          {otherAvatar && <AvatarImage src={otherAvatar} alt={otherName} />}
          <AvatarFallback className="bg-brand-violet text-white text-xs font-semibold">
            {otherName[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <p className="font-semibold text-brand-dark truncate">{otherName}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2 bg-brand-bg">
        {loading ? (
          <p className="text-sm text-brand-gray text-center mt-6">Cargando mensajes...</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-brand-gray text-center mt-6">Todavía no hay mensajes. Escribí el primero.</p>
        ) : (
          messages.map((m) => {
            const mine = m.senderRole === currentRole;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                    mine ? "bg-brand-violet text-white" : "bg-white border border-gray-200 text-brand-dark"
                  }`}
                >
                  {m.body}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-200 bg-white">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Escribí un mensaje..."
          className="flex-1 rounded-full border border-gray-200 px-4 py-2.5 text-sm text-brand-dark placeholder:text-brand-gray focus:outline-none focus:ring-2 focus:ring-brand-violet/30 focus:border-brand-violet"
        />
        <button
          type="button"
          onClick={send}
          disabled={sending || !input.trim()}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-green text-white disabled:opacity-40 shrink-0"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sin errores nuevos.

- [ ] **Step 3: Commit**

```bash
git add components/mensajes/ChatThread.tsx
git commit -m "feat: add ChatThread component with 30s polling"
```

---

### Task 6: `ConversationList` component

**Files:**
- Create: `components/mensajes/ConversationList.tsx`

**Interfaces:**
- Consumes: nada (recibe props ya resueltas server-side).
- Produces: `ConversationList({ conversations, basePath }: ConversationListProps)` — export default.

- [ ] **Step 1: Implementar componente**

```tsx
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare } from "lucide-react";

export type ConversationListItem = {
  id: string;
  otherName: string;
  otherAvatar: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
};

export type ConversationListProps = {
  conversations: ConversationListItem[];
  basePath: string;
};

export default function ConversationList({ conversations, basePath }: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <MessageSquare size={40} className="mx-auto text-brand-gray mb-3" />
        <p className="text-brand-dark font-semibold mb-1">Todavía no tenés conversaciones</p>
        <p className="text-sm text-brand-gray">Cuando reserves una cita, vas a poder chatear acá.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 flex flex-col gap-2">
      {conversations.map((c) => (
        <Link
          key={c.id}
          href={`${basePath}/${c.id}`}
          className="flex items-center gap-3 bg-white rounded-2xl border border-gray-200 p-3 hover:border-brand-violet/40 transition-colors"
        >
          <Avatar className="h-11 w-11">
            {c.otherAvatar && <AvatarImage src={c.otherAvatar} alt={c.otherName} />}
            <AvatarFallback className="bg-brand-violet text-white text-sm font-semibold">
              {c.otherName[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-brand-dark truncate">{c.otherName}</p>
            <p className="text-xs text-brand-gray truncate">{c.lastMessage ?? "Sin mensajes todavía"}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sin errores nuevos.

- [ ] **Step 3: Commit**

```bash
git add components/mensajes/ConversationList.tsx
git commit -m "feat: add ConversationList component"
```

---

### Task 7: Páginas de mensajes — cliente

**Files:**
- Create: `app/(dashboard)/cliente/mensajes/page.tsx`
- Create: `app/(dashboard)/cliente/mensajes/[id]/page.tsx`

**Interfaces:**
- Consumes: `ConversationList` (Task 6), `ChatThread` (Task 5), `auth()`, `prisma`.

- [ ] **Step 1: Página de lista**

```tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ConversationList, { type ConversationListItem } from "@/components/mensajes/ConversationList";

export const dynamic = "force-dynamic";

export default async function ClienteMensajesPage() {
  const session = await auth();
  if (!session?.user?.id || (session.user as { role?: string }).role !== "CLIENT") {
    redirect("/login?callbackUrl=/cliente/mensajes");
  }

  const client = await prisma.client.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!client) redirect("/");

  const conversations = await prisma.conversation.findMany({
    where: { clientId: client.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      professional: { select: { firstName: true, lastName: true, avatarUrl: true, user: { select: { image: true } } } },
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: { body: true, createdAt: true } },
    },
  });

  const items: ConversationListItem[] = conversations.map((c) => ({
    id: c.id,
    otherName: `${c.professional.firstName} ${c.professional.lastName}`,
    otherAvatar: c.professional.avatarUrl
      ? `/api/avatar?key=${encodeURIComponent(c.professional.avatarUrl)}`
      : c.professional.user.image,
    lastMessage: c.messages[0]?.body ?? null,
    lastMessageAt: c.messages[0]?.createdAt.toISOString() ?? null,
  }));

  return (
    <main className="min-h-screen bg-brand-bg pb-20">
      <h1 className="max-w-2xl mx-auto px-4 pt-6 text-xl font-bold text-brand-dark">Mensajes</h1>
      <ConversationList conversations={items} basePath="/cliente/mensajes" />
    </main>
  );
}
```

- [ ] **Step 2: Página de thread**

```tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import ChatThread from "@/components/mensajes/ChatThread";

export const dynamic = "force-dynamic";

export default async function ClienteMensajeThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id || (session.user as { role?: string }).role !== "CLIENT") {
    redirect("/login?callbackUrl=/cliente/mensajes");
  }

  const { id } = await params;

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    select: {
      client: { select: { userId: true } },
      professional: { select: { firstName: true, lastName: true, avatarUrl: true, user: { select: { image: true } } } },
    },
  });

  if (!conversation || conversation.client.userId !== session.user.id) notFound();

  const otherAvatar = conversation.professional.avatarUrl
    ? `/api/avatar?key=${encodeURIComponent(conversation.professional.avatarUrl)}`
    : conversation.professional.user.image;

  return (
    <main className="min-h-screen bg-brand-bg">
      <ChatThread
        conversationId={id}
        currentRole="CLIENT"
        otherName={`${conversation.professional.firstName} ${conversation.professional.lastName}`}
        otherAvatar={otherAvatar}
        backHref="/cliente/mensajes"
      />
    </main>
  );
}
```

- [ ] **Step 3: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sin errores nuevos.

- [ ] **Step 4: Commit**

```bash
git add "app/(dashboard)/cliente/mensajes"
git commit -m "feat: add cliente mensajes pages"
```

---

### Task 8: Páginas de mensajes — profesional

**Files:**
- Create: `app/(dashboard)/profesional/mensajes/page.tsx`
- Create: `app/(dashboard)/profesional/mensajes/[id]/page.tsx`

**Interfaces:**
- Consumes: igual que Task 7, espejado para rol `PROFESSIONAL`.

- [ ] **Step 1: Página de lista**

```tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ConversationList, { type ConversationListItem } from "@/components/mensajes/ConversationList";

export const dynamic = "force-dynamic";

export default async function ProfesionalMensajesPage() {
  const session = await auth();
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PROFESSIONAL") {
    redirect("/profesional/login?callbackUrl=/profesional/mensajes");
  }

  const professional = await prisma.professional.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!professional) redirect("/");

  const conversations = await prisma.conversation.findMany({
    where: { professionalId: professional.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      client: { select: { firstName: true, lastName: true, avatarUrl: true, user: { select: { image: true } } } },
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: { body: true, createdAt: true } },
    },
  });

  const items: ConversationListItem[] = conversations.map((c) => ({
    id: c.id,
    otherName: `${c.client.firstName} ${c.client.lastName}`,
    otherAvatar: c.client.avatarUrl ? `/api/avatar?key=${encodeURIComponent(c.client.avatarUrl)}` : c.client.user.image,
    lastMessage: c.messages[0]?.body ?? null,
    lastMessageAt: c.messages[0]?.createdAt.toISOString() ?? null,
  }));

  return (
    <main className="min-h-screen bg-brand-bg pb-20">
      <h1 className="max-w-2xl mx-auto px-4 pt-6 text-xl font-bold text-brand-dark">Mensajes</h1>
      <ConversationList conversations={items} basePath="/profesional/mensajes" />
    </main>
  );
}
```

- [ ] **Step 2: Página de thread**

```tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import ChatThread from "@/components/mensajes/ChatThread";

export const dynamic = "force-dynamic";

export default async function ProfesionalMensajeThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PROFESSIONAL") {
    redirect("/profesional/login?callbackUrl=/profesional/mensajes");
  }

  const { id } = await params;

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    select: {
      professional: { select: { userId: true } },
      client: { select: { firstName: true, lastName: true, avatarUrl: true, user: { select: { image: true } } } },
    },
  });

  if (!conversation || conversation.professional.userId !== session.user.id) notFound();

  const otherAvatar = conversation.client.avatarUrl
    ? `/api/avatar?key=${encodeURIComponent(conversation.client.avatarUrl)}`
    : conversation.client.user.image;

  return (
    <main className="min-h-screen bg-brand-bg">
      <ChatThread
        conversationId={id}
        currentRole="PROFESSIONAL"
        otherName={`${conversation.client.firstName} ${conversation.client.lastName}`}
        otherAvatar={otherAvatar}
        backHref="/profesional/mensajes"
      />
    </main>
  );
}
```

- [ ] **Step 3: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sin errores nuevos.

- [ ] **Step 4: Commit**

```bash
git add "app/(dashboard)/profesional/mensajes"
git commit -m "feat: add profesional mensajes pages"
```

---

### Task 9: BookingWizard — CTA al chat tras confirmar

**Files:**
- Modify: `components/agendar/BookingWizard.tsx`

**Interfaces:**
- Consumes: respuesta de `POST /api/citas` ahora incluye `conversationId` (Task 4).

- [ ] **Step 1: Guardar `conversationId` en estado**

En `components/agendar/BookingWizard.tsx`, agregar estado junto a los demás (línea 52, después de `const [done, setDone] = useState(false);`):

```typescript
  const [conversationId, setConversationId] = useState<string | null>(null);
```

- [ ] **Step 2: Leer `conversationId` de la respuesta**

Reemplazar (líneas 89-95):

```typescript
      const body = await res.json();
      if (res.status === 409) {
        toast.error("Ese horario ya no está disponible, elegí otro.");
        setStep(1);
        setSelectedTime(null);
        return;
      }
```

por:

```typescript
      const body = await res.json();
      if (res.status === 409) {
        toast.error("Ese horario ya no está disponible, elegí otro.");
        setStep(1);
        setSelectedTime(null);
        return;
      }
      if (res.ok && body.conversationId) setConversationId(body.conversationId);
```

- [ ] **Step 3: Agregar botón "Enviar mensaje" en pantalla de éxito**

Reemplazar el bloque de retorno de éxito (líneas 108-130):

```tsx
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
        <Link
          href={`/perfil/profesional/${username}`}
          className="inline-block rounded-full bg-brand-green text-white text-sm font-medium px-6 py-2.5 hover:opacity-90 transition-opacity"
        >
          Volver al perfil
        </Link>
      </div>
    );
  }
```

por:

```tsx
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
```

- [ ] **Step 4: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sin errores nuevos.

- [ ] **Step 5: Commit**

```bash
git add components/agendar/BookingWizard.tsx
git commit -m "feat: link booking success screen to chat"
```

---

### Task 10: Navbar — wire ícono de mensajes

**Files:**
- Modify: `components/layout/Navbar.tsx:217-227` (desktop), `components/layout/Navbar.tsx:319-326` (mobile)

**Interfaces:**
- Consumes: `role` ya calculado en el componente (línea 125: `const role = (session?.user as any)?.role`).

- [ ] **Step 1: Wire versión desktop**

Reemplazar (líneas 221-223):

```tsx
              <button aria-label="Mensajes" className="text-brand-gray hover:text-brand-dark transition-colors">
                <MessageSquare size={22} />
              </button>
```

por:

```tsx
              <Link
                href={role === "PROFESSIONAL" ? "/profesional/mensajes" : "/cliente/mensajes"}
                aria-label="Mensajes"
                className="text-brand-gray hover:text-brand-dark transition-colors"
              >
                <MessageSquare size={22} />
              </Link>
```

- [ ] **Step 2: Wire versión mobile**

Reemplazar (líneas 321-323):

```tsx
            <button aria-label="Mensajes" className="p-2 rounded-xl text-brand-gray hover:text-brand-dark hover:bg-white transition-colors">
              <MessageSquare size={20} />
            </button>
```

por:

```tsx
            <Link
              href={role === "PROFESSIONAL" ? "/profesional/mensajes" : "/cliente/mensajes"}
              aria-label="Mensajes"
              className="p-2 rounded-xl text-brand-gray hover:text-brand-dark hover:bg-white transition-colors"
              onClick={() => setOpen(false)}
            >
              <MessageSquare size={20} />
            </Link>
```

- [ ] **Step 3: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sin errores nuevos.

- [ ] **Step 4: Verificación manual**

Run: `npm run dev`, loguear como cliente, click en el ícono de mensajes en navbar.
Expected: navega a `/cliente/mensajes` sin error 404/500.

- [ ] **Step 5: Commit**

```bash
git add components/layout/Navbar.tsx
git commit -m "feat: wire navbar messages icon to inbox"
```

---

### Task 11: Verificación end-to-end manual

**Files:** ninguno (solo verificación)

- [ ] **Step 1: Lint completo**

Run: `npm run lint`
Expected: sin errores nuevos (warnings preexistentes son aceptables si no son de los archivos tocados).

- [ ] **Step 2: Type check completo**

Run: `npx tsc --noEmit`
Expected: 0 errores.

- [ ] **Step 3: Flujo manual completo en navegador**

1. Loguear como cliente, ir a un perfil de profesional, click "Reservar" → completar wizard → confirmar cita.
2. En pantalla de éxito, click "Enviar mensaje a [nombre]" → llega a `/cliente/mensajes/[id]` con thread vacío.
3. Escribir un mensaje, click enviar → aparece en el thread (burbuja `brand-violet`, alineada derecha).
4. Loguear como el profesional dueño de esa cita (otra sesión/navegador) → click ícono mensajes en navbar → ver la conversación en `/profesional/mensajes` con el último mensaje.
5. Entrar al thread → ver el mensaje del cliente (burbuja blanca, alineada izquierda) → responder.
6. Volver a la sesión de cliente, esperar ≤30s sin recargar → confirmar que la respuesta del profesional aparece sola (polling).

Expected: todos los pasos funcionan sin error de consola ni toast de error.

- [ ] **Step 4: Commit final (si hubo ajustes)**

Si el flujo manual detectó bugs y se corrigieron, commitear esos fixes puntuales con mensaje descriptivo del bug corregido.
