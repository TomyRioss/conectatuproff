<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Playwright / QA local
- NO usar `playwright-cli` interactivo (sesiones daemon se cuelgan). Usar el script autocontenido:
  `node scripts/qa/audit.mjs <url> [shot.png]` (viewport 375x846, loguea solo, imprime JSON, captura a `scripts/qa/`).
- Credenciales de prueba en `CREDENTIALS.md` (no commitear ese archivo). Login profesional: `/profesional/login`.
