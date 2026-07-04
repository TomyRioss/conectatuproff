# Portfolio profesional — Design

## Objetivo
Profesionales pueden armar un portfolio de proyectos (estilo Upwork). Clientes ven grid de thumbnails en el perfil público y pueden entrar al detalle de cada proyecto en página propia.

## DB (migración autorizada por usuario)

Extender `PortfolioItem` existente + nueva tabla para múltiples imágenes:

```prisma
model PortfolioItem {
  id             String   @id @default(cuid())
  professionalId String
  title          String?
  description    String?  @db.Text
  imageUrl       String        // legacy cover, se mantiene por compat
  costMin        Int?
  costMax        Int?
  durationMin    Int?
  durationMax    Int?          // unidad fija: días
  tags           String[]      // texto libre
  order          Int      @default(0)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  professional Professional          @relation(fields: [professionalId], references: [id], onDelete: Cascade)
  images       PortfolioItemImage[]

  @@map("portfolio_items")
}

model PortfolioItemImage {
  id              String   @id @default(cuid())
  portfolioItemId String
  imageUrl        String
  order           Int      @default(0)

  portfolioItem PortfolioItem @relation(fields: [portfolioItemId], references: [id], onDelete: Cascade)

  @@map("portfolio_item_images")
}
```

Regla de negocio: máximo 5 imágenes por `PortfolioItem` (validado en API, no en DB).

## API (patrón igual a `servicios`)

- `POST /api/profesional/portfolio` — crea item (title, description, costMin/Max, durationMin/Max, tags, imageKeys[])
- `PATCH /api/profesional/portfolio/[id]` — edita
- `DELETE /api/profesional/portfolio/[id]` — borra (cascade imágenes, deleteFile en R2 para cada key)
- `POST /api/profesional/portfolio/upload-image` — sube a R2 (mismo patrón `servicios/upload-image/route.ts`), devuelve `key`

Todos requieren sesión con `role === "PROFESSIONAL"` y ownership del `professionalId`.

## Dashboard profesional (`app/(dashboard)/profesional/dashboard/perfil/[username]/page.tsx`)

Nueva sección "Portfolio" (grid tipo mockup: thumbnails + botón "Agregar proyecto"):
- `PortfolioSection` (server component, recibe `pro.portfolio` con `images`)
- `PortfolioFormDialog` + `PortfolioForm` (client, patrón `ServiceFormDialog`/`ServiceForm`): título, descripción, costMin/costMax, durationMin/durationMax, tags (input chip-style), hasta 5 imágenes (upload múltiple, reusa lógica de `servicios/upload-image`)
- `PortfolioCard` (patrón `ManageServiceCard`): thumbnail, editar, eliminar

## Perfil público (`app/perfil/profesional/[username]/page.tsx`)

- Grid de thumbnails portfolio (ya se hace query `portfolio`, falta el render)
- Cada thumbnail linkea a `/perfil/profesional/[username]/portfolio/[id]`

## Nueva página detalle (`app/perfil/profesional/[username]/portfolio/[id]/page.tsx`)

Estilo mockup imagen 3:
- Galería: imagen principal + laterales + contador "+N" si hay más
- Título, descripción
- Tags (chips)
- Costo: `$costMin-$costMax` (si ambos null, ocultar sección)
- Duración: `durationMin-durationMax días` (si ambos null, ocultar sección)
- 404 si `id` no pertenece a ese username o profesional inactivo

## Error handling
Todos los endpoints: try/catch, log server-side, respuesta JSON con `error` para feedback UX (toast) en el form — sin fallos silenciosos.

## Fuera de alcance
- Reordenar drag&drop de proyectos (usa `order` simple, editable solo vía numeric input si se pide después)
- Tags no ligados a Category (texto libre confirmado)
