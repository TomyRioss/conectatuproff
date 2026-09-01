# E2E — Owner/Admin + Auditoría Transversal de Seguridad

Método: trazado de código solo-lectura · 2026-08-25 · 62 archivos route.ts verificados uno a uno.

## Tabla completa de las 62 rutas API

Leyenda Auth: 🌐 público · 🔑 sesión · 👤 CLIENT · 💼 PROFESSIONAL · 👑 OWNER/SUPER_ADMIN

| # | Ruta | Auth | Ownership | Riesgo |
|---|------|------|-----------|--------|
| 1 | `auth/[...nextauth]` | handler v5 | n/a | ✅ |
| 2 | `categorias` GET | 🌐 | n/a | ✅ |
| 3 | `subcategorias` GET | 🌐 | n/a | ✅ |
| 4 | `subcategorias/solicitar` POST | 🔑 | propio | ⚠ spam sin rate-limit |
| 5 | `explore/nearby` GET | 🌐 | datos públicos | ✅ |
| 6 | `search/ai` POST | 🌐 | n/a | ⚠ costo LLM sin límite (F-09) |
| 7 | `chatbot` POST | 🌐 | n/a | ⚠ costo LLM sin límite (F-09) |
| 8 | `avatar` GET | 🌐 | key arbitraria | ⚠ proxy storage (P2) |
| 9 | `me` GET | 🔑 | propio | ✅ |
| 10 | `notificaciones` GET/PATCH | 🔑 | updateMany userId | ✅ (sin zod P2) |
| 11 | `favoritos` GET | 🔑 | where userId | **🔴 F-02 include completo** |
| 12 | `favoritos/[type]/[id]` | 🔑 | compuesto | ✅ |
| 13 | `citas` GET/POST | 👤 | clientId sesión | ⚠ F-06/F-07 |
| 14 | `citas/[id]` PATCH | 👤 | 404 si no es dueño | ✅ |
| 15 | `resenas` POST | 👤 | turno COMPLETED propio | ⚠ F-08 unique faltante |
| 16 | `cliente/perfil` PATCH | 👤 | por userId | ⚠ avatarUrl libre, sin zod |
| 17 | `cliente/upload-url` GET | 👤 | key con userId | ✅ (contentType libre) |
| 18 | `cliente/upload-avatar` POST | 👤 | key con userId | ✅ |
| 19 | `register/cliente` POST | 🌐 | n/a | ⚠ sin rate-limit/captcha |
| 20 | `register/profesional` POST | 🌐 | n/a | ⚠ DNI sin límites (F-19) |
| 21 | `register/check-username` GET | 🌐 | n/a | ✅ (enumeración menor) |
| 22 | `profesional/perfil` PATCH | 💼 | por userId | ⚠ avatarUrl libre |
| 23 | `profesional/onboarding` PATCH | 🔑 | upsert userId | ⚠ auto-eleva rol (F-18) |
| 24 | `profesional/status` GET | 🔑 | propio | ✅ |
| 25 | `profesional/dni-photo` GET | 👑 | prefijo validado | código muerto (P2) |
| 26 | `profesional/servicios` GET/POST | 💼 | proId sesión | ✅ |
| 27 | `profesional/servicios/[id]` | 💼 | getOwnService | ⚠ F-20 delete |
| 28 | `servicios/upload-image` POST | 💼 | key con userId | ✅ |
| 29 | `servicios/upload-media` POST | 💼 | ídem | ✅ (video 50MB en memoria) |
| 30 | `profesional/paquetes` GET/POST | 💼 | proId sesión | ✅ |
| 31 | `paquetes/[id]` | 💼 | findFirst propio | ✅ (FK error P2) |
| 32 | `portfolio` GET/POST | 💼 | proId sesión | ✅ |
| 33 | `portfolio/[id]` | 💼 | verifica dueño | ✅ |
| 34 | `portfolio/upload-image` POST | 💼 | key con userId | ✅ |
| 35-38 | `certificaciones(+[id])`, `educacion(+[id])` | 🔑→pro | verifica dueño | ✅ (años sin rango) |
| 39 | `disponibilidad` GET/PUT | 💼 | proId sesión | ⚠ F-21 sin validación |
| 40-41 | `[id]/disponibilidad(/mes)` GET | 🌐 | slots públicos | ⚠ TZ, id no verificado |
| 42 | `agenda` GET | 💼 | proId sesión | ⚠ TZ |
| 43 | `agenda/bloqueo` POST/DELETE | 💼 | DELETE verifica dueño | ⚠ F-16 |
| 44 | `agenda/turno/[id]` PATCH | 💼 | professionalId propio | ⚠ sin máquina estados |
| 45 | `video` POST/DELETE | 💼 | userId sesión | ✅ |
| 46 | `upload-avatar` POST | 💼 | key con userId | ✅ |
| 47 | `plan/subscribe` POST | 💼 | proId sesión | ✅ auth (funnel muerto F-05) |
| 48 | `google-calendar/connect` GET | 💼 | proId sesión | ✅ |
| 49 | `google-calendar/callback` GET | ❌ NINGUNO | ❌ state plano | **🔴 P0 F-04** |
| 50 | `google-calendar/disconnect` POST | 💼 | proId sesión | ✅ |
| 51 | `webhooks/mercadopago` POST | 🌐 (esperada firma) | fetch-back MP | ⚠ sin x-signature (F-11) |
| 52-55 | `owner/categorias(+[id],+subcategorias)` | 👑 requireOwner | n/a | ✅ |
| 56 | `owner/peticiones` GET/PATCH | 👑 | n/a | ⚠ RESOLVED sin efecto (O3) |
| 57 | `owner/usuarios` GET | 👑 | whitelist ROLE_MAP | ⚠ solo lectura (O1) |
| 58 | `owner/profesionales` GET | 👑 | n/a | ⚠ presigned 7 días (P3) |
| 59 | `owner/profesionales/[id]` PATCH | 👑 | busca antes | ⚠ reject banea usuario (P-06) |
| 60 | `owner/upload-url` GET | 👑 | prefix arbitrario | ⚠ upsert sobrescribe buckets (O5) |

## Hallazgos Owner

| ID | Hallazgo | Detalle | Severidad | Fix |
|---|---|---|---|---|
| O1 | Gestión usuarios incompleta | API solo GET; sin ban/unban/activar/cambiar rol; página tabla solo-lectura (`owner/usuarios/page.tsx:63-81`). El único efecto sobre usuarios es el ban colateral del reject (O2). Sin vía de desbaneo | P2 funcional | Endpoints PATCH de moderación |
| O2 | Reject = ban automático | `owner/profesionales/[id]/route.ts:31-34`: rechazar setea isBanned+isActive=false permanentemente, confundiendo "rechazado" con "suspendido" | P2 | Rechazo por-perfil |
| O3 | Flujo peticiones decorativo | Marca RESOLVED/REJECTED sin ejecutar acción ni notificar; la aprobación real vive en otro flujo (documentación) | P2 | Conectar acciones |
| O4 | Guards owner correctos | `requireOwner()` en las 9 rutas + layout server-side. **Pero ver F-03:** la escalación JWT bypasea todo esto | — | Fixear F-03 |
| O5 | upload-url sobrescribe | Prefix arbitrario del querystring + `upsert:true` → OWNER puede generar URL que sobrescriba objetos existentes incluidos DNIs de otros | P2 | Validar prefix permitidos |

## Verificación transversal global

| Check | Resultado |
|---|---|
| `getServerSession` legacy | 0 ocurrencias — migrado a `auth()` v5 ✅ |
| `params` no awaiteados (Next 15+) | 0 en rutas API ✅ |
| SQL raw (`$queryRaw`) | 0 ✅ |
| `dangerouslySetInnerHTML` | 0 ✅ |
| Secrets en cliente | 0 — service role / DeepSeek / MP / Google solo en route handlers ✅ |
| `process.env` fallback inseguro | 2 menores: `mercadopago.ts:6`, `plan/subscribe:27` (`?? ""` / localhost falla tarde) |
| catch vacíos críticos | 3, todos best-effort cleanup (P3) |
| middleware.ts | No existe → protección per-layout OK hoy, frágil para páginas nuevas. Recomendado middleware edge para `/owner/*`, `/profesional/*`, `/cliente/*` |
| Rate limiting | Inexistente en todo el repo (F-10) |
| Tokens Google en DB | Sin cifrar (`callback/route.ts:22-28`) → cifrar en reposo (P2) |
| `allowDangerousEmailAccountLinking:true` | `lib/auth.ts:28` — takeover posible si email no verificado; documentar o condicionar (P2) |
| Presigned DNI URLs 7 días | `owner/profesionales/route.ts:21-22` → bajar a ≤900s (P3) |
