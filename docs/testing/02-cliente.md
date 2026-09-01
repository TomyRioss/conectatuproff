# E2E — Cliente autenticado

Método: trazado de código solo-lectura · 2026-08-25

## Resumen

| # | Caso de uso | Estado | Máx severidad |
|---|---|---|---|
| 1 | Dashboard y perfil propio | OK con riesgos (PATCH sin zod) | P1 |
| 2 | Turnos/citas (reservar, cancelar) | **BUG** — race double-booking, sin revalidación | P1 |
| 3 | Mensajes + chat con asistente | OK (ownership sólido, polling 30s) | P2 |
| 4 | Favoritos | **BUG** — fuga datos sensibles en GET | **P0 (F-02)** |
| 5 | Reseñas | **BUG** — duplicables (unique faltante) | P1 |
| 6 | Notificaciones | OK (badge clamped, PATCH sin zod) | P2 |
| 7 | Chatbot AI (Mora) | **BUG** — sin auth ni rate-limit | P1 |

## Hallazgos

### F-02 [P0] Fuga de tokens Google y DNI vía `GET /api/favoritos`
- `app/api/favoritos/route.ts:11-14`: `include` completo sobre `professional` → devuelve todas las columnas (tokens OAuth, fotos DNI, teléfono, mpPreapprovalId) a cualquier usuario autenticado.
- Hoy el frontend no lo consume pero el endpoint está vivo y explotable.
- **Fix:** `select` explícito público. Rotar tokens ya almacenados.

### F-06 [P1] Doble reserva por race condition
- `app/api/citas/route.ts:83-109`: findMany de solapamientos + create sin transacción ni constraint. Dos requests concurrentes pasan ambas el check → mismo slot reservado dos veces.
- **Fix:** `$transaction` serializable / advisory lock / constraint de exclusión Postgres; catch P2002 → 409.

### F-07 [P1] Booking sin revalidación server-side
- `app/api/citas/route.ts:50-78`: valida solapamiento con citas pero NO que el profesional exista/`isActive`/`isVerified`, NI que el slot caiga en ventanas de disponibilidad o fuera de bloqueos. Con curl se reserva domingo 3AM o encima de vacaciones del pro. FK inexistente → 500 genérico. Body cast `as` sin zod (línea :57).
- **Fix:** revalidar contra `resolveWeeklyWindows` + estado del pro antes de crear.

### F-08 [P1] Reseñas duplicables
- `app/api/resenas/route.ts:36-38`: catch P2002 → `REVIEW_EXISTS` es **código muerto**: `Review` NO tiene `@@unique([clientId, professionalId])` (`schema.prisma:568-582`). Mismo cliente puede dejar N reseñas (curl directo) → inflado de rating. UI lo mitiga solo ocultando el botón.
- **Fix:** agregar unique (+ migración limpiando duplicados previos).

### F-09 [P1] Chatbot abierto
- `app/api/chatbot/route.ts:16-27`: sin `auth()`, sin rate-limit, acepta array `messages` arbitrario con roles no validados (jailbreak posible inyectando `role:"system"`). Historial completo reenviado cada mensaje sin truncado (costo creciente).
- **Fix:** exigir sesión + rate-limit + zod `{role:user|assistant}` + cap caracteres.

### Otros hallazgos

| ID-ish | Hallazgo | Archivo | Severidad | Fix |
|---|---|---|---|---|
| C-01 | `PATCH /api/cliente/perfil` sin try/catch ni zod: `parseInt(dni)` no numérico → NaN → 500 crudo | `cliente/perfil/route.ts:22` | P1 | zod + catch → 400 |
| C-02 | `avatarUrl` acepta key arbitraria → cliente puede apuntar avatar a keys ajenas (`dni/...`); `/api/avatar` es redirect público a cualquier key | `cliente/perfil/route.ts:20`, `avatar/route.ts:4-9` | P2 | Validar prefijo propio |
| C-03 | `upload-url` acepta cualquier contentType (`text/html`→`.html`) | `cliente/upload-url/route.ts:13-14` | P2 | Allowlist igual que upload-avatar |
| C-04 | Favoritos mobile: botón `<button>` sin onClick ni Link → `/favoritos` inaccesible desde menú móvil | `Navbar.tsx:383-385` | P2 | Envolver en Link |
| C-05 | Reprogramar turno NO existe para cliente (PATCH solo acepta `CANCELLED`) | `citas/[id]/route.ts:15-17` | P2 | Soportar nuevo startAt con re-check, o documentar cancelar+reservar |
| C-06 | Recurrencia de turnos dead code: campos en schema (`isRecurring`, `recurrenceType`, etc.) con 0 referencias en app | `schema.prisma:546-550` | P2 | Implementar o remover |
| C-07 | Cancelación de cliente no notifica al profesional (ni Notification ni email); creación sí manda email | `citas/route.ts:123-134` | P2 | notification `appointment_cancelled` |
| C-08 | Rating de Professional nunca se recalcula al reseñar (cards muestran 0; perfil público calcula en vivo → inconsistencia) | grep global; `explore/nearby/route.ts:16,30` | P2 | aggregate en misma transacción del create |
| C-09 | Edición/borrado de reseña inexistente; comment sin límite | resenas API | P2 | PATCH/DELETE con ownership + max(1000) |
| C-10 | Badge notificaciones: unread contado sobre últimos 30 → "9+" eterno con más de 30 | `notificaciones/route.ts:11-17` | P2 | `_count` aparte |
| C-11 | GET/PATCH notificaciones sin try/catch ni zod → body malformado = 500 HTML | `notificaciones/route.ts:29-38` | P2 | zod + catch |
| C-12 | Respuesta del bot bloqueante con doble retry DeepSeek; sin lock por conversación (spameo = bots paralelos) | `mensajes/[id]/route.ts`, `professionalAssistant.ts:118` | P2 | 202 + async o mutex |
| C-13 | Cursor polling por `createdAt` ms: mensajes en mismo ms pueden perderse; sin paginación hacia atrás | `ChatThread.tsx:28,50-79` | P2 | cursor `(createdAt,id)` |
| C-14 | FloatingChatbot tapa la UI en `/cliente/mensajes/*` (falta `/cliente` en prefijos privados) | `FloatingChatbot.tsx:9` | P2 | Agregar prefijo |
| C-15 | Favorito hacia id inexistente/inactivo → FK P2003 → 500; favoritos huérfanos visibles si pro desactivado | `favoritos/[type]/[id]/route.ts:51-54`, `favoritos/page.tsx` | P2 | Validar existencia/isActive; filtrar |
| C-16 | Favoritos de pro sin username renderizan card con href vacío | `favoritos/page.tsx:50` | P2 | Filtrar o card sin link |
| C-17 | Fechas SSR formateadas con TZ servidor (desfasadas −3h si deploy UTC) | `perfil/cliente/[username]/page.tsx:43` | P2 | Ver F-12 |
| C-18 | DELETE de favorito inexistente → 500 en vez de 404 | `[type]/[id]/route.ts` | P2 | Map P2025 |

## Correcto verificado ✅
Ownership en turnos/mensajes/favoritos/notificaciones (incluye `updateMany where userId`); ventana de cancelación 24h consistente cliente/server; estados AppointmentStatus completos en UI; empty states en todos los listados; mensaje optimístico con rollback; escalación bot→humano con throttle 1h; membership centralizado en `getMembership`; upload-avatar valida 5MB+MIME; params awaiteados.
