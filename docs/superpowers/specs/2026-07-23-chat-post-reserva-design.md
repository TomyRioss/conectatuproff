# Chat cliente-profesional post-reserva

## Contexto
Booking wizard (`components/agendar/BookingWizard.tsx`, `/api/citas`) ya existe y cubre el flujo de reserva (servicio, fecha, hora, resumen, confirmación) equivalente al mockup `conectatuproff-reserva-estetica.html`. Falta: chat entre cliente y profesional tras confirmar una cita.

## Alcance
- Chat con polling cada 30s (no realtime/websocket).
- Hilo persistente por par (professionalId, clientId) — no por cita individual.
- Pantalla propia de mensajes (no modal/panel embebido).
- Reutiliza modelo `Notification` existente para avisar mensajes nuevos (NotificationBell ya wired).

## Schema (Prisma)
```prisma
model Conversation {
  id             String   @id @default(cuid())
  professionalId String
  clientId       String
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  professional Professional @relation(fields: [professionalId], references: [id])
  client       Client       @relation(fields: [clientId], references: [id])
  messages     Message[]

  @@unique([professionalId, clientId])
  @@map("conversations")
}

enum SenderRole {
  CLIENT
  PROFESSIONAL
}

model Message {
  id             String       @id @default(cuid())
  conversationId String
  senderRole     SenderRole
  body           String       @db.Text
  createdAt      DateTime     @default(now())

  conversation Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)

  @@index([conversationId, createdAt])
  @@map("messages")
}
```
Add back-relations `conversations Conversation[]` on `Professional` and `Client`.

## API
- `GET /api/mensajes` — lista de conversaciones del usuario logueado (rol-aware), con último mensaje + nombre de la contraparte.
- `GET /api/mensajes/[id]` — mensajes de una conversación. Query `?since=<ISO>` para poll incremental. Valida que el usuario pertenece a la conversación.
- `POST /api/mensajes/[id]` — envía mensaje `{ body }`. Crea `Notification` para la contraparte (`type: "message"`, `link: /mensajes/[id]`).

## Creación de conversación
En `POST /api/citas`, tras crear el `Appointment`: `prisma.conversation.upsert` por `[professionalId, clientId]`. Devolver `conversationId` en la respuesta.

## UI
- `components/mensajes/ChatThread.tsx` — client component: lista de mensajes + input, `setInterval` poll 30s, scroll al fondo en nuevo mensaje. Usa brand tokens (`brand-violet` burbuja propia, `brand-bg` burbuja ajena).
- `components/mensajes/ConversationList.tsx` — lista de conversaciones (avatar, nombre, último mensaje, hora).
- `app/(dashboard)/cliente/mensajes/page.tsx` y `[id]/page.tsx`.
- `app/(dashboard)/profesional/mensajes/page.tsx` y `[id]/page.tsx`.
- `BookingWizard`: pantalla de éxito agrega botón "Enviar mensaje" → `/cliente/mensajes/[conversationId]` (usa `conversationId` devuelto por `/api/citas`).
- `Navbar.tsx`: el ícono `MessageSquare` (actualmente sin acción) enlaza a `/cliente/mensajes` o `/profesional/mensajes` según `role`.

## Errores
- Fetch de mensajes/envío fallido → toast error, log server-side (ya es el patrón del proyecto).
- Conversación inexistente o ajena → 404/403.

## Fuera de alcance
- Realtime (WS/SSE/Pusher).
- Adjuntos, edición/borrado de mensajes, indicador "escribiendo", read receipts.
