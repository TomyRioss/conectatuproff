# Reseñas de profesional — design

## Objetivo

Mostrar sección "Reseñas" en `/perfil/profesional/[username]`. Cliente que tuvo una cita `COMPLETED` con ese profesional puede dejar 1 sola reseña (rating 1-5 + comentario opcional). Reseña editable solo por su autor.

## DB

`Review` (prisma/schema.prisma:568) agrega:

```prisma
@@unique([professionalId, clientId])
```

Migration nueva. Requiere permiso explícito (dado por usuario).

## API — `app/api/resenas/route.ts`

- **GET** `?professionalId=<id>`
  - Sesión no-CLIENT o sin sesión → `{ canReview: false, myReview: null }`.
  - Busca `Client` del session user. Busca `Review` existente (professionalId+clientId).
  - Si existe → `{ canReview: false, myReview: {...} }` (ya dejó la suya, edita en vez de crear).
  - Si no existe → chequea `Appointment.findFirst({ clientId, professionalId, status: "COMPLETED" })`. `canReview = !!appointment`.

- **POST** body `{ professionalId, rating, comment? }`
  - Requiere sesión CLIENT.
  - Valida rating 1-5 entero.
  - Valida `Appointment` COMPLETED existe para ese client+professional (401/403 si no).
  - `prisma.review.create` (constraint DB evita duplicado — catch `P2002` → 409 "REVIEW_EXISTS").

- **PUT** body `{ reviewId, rating, comment? }`
  - Requiere sesión CLIENT, y `review.clientId === client.id` (403 si no).
  - Actualiza rating/comment.

## UI

`app/perfil/profesional/[username]/page.tsx`: nueva sección debajo de "Paquetes":

```
<section>
  <h2>Reseñas</h2>
  <ReviewsList reviews={pro.reviews} />
  <ReviewFormClient professionalId={pro.id} /> {/* client component */}
</section>
```

`ReviewFormClient` (nuevo, `components/profesionales/ReviewFormClient.tsx`):
- On mount: GET `/api/resenas?professionalId=`.
- Si `myReview` existe → muestra form pre-llenado (editable) + botón "Guardar cambios" → PUT.
- Si `canReview` true y sin `myReview` → botón "Dejar reseña" → abre form (estrellas clickeables shadcn + Textarea) → POST.
- Si ninguna condición → no renderiza nada (sin sesión, no-cliente, o sin cita completada).
- Toast (shadcn `sonner`/`toast`) en éxito y error. Console.error server-side ya cubierto por catch en route.

## Fuera de alcance

- Moderación de reseñas (owner/admin).
- Borrado de reseña.
- Notificación al profesional por nueva reseña.
