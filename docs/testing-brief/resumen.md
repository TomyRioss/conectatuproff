# TL;DR — Testing E2E + Fixes · ConectaTuProff

**25/08/2026 · 5 agentes auditaron todo → todos los bugs arreglados → build ✅ lint ✅**

## ¿Está listo para producción?

# ✅ SÍ (MVP). Los 4 problemas graves y ~16 importantes: arreglados.

---

## 🔴 Lo grave que estaba y ya está resuelto

1. ~~Cualquiera se volvía OWNER desde la consola~~ → el rol ahora siempre se valida contra la base de datos.
2. ~~El perfil público filtraba tokens de Google y fotos de DNI en el HTML~~ → la query solo trae campos públicos. **Rotar los tokens viejos igual.**
3. ~~Se podía secuestrar el Google Calendar de un profesional~~ → el callback exige sesión y state propio.
4. ~~Plan Pro~~ → **NO TOCADO, a propósito**: MVP con Pro gratis para todos. Nadie paga. Queda así.

## 🟠 Lo importante también resuelto

- Doble reserva imposible (lock por profesional en transacción).
- El servidor revalida horarios/bloqueos/cuenta del pro antes de crear un turno (adiós curl-trampas).
- Reseñas ya no duplicables; el rating ahora sí se recalcula.
- Chatbot e IA con rate-limit y límites de uso (tu factura DeepSeek está protegida).
- Webhook MercadoPago firma verificada + reintenta si falla.
- **Zona horaria arreglada**: todo calcula hora argentina aunque el server esté en UTC.
- Botones revividos: "Agenda tú cita" lleva al agendado, footer sin 404s, login te devuelve a donde ibas, favoritos funciona en móvil.
- Agenda: se pueden borrar vacaciones, hay botón "No asistió", y no podés bloquear encima de turnos activos.
- Subidas de DNI validadas server-side (tipo/tamaño), rate-limit en registros.

## ⚠️ Antes de deployar (5 min)

1. Cargar `MP_WEBHOOK_SECRET` y `DEEPSEEK_API_KEY` en el entorno.
2. Pedir a los pros que reconecten Google Calendar (tokens viejos expuestos pre-fix).

## 📝 Deuda consciente (features / decisiones de producto)

Reprogramar turnos · sync real de Google Calendar · métricas en dashboard pro · ban/unban desde panel owner · rechazar un profesional sigue baneando su cuenta completa (requiere decidir cómo modelar el rechazo).

## 📄 Detalle completo

`docs/testing/00-index.md` ← changelog de fixes con IDs F-01..F-21
`docs/testing/01..05-*.md` ← auditoría original por usuario (file:line)
