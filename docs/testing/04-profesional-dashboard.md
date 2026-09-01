# E2E — Profesional: Dashboard Operativo

Método: trazado de código solo-lectura · 2026-08-25

## Resumen

| # | Caso de uso | Estado | Máx severidad |
|---|---|---|---|
| 1 | Dashboard principal + guards | INCOMPLETO + **BUG P0 escalación rol** | **P0 (F-03)** |
| 2 | Perfil profesional (edición, avatar, video) | OK con riesgos | P2 |
| 3 | Servicios CRUD | OK ownership; delete riesgoso | P1 |
| 4 | Paquetes CRUD | OK; delete con FK error | P2 |
| 5 | Agenda (turnos y bloqueos) | **BUG** — bloqueos sin delete UI, NO_SHOW inalcanzable, sin conflicto-check | P1 |
| 6 | Disponibilidad semanal | **BUG** — PUT sin validación, TZ | P1 |
| 7 | Portfolio CRUD | OK (limpieza storage en tx) | P2 |
| 8 | Certificaciones y educación CRUD | OK | P2 |
| 9 | Google Calendar sync | **BUG P0 callback** + sync = dead code | **P0 (F-04)** / P1 |
| 10 | Mensajes profesional | OK membership | P2 |

## Hallazgos

### F-03 [P0] Escalación de rol vía JWT update
- `lib/auth.ts:109-115`: en el trigger `update` del JWT **solo se valida `PROFESSIONAL`** contra DB; cualquier otro valor (`OWNER`, `SUPER_ADMIN`, `ADMIN`) se asigna al token sin verificación.
- La app ya usa `useSession().update({ role })` desde el cliente (`Navbar.tsx:156`): un CLIENT puede ejecutar desde consola `update({ role: "OWNER" })`, pasar `requireOwner()` (`owner-auth.ts:4-10`) y el layout owner → acceso total al panel admin.
- **Fix:** validar SIEMPRE `nextRole` contra `prisma.user.role`, o eliminar soporte de `role` en payload de update. Una línea de whitelist.

### F-04 [P0] Callback OAuth Google Calendar sin auth ni state
- `google-calendar/callback/route.ts:5-29`: sin `auth()`; `state` es el professionalId plano. Atacante completa SU flujo OAuth y llama `callback?code=<su código>&state=<proId víctima>` → su Google queda vinculado a la agenda de la víctima (`googleConnected=true`) → fuga/manipulación de disponibilidad.
- **Fix:** exigir sesión PROFESSIONAL en callback + state firmado/opaco atado a sesión.

### F-16 [P1] Bloqueos de agenda rotos
- DELETE `/api/profesional/agenda/bloqueo` existe pero **ningún componente lo llama**: no se pueden borrar vacaciones/ausencias desde la UI (`AgendaDiaModal.tsx:114-124` renderiza sin acción).
- Crear bloqueo NO detecta conflicto con citas confirmadas/pendientes ni otros bloqueos (`bloqueo/route.ts:31-56`, cero consultas de solapamiento). Recurrencia sin tope de iteraciones (:41-45).
- **Fix:** botón borrar + check solapamientos + cap iteraciones.

### F-17 [P1] NO_SHOW inalcanzable
- Estado existe server-side y en labels, pero ningún botón lo asigna (`AgendaDiaModal.tsx:93-108` solo Confirmar/Completar/Cancelar).
- **Fix:** agregar acción No-show.

### F-20 [P1] Delete servicio hard-delete con turnos activos
- `servicios/[id]/route.ts:139`: sin contar appointments activos; schema `onDelete:SetNull` (`schema.prisma:558`) deja turnos sin servicio/precio. UI solo `confirm()`.
- **Fix:** rechazar si hay PENDING/CONFIRMED o exigir soft-delete/pausa.

### F-21 [P1] PUT disponibilidad sin validación
- `disponibilidad/route.ts:37-54`: acepta dayOfWeek fuera 0–6, strings no-HH:MM, endTime<=startTime → ventanas vacías/negativas silenciosas.
- Relacionado: `time.ts:12-17` `addMinutes` wrappea módulo 24h (23:30+90→"01:00") corrompiendo overnight; fallback hardcodeado Lun–Sáb 9–18 cuando el pro nunca configuró horarios (`availability.ts:43-44`); API pública de slots no verifica que el id sea pro real.
- **Fix:** zod + regex HH:MM + end>start + rango día.

### F-12 [P1] Timezone end-to-end
- `Professional.timezone` (`schema.prisma:156`) existe pero **0 usos en el codebase**. Ventanas interpretadas como hora servidor (`availability.ts:39-47`, `[id]/disponibilidad/route.ts:16-19`), límites de mes/día en servidor (`agenda/route.ts:25-26`, `mes/route.ts:21-22`), booking convierte hora del navegador cliente (`BookingWizard.tsx:91-98`). Deploy UTC → tres interpretaciones distintas del mismo "09:00"; turnos cambian de día o desaparecen del mes.
- **Fix:** centralizar conversiones contra TZ fija AR (Intl/luxon); almacenar UTC, renderizar en TZ espectador.

### Otros hallazgos

| ID-ish | Hallazgo | Archivo | Severidad | Fix |
|---|---|---|---|---|
| D-01 | Google Calendar sync completo es dead code: createGoogleEvent/update/delete/syncToBlockedSlots jamás invocados; conectar/desconectar no produce efecto observable | `lib/googleCalendar.ts:58-155` | P1 | Cablear a ciclo de citas o remover feature |
| D-02 | Máquina de estados de turno ausente: CONFIRMAR un CANCELLED, COMPLETAR un CANCELLED, etc.; sin notificación al cliente al confirmar/cancelar | `agenda/turno/[id]/route.ts:15,31` | P2 | Validar transiciones + notification |
| D-03 | Autosave wizard dispara PATCH completo (deleteMany/createMany galería/faqs/packages/availability) cada 900ms de tipeo → churn DB y carrera autosave-vs-publish | `ServiceWizard.tsx:76-101` | P2 | Debounce real o autosave por-campo |
| D-04 | PATCH perfil: bio sin cap server-side, avatarUrl arbitrario (puede apuntar a keys ajenas), avatar reemplazado no borra el viejo (video sí) | `profesional/perfil/route.ts:12-25`, `CompactProfileHeader.tsx:104-118` | P2 | Zod + prefijo propio + deleteFile |
| D-05 | Uploads: file.type declarado por cliente (spoofable), sin magic bytes ni cuota acumulada; video 50MB entero a memoria | uploads varios, `video/route.ts:34` | P2 | Magic bytes/streaming |
| D-06 | POST servicios: status arbitrario cae a ACTIVE silenciosamente; PATCH price NaN → 500; cambiar durationMin no recalcula ServiceAvailability existente; imágenes removidas quedan huérfanas en storage; sin límites de cantidad/longitud | `servicios/route.ts:58,95`, `[id]/route.ts:52-53,64-118`, `StepGaleria.tsx:64-66` | P2 | Whitelist enum, Number.isFinite, recalcular, cleanup |
| D-07 | Paquetes: delete con compras asociadas → FK Restrict → 500 sin explicación; sin validar originalPrice>=price ni validityDays>0; editar sessionCount sin impacto documentado en ClientPackage existentes | `paquetes/[id]/route.ts:80-85`, `paquetes/route.ts:44-46` | P2 | Catch P2003→409 + validaciones |
| D-08 | Portfolio: costMin<=costMax / durationMin<=durationMax sin validar, NaN→500, categoryIds sin verificar existencia | `portfolio/route.ts:57-68`, `[id]/route.ts:33-69` | P2 | Validaciones |
| D-09 | Certificaciones/educación: year sin rango (overflow Int → 500); GET exige solo login (no rol) | `certificaciones/route.ts:41`, `educacion/[id]:38` | P2 | Validar año |
| D-10 | Dashboard sin métricas ni próximas citas (solo bio estática); caso "próximas citas" no existe en ninguna página | `dashboard/page.tsx:11-24` | P2 | Agregar queries |
| D-11 | Mensajes pro: GET sin paginación; since sin validar fecha → 500; body sin límite; lista duplicada layout/API; `mensajes/page.tsx` vacío sin JS | `mensajes/[id]/route.ts:62-91` | P2 | take+validar+zod |
| D-12 | Refresh token Google: fallo revocado sin manejo; refresh_token rotado no persistido | `googleCalendar.ts:42-55` | P2 | Manejo + persistir |
| D-13 | Páginas portfolio new/edit protegidas solo client-side (blanco sin JS; APIs sí fuerzan ownership) | `new/page.tsx:19-25`, `edit/[id]/page.tsx:21-38` | P2 | Guard server-side |

## Correcto verificado ✅
Layout `(dashboard)/profesional` exige sesión + rol PROFESSIONAL + perfil + isVerified con redirects correctos; ownership verificado en TODOS los CRUD (servicios, paquetes, portfolio, certificaciones, educación, turnos, bloqueos); params Promise awaiteados en todos; portfolio limpia archivos removidos dentro de transacción; MAX_IMAGES=5 y 5MB presentes; tabs ACTIVE/DRAFT/PAUSED funcionales; vista previa de perfil con ownership check.
