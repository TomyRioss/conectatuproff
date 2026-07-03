# Agenda profesional — design

## Objetivo
Página para que el profesional gestione su agenda: vista mensual con turnos/bloqueos marcados por día, click en día abre vista hora a hora con acciones.

## Alcance
- Ruta: `app/(dashboard)/profesional/agenda/page.tsx`
- Vista mensual: grid del mes actual (navegable prev/next), cada día muestra badge/punto si tiene `Appointment` o `BlockedSlot`
- Click en día → vista hora a hora (00–23h) del día seleccionado, muestra:
  - Turnos: cliente, servicio, horario, estado (`AppointmentStatus`)
  - Bloqueos: motivo, nota
- Acciones en vista día:
  - Cambiar estado de turno (confirmar / cancelar / completar)
  - Crear bloqueo puntual (`BlockedSlot`) en un rango horario del día
- Fuera de alcance: horario semanal recurrente (`ProfessionalAvailability`) — tarea aparte

## API
- `GET /api/profesional/agenda?month=YYYY-MM` — turnos + bloqueos del profesional autenticado en ese mes
- `PATCH /api/profesional/agenda/turno/[id]` — cambia `status` del `Appointment`
- `POST /api/profesional/agenda/bloqueo` — crea `BlockedSlot` (startAt, endAt, reason, note)

## Auth
Todas las rutas requieren sesión de profesional autenticado (mismo patrón que `app/api/profesional/perfil`). Solo accede a sus propios registros (`professionalId` de la sesión).

## UI
- shadcn/ui (Calendar / Dialog / Badge / Select), TailwindCSS, brand tokens
- Mobile-first (375px) y desktop (1280px)
- Componentes modulares, ningún archivo > 500 líneas:
  - `AgendaCalendario.tsx` (vista mensual)
  - `AgendaDiaModal.tsx` o vista hora a hora
  - `BloqueoForm.tsx`

## Errores
Catch server-side con console.log + feedback visual (toast) al usuario, nunca silencioso.
