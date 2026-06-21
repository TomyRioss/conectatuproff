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

Paleta completa en `docs/conectatuprof-palette.md`. Siempre usar brand tokens Tailwind. Nunca hex hardcodeado en markup.

| Token | Hex | Uso |
|---|---|---|
| `brand-green` | `#1EC97E` | Botón principal, CTAs — una sola acción primaria por vista |
| `brand-violet` | `#6C5CE7` | Botones secundarios, precios destacados |
| `brand-dark` | `#1A1A2E` | Títulos, texto principal, navbar/header bg |
| `brand-gray` | `#6B7280` | Texto de apoyo, etiquetas, metadata |
| `brand-bg` | `#F3F4F8` | Fondo de página y tarjetas |

**Reglas accesibilidad (WCAG AA):**
- `brand-dark` sobre blanco o `brand-bg`: ✅ texto normal
- Blanco sobre `brand-green`, `brand-violet` o `brand-dark`: ✅ botones
- `brand-gray` sobre `brand-bg`: ⚠️ solo texto ≥14px
- `brand-green` o `brand-violet` como color de texto sobre `brand-bg`: ❌ no usar
- Cards con `bg-brand-bg`: agregar `border border-gray-200` para definir borde

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
