# Disponibilidad y horarios — design

## Objetivo
Hoy `ProfessionalAvailability` (horario semanal recurrente) no tiene UI/API de escritura — el booking siempre cae al fallback hardcodeado Lun-Sáb 9-18. `Service` no tiene horario propio. El calendario de reserva del cliente es un strip horizontal de 21 días, no un grid mensual. Esta feature agrega:
1. UI para que el profesional configure su horario semanal general (por día).
2. UI para que el profesional configure horario propio por servicio (múltiples bloques día+hora).
3. Vista calendario mensual en el booking del cliente, con navegación de mes y punto indicador de disponibilidad.

## Alcance

### 1. Modelo de datos
Nuevo model, mismo shape que `ProfessionalAvailability`:

```prisma
model ServiceAvailability {
  id        String   @id @default(cuid())
  serviceId String
  dayOfWeek Int      // 0=Dom … 6=Sáb
  startTime String   // "HH:MM"
  endTime   String   // "HH:MM"
  createdAt DateTime @default(now())

  service Service @relation(fields: [serviceId], references: [id], onDelete: Cascade)

  @@map("service_availability")
}
```
Agregar `availability ServiceAvailability[]` a `Service`.

### 2. Resolución de horario (server, sin trackear "origen" del click)
Regla única en el endpoint de disponibilidad: dado un `serviceId` (opcional),
- si el servicio tiene filas en `ServiceAvailability` → usar esas ventanas.
- si no tiene (o no hay `serviceId`) → usar `ProfessionalAvailability` del profesional.
- si el profesional tampoco configuró nada → fallback actual hardcodeado (Lun-Sáb 9-18).

Esto cubre "agenda desde el servicio" (BookingWizard llega con `?service=id` preseleccionado → usa horario del servicio si existe) y "agenda desde el perfil" (sin servicio preseleccionado, o servicio sin horario propio → usa horario general) sin lógica de origen separada: al cambiar el servicio seleccionado dentro del wizard, simplemente se refetchea con las mismas reglas.

### 3. Config profesional — horario semanal general
- Componente `WeeklyAvailabilityDialog` (client), trigger: botón "Configurar horario" en `app/(dashboard)/profesional/agenda/page.tsx`, junto a `GoogleCalendarButton`.
- 7 filas (Dom→Sáb), cada una: toggle "Atiende este día" + `startTime`/`endTime` (inputs `type="time"`). Días sin toggle no generan fila.
- Guardar → reemplaza todas las filas de `ProfessionalAvailability` del profesional (transacción: delete all + createMany).
- `GET /api/profesional/disponibilidad` — devuelve filas actuales del profesional autenticado.
- `PUT /api/profesional/disponibilidad` — body `{ days: { dayOfWeek, startTime, endTime }[] }`, reemplaza todo.

### 4. Config profesional — horario por servicio
- Nueva sección dentro de `ServiceWizard` (agregar a `StepPrecio` o nuevo step corto — decidir en plan de implementación según tamaño actual del wizard, límite 500 líneas/archivo).
- Lista de bloques: día (select Dom-Sáb) + hora inicio + hora fin. Botón "Agregar horario" / eliminar por fila. Sin bloques = servicio usa horario general del profesional (fallback ya cubierto por regla del punto 2).
- Persistencia: junto con create/update del servicio existente (`POST/PATCH /api/profesional/servicios[...]`), extender payload para aceptar `availability: { dayOfWeek, startTime, endTime }[]` y reemplazar filas de `ServiceAvailability` en la misma transacción que guarda el servicio.

### 5. Endpoint de slots por día (extender existente)
`GET /api/profesional/[id]/disponibilidad?date=YYYY-MM-DD&durationMin=&serviceId=` — agregar `serviceId` (opcional) como query param, aplicar la regla de resolución del punto 2 para elegir las ventanas (`ranges`) en vez de siempre `professionalAvailability`.

### 6. Endpoint de disponibilidad mensual (nuevo, para los puntos verdes)
`GET /api/profesional/[id]/disponibilidad/mes?month=YYYY-MM&serviceId=` — devuelve `{ dates: string[] }` (formato `YYYY-MM-DD`) con los días del mes que tienen al menos un slot libre. Implementación: trae de una sola vez `appointments` y `blockedSlots` del mes completo, agrupa por día, aplica misma lógica de ventanas que el endpoint diario pero solo chequea "¿queda al menos un hueco?" (no genera la lista completa de slots de 30min por día — más liviano). Días pasados siempre `false`.

### 7. Calendario cliente — vista mensual
- Nuevo componente `MonthAvailabilityCalendar` dentro de `BookingWizard` (reemplaza el `days.map` strip actual del step 1).
- Grid 7 columnas (Dom-Sáb), header con nombre de mes + flechas `< >` para navegar (sin límite de meses hacia adelante; hacia atrás no permite ir antes del mes actual).
- Días fuera de mes: grises, no clickeables. Días pasados dentro del mes actual: grises, no clickeables.
- Días con disponibilidad (según endpoint mensual): punto verde debajo del número, clickeables.
- Días sin disponibilidad: sin punto, no clickeables (mismo estilo gris que fuera de rango, pero conserva el número del mes).
- Al click en día disponible → fetch existente de slots del día (endpoint del punto 5) se mantiene igual, se muestra debajo como ya está.
- Refetch de disponibilidad mensual cuando cambia mes visible o cambia `selectedService`.

## Auth
Mismo patrón existente: rutas de escritura (`PUT disponibilidad`, extensión de `servicios`) requieren sesión profesional autenticada, solo tocan sus propios registros. Rutas de lectura (`disponibilidad`, `disponibilidad/mes`) son públicas (ya lo son hoy).

## UI
- shadcn/ui (`Dialog`, `Switch`/checkbox, `Button`), TailwindCSS, brand tokens.
- Mobile-first (375px) y desktop (1280px).
- Componentes nuevos, ninguno > 500 líneas:
  - `WeeklyAvailabilityDialog.tsx`
  - Sección/step nuevo en wizard para horario de servicio (nombre a definir en plan)
  - `MonthAvailabilityCalendar.tsx`

## Errores
Catch server-side con console.log + feedback visual (toast) al usuario en cada guardado, nunca silencioso. Slots ya reservados que dejan de estar disponibles por cambio de horario: mismo manejo 409 que ya existe en `confirmar()` de `BookingWizard`.

## Fuera de alcance
- Timezone distinto al del profesional (ya fijo en `Professional.timezone`, no se toca).
- Excepciones puntuales por fecha en el horario de servicio (solo semanal recurrente, para excepciones ya existe `BlockedSlot`).
- Migración de datos: profesionales sin `ProfessionalAvailability` configurada siguen con el fallback hardcodeado hasta que configuren.
