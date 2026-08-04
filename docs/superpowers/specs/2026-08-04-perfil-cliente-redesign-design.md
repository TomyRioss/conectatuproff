# Perfil cliente — rediseño (2026-08-04)

## Contexto

`app/perfil/cliente/[username]/page.tsx` usa banner oscuro + avatar centrado. Referencia visual: card de perfil de Workana (avatar izq, stats grid, sin banner).

## Cambios

### Header
- Reemplazar banner oscuro + avatar centrado por card blanca: avatar circular a la izquierda, a la derecha nombre + botón editar, `@username`, badge verificado.
- Fila de stats dentro de la misma card: Turnos, Reseñas, Último login, Miembro desde.
- **Último login**: `User.lastActivity` (ya existe en schema, sin migración). Formatear relativo ("Hace X horas/días", "Nunca" si `null`).
- **Miembro desde**: ya existe (`Client.createdAt`), sin cambios de lógica.

### Info personal
Sin cambios (Email, Teléfono, Lugar, DNI vía `EditableDataRow`).

### Historial de reseñas (nueva sección)
- Query `prisma.review.findMany({ where: { clientId }, include: { professional: { select: firstName, lastName, avatarUrl } }, orderBy: createdAt desc })`.
- Cada item: avatar/nombre profesional, estrellas (rating), comentario, fecha relativa.
- Vacío: "Aún no dejaste reseñas".

## Fuera de alcance
- Sin cambios de schema/DB.
- Sin cambios a `EditProfileModal` / `EditableDataRow`.
