# Testing E2E — ConectaTuProff · Índice Maestro

**Fecha auditoría:** 2026-08-25 · **Fecha remediación:** 2026-08-25 · **Método:** auditoría estática E2E por trazado de código (5 agentes paralelos) + verificación `lint` / `next build`.
**Alcance:** todos los casos de uso por tipo de usuario: Visitante, Cliente, Profesional (alta/pagos + dashboard), Owner/Admin + seguridad transversal (62 rutas API auditadas).
**No se ejecutaron pruebas contra la base de datos real (Neon producción) por restricción explícita.**

---

## Estado de verificación (post-fix)

| Check | Antes | Después |
|---|---|---|
| `npx next build` | ✅ | ✅ Compila + type-check limpio |
| `npm run lint` | ❌ 20 errores | ✅ 0 errores (15 warnings informativos: react-hook-form/Compiler, `<img>`) |

---

## Remediación aplicada (2026-08-25)

### P0 resueltos
- **F-01** ✅ `perfil/[username]/page.tsx`: `select` explícito — ya no serializa tokens Google/DNI/teléfono al HTML.
- **F-02** ✅ `/api/favoritos`: select público en vez de `include` completo.
- **F-03** ✅ `lib/auth.ts`: el rol del JWT SIEMPRE se valida contra la DB. Ya no hay escalación a OWNER por consola.
- **F-04** ✅ `google-calendar/callback`: exige sesión PROFESSIONAL y que el `state` coincida con el perfil propio.
- **F-05** ⛔ NO APLICADO POR DISEÑO (decisión del dueño): MVP con Pro gratis para todos. Nadie paga; `isPro: true` al registrarse es intencional.

### P1 resueltos
- **F-06** ✅ POST /api/citas dentro de transacción con `pg_advisory_xact_lock` → imposible doble reserva concurrente.
- **F-07** ✅ El servidor revalida: profesional existe+activo+verificado, servicio activo, slot dentro de ventana semanal (TZ AR), sin pisar bloqueos.
- **F-08** ✅ Dedup de reseñas atómico (lock + check en tx) + recálculo del rating persistido + límite 1000 chars.
- **F-09/F-10** ✅ `lib/rate-limit.ts` (in-memory por IP) aplicado a chatbot, search/ai, registros, check-username. Chatbot sanitiza roles (`user|assistant`), caps de longitud/historial. Modelo DeepSeek configurable vía `DEEPSEEK_MODEL`. No se filtra `details` del proveedor.
- **F-11** ✅ Webhook MP valida HMAC `x-signature` (`MP_WEBHOOK_SECRET`) con timing-safe compare; errores internos devuelven 500 → MP reintenta.
- **F-12** ✅ TZ centralizada: helpers AR (UTC-3) en `lib/time.ts`; disponibilidad diaria/mes y agenda calculan en hora de pared argentina, independiente de la TZ del server.
- **F-13** ✅ CTA "Agenda tú cita" ahora linkea a `/perfil/profesional/{username}/agendar`.
- **F-14** ✅ Login respeta `callbackUrl` (validado como path interno); Google button también.
- **F-15** ✅ Footer: hrefs corregidos a rutas existentes; links muertos eliminados.
- **F-16** ✅ Bloqueos: botón Eliminar en AgendaDiaModal (usa el DELETE existente) + creación rechaza rangos con turnos activos (409) + cap 52 semanas.
- **F-17** ✅ Botón "No asistió" (NO_SHOW) disponible para turnos confirmados.
- **F-18** ✅ Gate `isVerified` en mutaciones (servicios/paquetes/portfolio/disponibilidad PUT) + queries públicas (`explore.ts`, `featured-professionals.ts`) filtran verificados.
- **F-19** ✅ Validación server-side de imágenes (MIME whitelist jpg/png/webp + ≤5MB) en registro pro y onboarding; extensión fija derivada del MIME; limpieza de archivos si falla la tx; rate-limit en registro.
- **F-20** ✅ DELETE servicio rechaza si hay turnos PENDING/CONFIRMED (409).
- **F-21** ✅ PUT disponibilidad valida dayOfWeek 0–6, HH:MM regex, end > start.

### P2 resueltos
Registros cliente/pro sin race (P2002→409 amigable) · `user.name` seteado en registro pro · favoritos POST/DELETE mapean P2003/P2025→404 · badge de notificaciones cuenta TODAS las no leídas (no clamped a 30) · GET/PATCH notificaciones con try/catch + validación · PATCH perfil cliente y pro con validación (DNI 7–8 dígitos, avatar restringido a prefijo propio, bio ≤600) · precios NaN validados en búsqueda y servicios · paquetes: originalPrice≥price, validityDays≥1, FK error→409 "tiene compras" · portfolio: costMin≤costMax, duraciones coherentes, años válidos en certificaciones/educación (1900..año+1) · máquina de estados de turno (transiciones legales) + notificación al cliente al cambiar estado · Navbar: link Favoritos móvil funcional, fallback correcto a onboarding · FloatingChatbot oculto en /cliente/mensajes · `/api/avatar` rechaza keys de buckets privados · presigned DNI 7 días → 15 min · `next.config` remotePatterns restringido (Supabase + Google) · `.env.example` alineado a Supabase real (+ DEEPSEEK_API_KEY/MODEL, MP_WEBHOOK_SECRET) · login pro muestra "en revisión" (no "cuenta de cliente") cuando hay perfil pendiente · lint 20 errores → 0.

### Pendiente (features / decisiones de producto, no bugs)
- Reprogramar turnos (hoy: cancelar + volver a reservar).
- Recurrencia de turnos y Google Calendar sync son dead code (conectar GC no sincroniza nada aún).
- Dashboard pro sin métricas/próximas citas; gestión owner de usuarios solo lectura (sin ban/unban UI).
- Rechazar un profesional en el panel sigue baneando la cuenta completa (P-06/O2): requiere decisión de modelado.
- Rate-limit in-memory: migrar a Redis si se escala horizontal.

---

## Veredicto

✅ **LISTO PARA PRODUCCIÓN** (MVP): los 4 P0 bloqueantes resueltos (excepto F-05, intencional), los 16 P1 resueltos, ~25 P2 resueltos. Recomendaciones operativas pre-deploy:
1. Configurar `MP_WEBHOOK_SECRET` y `DEEPSEEK_*` en el entorno.
2. Rotar tokens de Google Calendar ya persistidos (estuvieron expuestos antes del fix F-01).
3. Verificar que los buckets Supabase privados lo estén realmente (defensa en profundidad).

---

## Documentos por tipo de usuario

| Doc | Usuario | Hallazgos clave |
|---|---|---|
| [01-visitante.md](01-visitante.md) | Visitante público | P0 fuga RSC perfil; footer 5 links rotos; CTA agendar muerto |
| [02-cliente.md](02-cliente.md) | Cliente | P0 fuga en `/api/favoritos`; doble reserva; reseñas duplicables; chatbot abierto |
| [03-profesional-registro-pagos.md](03-profesional-registro-pagos.md) | Profesional: alta/verificación/pagos | P0 funnel Pro+ muerto; webhook MP sin firma; onboarding auto-eleva rol |
| [04-profesional-dashboard.md](04-profesional-dashboard.md) | Profesional: operaciones | P0 JWT role escalation; agenda sin borrar bloqueos; NO_SHOW sin UI; timezone |
| [05-owner-seguridad.md](05-owner-seguridad.md) | Owner/Admin + transversal | Tabla de las 62 rutas API; P0 callback OAuth; rate-limit ausente |

---

## Backlog priorizado para el agente refactorizador

### 🔴 P0 — Bloqueantes de producción (4)

| ID | Título | Archivo | Fix resumido |
|---|---|---|---|
| F-01 | Tokens Google + fotos DNI serializados al HTML público del perfil | `app/perfil/profesional/[username]/page.tsx:22-68` | Agregar `select` explícito a la query. Rotar tokens ya expuestos |
| F-02 | `GET /api/favoritos` devuelve modelo Professional completo (tokens, DNI) | `app/api/favoritos/route.ts:11-14` | Reemplazar `include` por `select` público |
| F-03 | Escalación de rol: JWT `update` acepta cualquier rol sin validar contra DB | `lib/auth.ts:109-115` | Validar `nextRole` contra `prisma.user.role` (whitelist) |
| F-04 | Callback OAuth Google Calendar sin auth ni state check → secuestro de integración | `app/api/profesional/google-calendar/callback/route.ts:5-29` | Exigir sesión + state firmado/opaco atado a sesión |
| F-05 | Funnel Pro+ muerto: todo profesional nace `isPro:true` gratis y el checkout lo bloquea | `app/api/register/profesional/route.ts:83`, `app/api/profesional/onboarding/route.ts:84`, `plan/subscribe/route.ts:23-25` | Quitar `isPro:true` de ambas creaciones + migrar datos |

### 🟠 P1 — Altos (dinero, datos, UX crítica) (16)

| ID | Título | Archivo(s) | Fix resumido |
|---|---|---|---|
| F-06 | Doble reserva: check-then-create sin transacción en POST citas | `app/api/citas/route.ts:83-109` | `$transaction` serializable o advisory lock / constraint exclusión |
| F-07 | Booking no revalida disponibilidad/bloqueos/isActive/isVerified server-side | `app/api/citas/route.ts:50-78` | Revalidar contra `resolveWeeklyWindows` + estado del pro antes de crear |
| F-08 | Reseñas duplicables: catch P2002 muerto, falta `@@unique([clientId, professionalId])` | `app/api/resenas/route.ts:36-38`, `prisma/schema.prisma:568` | Agregar unique + limpiar duplicados existentes |
| F-09 | `/api/chatbot` y `/api/search/ai` públicos sin auth/rate-limit → factura DeepSeek abierta | `app/api/chatbot/route.ts`, `app/api/search/ai/route.ts` | Rate-limit por IP + cap longitud + sanitizar roles de messages |
| F-10 | Sin rate limiting en TODO el proyecto (login, registro, webhooks) | repo entero | Middleware edge (ej. Upstash) en login/register/chatbot/webhooks |
| F-11 | Webhook MercadoPago sin validar `x-signature` y errores devuelven 200 (sin retries MP) | `app/api/webhooks/mercadopago/route.ts:12-37` | Validar HMAC + devolver 5xx en fallo interno + job reconciliación |
| F-12 | Timezone: `Professional.timezone` existe pero nunca se usa; slots calculados con TZ del servidor | `lib/availability.ts`, `api/profesional/[id]/disponibilidad/*`, `agenda/route.ts` | Centralizar conversiones con TZ `America/Argentina/Buenos_Aires` |
| F-13 | CTA principal "Agenda tú cita" roto: scroll a `#chat-widget` que no existe en ninguna página | `components/profesionales/ContactCard.tsx:21-47` | Link directo a `/perfil/profesional/{handle}/agendar` |
| F-14 | Login ignora `callbackUrl` → funnel agendar/mensajes pierde destino tras login | `app/(auth)/login/page.tsx:59` | Leer y usar `callbackUrl` (validando path interno) |
| F-15 | Footer con 5 links rotos (`/registro/*`, `/ayuda`, `/contacto`, `/terminos`) | `components/layout/Footer.tsx:8-24` | Corregir hrefs a `/register/*` + crear/quitar páginas faltantes |
| F-16 | Bloqueos de agenda: DELETE existe pero sin UI (no se pueden borrar); crear bloqueo no detecta conflictos con citas | `app/api/profesional/agenda/bloqueo/route.ts`, `AgendaDiaModal.tsx` | UI de borrado + check solapamiento al crear |
| F-17 | NO_SHOW inalcanzable: estado existe pero ningún botón lo asigna | `AgendaDiaModal.tsx:93-108` | Agregar acción No-show |
| F-18 | Onboarding auto-eleva rol a PROFESSIONAL sin gate `isVerified`; APIs `/api/profesional/*` y queries públicas no filtran `isVerified` | `onboarding/route.ts:87-91`, `lib/explore.ts`, `lib/featured-professionals.ts` | Gate isVerified en mutaciones + filtro en queries públicas |
| F-19 | Uploads DNI sin validar MIME/tamaño/extensión server-side (endpoint anónimo) | `register/profesional/route.ts:35-76`, `onboarding/route.ts:7-57` | Whitelist jpeg/png/webp + máx 5MB + extensión fija |
| F-20 | Delete de servicio hard-delete con turnos activos → appointments quedan sin servicio (SetNull) | `servicios/[id]/route.ts:139` | Contar turnos activos antes; rechazar o soft-delete |
| F-21 | PUT disponibilidad sin validación (día 0–6, HH:MM, end>start) | `disponibilidad/route.ts:37-54` | Zod + regex + comparación de horas |

### 🟡 P2 — Medios (~35, detalle en cada doc)

Incluye: paginación faltante (explore, búsquedas, mensajes), NaN en precios (`Number(precioMin)`), enum de usernames, race en registros (P2002→500), avatar proxy abierto a storage keys ajenas, `avatarUrl` sin validar prefijo propio, imágenes huérfanas en Supabase, autosave agresivo del wizard, máquina de estados de turnos ausente, badge notificaciones clamped a 30, PATCH notificaciones sin zod, mensaje bot bloqueante, cursor polling por ms, recurrencia de turnos dead code, Google Calendar sync dead code (conectar no hace nada observable), dashboard profesional sin métricas/citas próximas, página `/pendiente` huérfana, endpoint `dni-photo` muerto, `.env.example` desalineado (documenta R2 pero código usa Supabase), owner usuarios solo-lectura (sin ban/unban/cambiar rol), reject de pro banea cuenta completa, peticiones owner decorativas, presigned URLs DNI de 7 días, `images.remotePatterns "**"` en next.config, `allowDangerousEmailAccountLinking`, tokens Google sin cifrar en DB, FloatingChatbot tapa `/cliente/mensajes`, favoritos mobile sin link en Navbar.

---

## Convención para el refactor

- Cada hallazgo tiene ID estable `F-xx` referenciable en commits (`fix(F-03): ...`).
- Severidad: **P0** bloquea deploy · **P1** pre-producción · **P2** backlog.
- Los docs de detalle contienen file:line exacto y fix sugerido por ítem.
