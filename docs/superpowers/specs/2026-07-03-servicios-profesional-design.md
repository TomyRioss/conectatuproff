# Sección Servicios — Profesional

## Objetivo
Profesional crea/gestiona posts de servicios (título, precio, duración, modalidad, imagen) desde su dashboard.

## Alcance
CRUD completo: crear, editar, activar/desactivar, eliminar. Modelo `Service` en schema ya cubre los campos — sin cambios de DB.

## Rutas nuevas
- `app/(dashboard)/profesional/servicios/page.tsx` — grid de cards. Botón "Nuevo servicio" abre form. Cada card: imagen, título, precio, duración, badge activo/inactivo, menú editar/eliminar/toggle.
- `components/profesionales/ServiceFormDialog.tsx` — shadcn Dialog. Campos: título, descripción, precio, moneda (ARS fijo), duración (min), modalidad (select ONLINE/IN_PERSON/HYBRID), categoría (opcional, select de categorías existentes), imagen (upload).
- `components/profesionales/ServiceCard.tsx` — card individual.

## API nueva
- `app/api/profesional/servicios/route.ts`
  - GET: lista servicios del profesional autenticado (via `professional.userId = session.user.id`)
  - POST: crea servicio
- `app/api/profesional/servicios/[id]/route.ts`
  - PATCH: edita campos / toggle `isActive`
  - DELETE: elimina
- `app/api/profesional/servicios/upload-image/route.ts`
  - Mismo patrón que `upload-avatar/route.ts`: valida sesión PROFESSIONAL, tipo/tamaño (5MB, jpeg/png/webp), key `profesionales/servicios/{userId}/{uuid}.ext`, devuelve `{ key }`.
  - Imagen se sirve luego vía `/api/avatar?key=...` (ruta genérica existente, reutilizada).

## Auth / ownership
Todo endpoint valida `session.user.role === "PROFESSIONAL"`. Mutaciones sobre `[id]` validan que el `Service.professionalId` pertenezca al `Professional` del usuario en sesión (404 si no).

## Errores
Cada mutación: try/catch, `console.error` server-side, toast de error client-side (nunca fallo silencioso). Regla del proyecto (CLAUDE.md).

## UI
- shadcn/ui + TailwindCSS, brand tokens (`brand-green` CTA nuevo servicio, `brand-violet` secundario, `brand-dark`/`brand-gray` texto, `brand-bg` fondo cards con `border-gray-200`).
- Mobile-first (375px) y desktop (1280px).
- Link "Servicios" en Navbar ya apunta a `/profesional/servicios` (existente, sin cambios).

## Fuera de alcance
Paquetes y Agenda (ya tienen links en Navbar, no se tocan). Categoría de servicio opcional — si no se elige, `categoryId` null.
