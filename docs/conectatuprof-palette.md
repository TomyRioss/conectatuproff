# Paleta de Colores — ConectaTuProf

Instrucciones para aplicar la identidad visual de ConectaTuProf usando Tailwind CSS. Definir estos colores en `tailwind.config.js` y usarlos exclusivamente vía clases utilitarias, nunca hex hardcodeado en el markup.

## Configuración Tailwind

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#1EC97E',
          violet: '#6C5CE7',
          dark: '#1A1A2E',
          gray: '#6B7280',
          bg: '#F3F4F8',
        },
      },
    },
  },
}
```

## Reglas de uso

- **`brand-green`** (`#1EC97E`): botón principal y CTAs. `bg-brand-green text-white`. Es el color de mayor jerarquía — reservarlo para una sola acción primaria por vista, no repetirlo en múltiples botones de la misma pantalla.
- **`brand-violet`** (`#6C5CE7`): botones secundarios y precios destacados. `bg-brand-violet text-white` o `text-brand-violet` para precios sobre fondo claro.
- **`brand-dark`** (`#1A1A2E`): títulos y texto principal. `text-brand-dark`. También válido como `bg-brand-dark text-white` para headers/navbar (como en la imagen de referencia).
- **`brand-gray`** (`#6B7280`): texto de apoyo, etiquetas, metadata. `text-brand-gray`.
- **`brand-bg`** (`#F3F4F8`): fondo de página y tarjetas (`bg-brand-bg`). Combinar con `border border-gray-200` en cards para definir el borde, ya que el contraste entre `brand-bg` y blanco es mínimo.

## Contraste (WCAG AA)

- ✅ `brand-dark` sobre blanco o `brand-bg`: apto para texto normal.
- ✅ blanco sobre `brand-green`, `brand-violet` o `brand-dark`: apto para botones.
- ⚠️ `brand-gray` sobre `brand-bg`: usar solo para texto ≥14px, evitar en textos muy pequeños (badges diminutos).
- ❌ `brand-green` o `brand-violet` como color de texto sobre `brand-bg`: contraste insuficiente, no usar.

## Pendiente / no incluido en esta paleta

No hay colores definidos para estados de error, éxito o advertencia. Si se requieren (validación de formularios, alertas), no reutilizar `brand-green` para "éxito" sin verificar que no genere confusión con el CTA principal — definir una paleta de estados aparte.
