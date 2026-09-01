# E2E — Profesional: Registro, Verificación y Monetización

Método: trazado de código solo-lectura · 2026-08-25

## Resumen

| # | Caso de uso | Estado | Máx severidad |
|---|---|---|---|
| 1 | Registro profesional (5 pasos + DNI) | BUG (uploads sin validar) | P1 |
| 2 | Onboarding "Modo Profesional" | **BUG** — auto-eleva rol, validación débil | P1 |
| 3 | Estado de verificación / pendiente | OK con hallazgos (isVerified no gatea APIs) | P1 |
| 4 | Planes / suscripción MercadoPago | **BUG** — funnel Pro+ muerto | **P0 (F-05)** |
| 5 | Webhook MercadoPago | RIESGO (sin firma, errores tragados) | P1 |
| 6 | Login dual cliente/profesional | OK (edge cases de mensajes) | P2 |
| 7 | Google OAuth como registro | OK (linking peligroso documentado) | P2 |

## Hallazgos

### F-05 [P0] Funnel Pro+ muerto: todos nacen `isPro=true` gratis
- `app/api/register/profesional/route.ts:83` y `onboarding/route.ts:84` crean Professional con `isPro:true`.
- `plan/subscribe/route.ts:23-25` rechaza el checkout si ya es Pro ("Ya tenés el plan Pro+").
- Resultado: **ningún profesional puede pagar**; badge Pro regalado al 100%; ingreso = $0.
- **Fix:** quitar `isPro:true` de ambas creaciones (default schema = false) + migración reseteando isPro donde no haya `SubscriptionStatus=AUTHORIZED` ni `proSince`.

### F-18 [P1] Onboarding auto-eleva rol sin gate isVerified
- `onboarding/route.ts:30-46`: solo exige sesión; cualquier usuario se crea perfil Professional pendiente.
- `route.ts:87-90`: setea `user.role="PROFESSIONAL"` inmediatamente, antes de aprobación del owner.
- Ninguna ruta `/api/profesional/*` consulta `isVerified`; queries públicas (`lib/explore.ts:5,30`, `lib/featured-professionals.ts:12`) no filtran → contenido de cuentas no aprobadas sale en portada/búsqueda; no verificado puede crear servicios vía API.
- **Fix:** gate isVerified en mutaciones `/api/profesional/*` + filtro en queries públicas.

### F-11 [P1] Webhook MercadoPago frágil
- `webhooks/mercadopago/route.ts:12-18`: sin validación de firma `x-signature` (mitigante estructural: re-fetch a MP API por ID impide falsificar estados).
- `route.ts:35-37`: catch traga errores y responde 200 → MP no reintenta → **"pagó pero no activado"** sin job de reconciliación en el repo.
- **Fix:** HMAC x-signature + 5xx en fallo interno + cron que sincronice pros con preapproval != AUTHORIZED.

### F-19 [P1] Uploads DNI sin validación server-side
- `register/profesional/route.ts:35-76`: extensión desde filename del cliente (keys malformables), sin MIME ni tamaño. Validación solo client-side (`DniUpload.tsx:27-33`, evitable con curl). Ídem onboarding (`route.ts:8`: `image/svg+xml`→`svg+xml`).
- **Fix:** whitelist MIME + 5MB + extensión fija server-side.

### Otros hallazgos

| ID-ish | Hallazgo | Archivo | Severidad | Fix |
|---|---|---|---|---|
| P-01 | Suscripción duplicada/huérfana en MP: sobrescribe `mpPreapprovalId` sin cancelar/reusar preapproval PENDING previa → riesgo doble cobro | `plan/subscribe/route.ts:45-48` | P2 | Reusar init_point o cancelar la anterior |
| P-02 | Sin `external_reference` en preapproval; `back_url` retorno sin verificación server-side (todo depende del webhook) | `subscribe/route.ts:30-43` | P2 | Enviar external_reference=pro.id |
| P-03 | Fotos DNI huérfanas si falla transacción (uploads ANTES de la tx; compensación solo borra User) | `register/profesional/route.ts:62-92` | P2 | Subir después o limpiar storage en catch |
| P-04 | Race email/username check-then-create → P2002 = 500 genérico | `register/profesional/route.ts:45-53` | P2 | Catch P2002 → 409 |
| P-05 | Split de nombre frágil en onboarding (nombre vacío → "N"/"N"; compuesto → apellido duplicado) | `onboarding/route.ts:59-61` | P2 | Campos separados explícitos |
| P-06 | Rechazo del owner banea TODA la cuenta (mata también perfil cliente del mismo user); sin vía de desbaneo | `owner/profesionales/[id]/route.ts:31-34` | P2 | Rechazo por-perfil (isActive=false) |
| P-07 | Login pro pre-aprobación muestra error engañoso "Cuenta de Cliente" en vez de "en revisión" | `lib/auth.ts:54`, `profesional/login/page.tsx:51-93` | P2 | Lanzar PENDING_REVIEW si existe pro no verificado |
| P-08 | Página `/pendiente` huérfana (registro redirige a `/?pendingReview=1`) | `(auth)/pendiente/page.tsx` | P2 | Eliminar o usarla |
| P-09 | Endpoint `dni-photo` código muerto: exige prefix `dni-docs/` pero registro guarda bajo `dni/` | `profesional/dni-photo/route.ts:12` vs `register/route.ts:67,72` | P2 | Eliminar o unificar prefijo |
| P-10 | `.env.example` documenta Cloudflare R2 pero el código usa Supabase Storage → deploy limpio rompe runtime | `.env.example:25-32` vs `lib/storage.ts:4-5` | P2 | Alinear ejemplo |
| P-11 | Flip permanente de rol por onboarding: cliente que prueba wizard y es rechazado pierde modo cliente (combinado con P-06) | `onboarding/route.ts:87-90` | P2 | Ver F-18/P-06 |

## Correcto verificado ✅
Validaciones de campos sólidas client+server (DNI `^\d{7,8}$`, username regex, bcrypt 12); transacciones en registro y onboarding; auto-login post-registro; modal pendingReview en Navbar; endpoint status correcto (none/pending/verified); guard JWT anti-escalación parcial para PROFESSIONAL; Google OAuth nunca deja perfil colgado (siempre crea Client, camino a pro bien definido); banned bloqueado en signIn callback; sin secrets hardcodeados; sin redirects abiertos (callbackUrl hardcodeados).
