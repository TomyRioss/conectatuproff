@AGENTS.md

# Conecta Tu Proff — Instrucciones Claude

## Modo

Siempre activar `/caveman ultra` skill en cada respuesta.

## Errores

Siempre catchear errores con:
- Console log server-side
- Feedback visual UX/UI al usuario (toast, banner, mensaje inline) — nunca silencioso

## Librerías terceros

Siempre investigar si existe librería de terceros antes de implementar lógica propia. Plantear opciones al usuario.

## UI Componentes

- Siempre usar **shadcn/ui** para componentes prefabricados generales
- Siempre usar **TailwindCSS** para CSS
- Nunca usar CSS puro
- Nunca modificar `global.css`

## Branding — Paleta Conecta

Paleta completa en `conecta-brand-colors.md`. Siempre usar brand tokens Tailwind:

| Token | Hex | Uso |
|---|---|---|
| `brand-espresso` | `#3D322E` | Texto principal, headings |
| `brand-mauve` | `#847071` | Texto secundario, bordes |
| `brand-rose-dark` | `#AB737B` | CTA, botones primarios |
| `brand-rose` | `#B4898F` | Acento secundario, hover |
| `brand-rose-soft` | `#BF9EA1` | Estados disabled, badges |
| `brand-sage-dark` | `#82987F` | Éxito, confirmaciones |
| `brand-sage` | `#97AC94` | Badges verdes |
| `brand-sand` | `#AA9468` | Precios, detalles dorados |
| `brand-wheat` | `#BCA67D` | Íconos decorativos |
| `brand-gray` | `#CEC6C3` | Bordes, separadores |
| `brand-cream` | `#E3DDD9` | Fondo cards, inputs |
| `brand-cream-light` | `#F2EDE8` | Fondo de página |

**Reglas accesibilidad:**
- Texto body: solo `brand-espresso` o `brand-mauve` sobre fondos claros
- `rose/sage/sand`: solo texto grande 18px+, íconos o decorativo
- Nunca blanco puro `#FFFFFF` como fondo — usar `brand-cream-light`
- Nunca negro puro `#000000` ni gris frío

## Base de Datos

Siempre preguntar antes de cualquier cambio en DB. Solo ejecutar con consentimiento explícito del usuario.

## Diseño

Siempre responsive mobile-first (375px) y desktop (1280px).

## Arquitectura

- Metodología MVC + componentes modulares
- Nunca componentes mayores a 500 líneas — modularizar

## Investigación

Para problemas desconocidos: buscar en internet, stackoverflow, reddit antes de implementar.

## Skills por tarea

| Tarea | Skill | Modelo |
|---|---|---|
| Base de datos / Supabase | `supabase/agent-skills` + MCP Supabase | sonnet |
| Testing / browser | playwright skill + `/caveman ultra` | haiku |
| Review / auditoría | `code-simplifier`, `code-reviewer` | haiku |
| Commits / GitHub | `commit-commands` + GitHub MCP | — |
| Componentes / diseño | `frontend-design`, `brainstorming`, `ui-ux-pro-max` | — |
