# SPEC — Conecta Tu Proff

## §G — Goal

Marketplace conecta clientes con profesionales bienestar (reflexología, masajes, kinesiología, etc.) y oficios (cerrajería, plomería, etc.) en CABA/GBA. Sistema turnos, perfiles públicos SEO, chat realtime, notificaciones email, modelo freemium MercadoPago.

---

## §C — Constraints

- Stack: Next.js 15 App Router + TypeScript + Supabase (PostgreSQL) + NextAuth v5 + Prisma ORM
- Deploy: Vercel
- Pagos: MercadoPago suscripciones recurrentes
- Zona geográfica: CABA y GBA
- Branding: paleta brand tokens de `conecta-brand-colors.md` (espresso/rose/sage/cream)
- UI: shadcn/ui + TailwindCSS únicamente (no CSS puro, no tocar global.css)
- Responsive: mobile-first + desktop
- Componentes max 500 líneas, MVC modular
- Auth: roles diferenciados `client` | `professional` | `admin`
- No SVG custom salvo pedido explícito

---

## §I — Interfaces

| id | surface | shape |
|----|---------|-------|
| I.auth | NextAuth session | `{ user: { id, email, role: 'client'|'professional'|'admin' } }` |
| I.db | Supabase/Prisma | tables: users, professionals, services, appointments, availability, zones, chats, messages, reviews, subscriptions, consultations |
| I.realtime | Supabase Realtime | channel `chat:{conversationId}` → `INSERT` messages |
| I.email | Resend / nodemailer | `sendEmail(to, subject, html)` |
| I.payments | MercadoPago API | preapproval plan recurrente, webhooks |
| I.api | Next.js Route Handlers | `/api/appointments`, `/api/chat`, `/api/consultations`, `/api/subscriptions`, `/api/admin/*` |
| I.seo | Next.js Metadata API | `generateMetadata()` per professional slug |

---

## §V — Invariants

| id | invariant |
|----|-----------|
| V1 | Todo error server-side logeado en console + respuesta HTTP con mensaje UX visible al usuario |
| V2 | Ningún componente supera 500 líneas — extraer subcomponentes si supera |
| V3 | Solo TailwindCSS para estilos; prohibido CSS puro y modificar global.css |
| V4 | Siempre usar brand tokens (`brand-espresso`, `brand-rose-dark`, etc.) no colores hardcodeados salvo excepciones documentadas |
| V5 | Texto sobre fondos claros usa solo `espresso` o `mauve`; colores rose/sage/sand solo para texto grande 18px+ o decorativo |
| V6 | Toda mutación de DB requiere consentimiento explícito del usuario antes de ejecutar |
| V7 | Auth guards: rutas `/dashboard/*` requieren sesión; `/admin/*` requiere rol `admin` |
| V8 | Turno solo reservable si slot disponible en tabla `availability`; doble booking prohibido |
| V9 | Chat realtime solo entre participantes de la conversación (RLS Supabase) |
| V10 | Review solo posible post-turno confirmado por ese cliente |
| V11 | Plan Premium primer mes gratis; al vencer profesional elige; fallback a free sin interrupción de perfil |
| V12 | Perfil público accesible sin login; URL limpia `/profesionales/[slug]` |
| V13 | Consulta anónima requiere nombre + (email o teléfono); no requiere cuenta |
| V14 | Responsive: todos los componentes funcionales en 375px (mobile) y 1280px (desktop) |
| V15 | shadcn/ui para todos los componentes prefabricados generales |

---

## §T — Tasks

| id | status | goal | cites |
|----|--------|------|-------|
| T1 | x | Setup proyecto: Tailwind brand tokens, shadcn init, estructura carpetas MVC | V3,V4,V15 |
| T2 | . | Schema DB: tablas users/professionals/services/zones/availability/appointments | I.db,V6 |
| T3 | . | Auth: NextAuth roles client/professional/admin + registro + login + redirect por rol | I.auth,V7 |
| T4 | . | Recuperación de contraseña (email reset) | I.auth,I.email,V1 |
| T5 | . | Búsqueda profesionales: filtros barrio + servicio + bloque horario | I.db,I.api,V14 |
| T6 | . | Perfil público profesional: SEO metadata + galería fotos/video + botón consulta | I.seo,V12,V13,V14 |
| T7 | . | Sistema turnos: formulario solicitud + Confirmar/Rechazar en dashboard pro | I.db,I.api,V8,V1 |
| T8 | . | Dashboard profesional: gestión turnos + disponibilidad weekly | I.auth,V7,V14 |
| T9 | . | Dashboard cliente: mis turnos + historial | I.auth,V7,V14 |
| T10 | . | Emails automáticos: confirmación/rechazo turno + nueva solicitud + nueva consulta | I.email,V1 |
| T11 | . | Chat realtime: Supabase Realtime WebSockets + historial + unread indicator | I.realtime,V9,V14 |
| T12 | . | Sistema consultas: anónimo o logueado + notificación pro + respuesta por dashboard | I.api,V13,V1 |
| T13 | . | Matching/ranking: zona + servicio + precio + disponibilidad + premium boost | I.db,V11 |
| T14 | . | Sistema reseñas: post turno confirmado + visible en perfil público | I.db,V10,V12 |
| T15 | . | Suscripciones MercadoPago: freemium + premium recurrente + webhooks + fallback | I.payments,V11,V1 |
| T16 | . | Panel admin: CRUD usuarios/profesionales/turnos/consultas + pagos + stats + CSV export | I.api,V7,V14 |
| T17 | . | SEO avanzado: sitemap, robots.txt, structured data JSON-LD, GEO básico AI indexing | I.seo,V12 |
| T18 | . | Deploy config: Vercel + env vars + dominio + Supabase prod | V1 |

---

## §B — Bug Log

| id | date | cause | fix |
|----|------|-------|-----|
