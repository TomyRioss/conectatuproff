# E2E — Visitante / Público (sin sesión)

Método: trazado de código solo-lectura · 2026-08-25

## Resumen

| # | Caso de uso | Estado | Máx severidad |
|---|---|---|---|
| 1 | Landing home | OK (todo dinámico, sin caché) | P2 |
| 2 | Explore | INCOMPLETO (rutas huérfanas, sin paginación) | P1 |
| 3 | Búsqueda + AI search | RIESGO (endpoint IA público sin límites) | P1 |
| 4 | Perfil público profesional | **BUG** — fuga tokens/DNI en payload RSC | **P0 (F-01)** |
| 5 | Agendado iniciado por visitante | RIESGO (callbackUrl ignorado, TZ) | P1 |
| 6 | Registro cliente/profesional | OK con riesgos (uploads DNI, races) | P1 |
| 7 | Login (3 puertas: cliente/profesional/owner) | OK (callbackUrl ignorado) | P1 |

## Hallazgos

### F-01 [P0] Fuga de datos sensibles en payload RSC del perfil público
- `app/perfil/profesional/[username]/page.tsx:22-36`: query sin `select` → trae TODAS las columnas de Professional: `googleAccessToken`, `googleRefreshToken`, `dni`, `dniPhotoFront`, `dniPhotoBack`, `phone`, `mpPreapprovalId`.
- El objeto se pasa a `<ProfileHeader>` (client component, línea 68) → serializado en el HTML (`self.__next_f.push`). Cualquier visitante lo lee con "ver código fuente".
- **Fix:** `select` explícito (ya existe ejemplo correcto en `agendar/page.tsx:34-47`). Rotar tokens Google si hubo deploy.

### F-13 [P1] CTA principal muerto
- `ContactCard.tsx:21-23`: botón "Agenda tú cita" hace `scrollIntoView(#chat-widget)`; ese id pertenece a `ChatWidget.tsx` que **nunca se renderiza** (0 imports). Click = no-op.
- **Fix:** `<Link href="/perfil/profesional/{username}/agendar">` o renderizar el widget.

### F-14 [P1] Login ignora callbackUrl
- `login/page.tsx:59`: siempre `router.push("/")`. El visitante que venía de `/agendar?...` pierde todo el contexto tras loguearse.
- **Fix:** `router.push(searchParams.get("callbackUrl") ?? "/")` validando path interno.

### F-15 [P1] Footer con 5 links rotos
- `Footer.tsx:9,15-17,22-24`: `/registro/profesional`, `/registro/cliente` (rutas reales: `/register/*`), `/ayuda`, `/contacto`, `/terminos` → 404.
- **Fix:** corregir hrefs; crear o quitar páginas faltantes.

### F-09 [P1] Endpoints IA públicos ilimitados
- `api/search/ai/route.ts:4-43`: POST anónimo, sin rate-limit ni cap de tamaño → abuso = factura DeepSeek. Ídem `api/chatbot/route.ts`.
- Además: `model: "deepseek-v4-flash"` (líneas :34/:36) — verificar ID válido contra API DeepSeek; si es inválido ambas funciones IA devuelven 502 siempre.
- Devuelven `details: errorText` del proveedor al cliente (fuga menor).

### F-19 [P1] Uploads DNI sin validación server-side
- `api/register/profesional/route.ts:35-76`: cualquier MIME/tamaño; extensión tomada del filename sin sanitizar (`front.<ext>` controlable).
- **Fix:** whitelist jpeg/png/webp, máx 5MB, extensión fija.

### Otros hallazgos (P2)

| Hallazgo | Archivo | Fix |
|---|---|---|
| Explore/search/explore-profesionales huérfanos (0 links entrantes) y `/search/[query]` duplica `/buscar` con param que nadie genera | `(public)/explore/*`, `(public)/search/[query]` | Linkear desde Navbar o eliminar rutas |
| Sin paginación: `findMany` sin `take` carga todos los pros/servicios | `explore/profesionales/page.tsx:12-20`, `buscar/page.tsx`, `search/[query]/page.tsx` | `.take(48)` + paginación |
| `premium: false` hardcodeado inconsistente con `isPro` del resto | `explore/profesionales/page.tsx:30`, `api/explore/nearby/route.ts:33` | Usar `pro.isPro` |
| `Number(precioMin)` sin validar → NaN → Prisma crash 500 ante `/buscar?precioMin=abc` | `buscar/page.tsx:41`, `search/[query]/page.tsx:36` | Validar `Number.isFinite` |
| Match de zona ingenuo `location contains city` (formatos registro vs bigdatacloud difieren) → sección "cerca de ti" vacía frecuente | `api/explore/nearby/route.ts:14` | Normalizar ciudad/provincia |
| Servicios no-ACTIVE visibles por URL directa; portfolio visible de pros desactivados | `[handle]/servicios/[serviceId]/page.tsx:19-45`, `[handle]/portfolio/page.tsx:19-39` | Filtrar `status:"ACTIVE"` + `isActive` |
| Home 100% dinámica por `await auth()` en layout raíz; consulta redundante de especialidades x2 | `app/layout.tsx:33`, `app/page.tsx:16-19` | Cache/deduplicar |
| Enumeración de usernames vía check-username público | `api/register/check-username/route.ts` | Rate-limit |
| Race email/username en registros → P2002 cae como 500 genérico | `register/cliente/route.ts:20-28`, `register/profesional/route.ts:45-53` | Catch P2002 → 409 |
| Registro pro no setea `user.name` (Navbar muestra iniciales del email); archivos Supabase huérfanos si falla transacción | `register/profesional/route.ts:57-58,90-92` | Setear name; limpiar storage en catch |
| TZ servidor asume local en slots pasados (`new Date(y,m,d)`, `getHours()`) | `disponibilidad/route.ts:16-21,49-50`, `mes/route.ts` | Ver F-12 en índice |
| Reserva bypasea disponibilidad/bloqueos vía API directa | `api/citas/route.ts:50-109` | Ver F-07 en índice |
| Ancla `#como-funciona` muerta fuera de la home | `Footer.tsx:8` | `href="/#como-funciona"` |
| Navbar fallback roto: push a `/profesional/inicio` (directorio vacío) | `Navbar.tsx:164` | Apuntar a onboarding |
| `/api/avatar` acepta key arbitraria (proxy a buckets; riesgo latente si bucket privado queda público) | `avatar/route.ts:4-9`, `storage.ts:8,47-49` | Rechazar keys de bucket privado |
| `images.remotePatterns hostname "**"` (proxy abierto optimizador imágenes) | `next.config.ts:4-10` | Restringir dominios |
| Componentes muertos: ChatWidget, StickyBookingCTA (causa F-13) | `components/profesionales/ChatWidget.tsx`, `StickyBookingCTA.tsx` | Renderizar o eliminar |

## Correcto verificado ✅
Links home→buscar/perfil existen; `hero.mp4` existe; params/searchParams Promise+await OK en todas las páginas públicas; educación/certificaciones públicas con `notFound()`; reseñas anonimizadas (nombre + inicial); bcrypt cost 12; errores zod mapeados campo a campo; `confirmPassword` nunca sale del cliente; owner login re-verifica rol y revierte sesión.
