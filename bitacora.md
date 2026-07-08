# Bitácora del Proyecto

## 2026-05-11

### Corrección: "Ciencia" → "Ciencias" en frontend
- **Problema:** En el gráfico de progreso (radar chart) aparecía "Ciencia" y "Ciencias" (truncado de "Ciencias Sociales"), causando confusión.
- **Solución:** Se renombró el área `'Ciencia'` a `'Ciencias'` en todos los archivos del frontend, y se eliminó el truncamiento a la primera palabra (`area.split(' ')[0]`) en el radar chart para que "Ciencias Sociales" se muestre completo.
- **Archivos modificados:**
  - `src/types/index.ts` — Tipo `Area`
  - `src/pages/DashboardPage.tsx` — Lista de áreas, colores y lógica del radar chart
  - `src/pages/ExamsPage.tsx` — Distribuciones de bloques de simulación
  - `src/pages/ExercisesPage.tsx` — Filtros y colores de áreas
  - `src/pages/AdminPage.tsx` — Formularios, plantillas y valores por defecto
- **Commit:** `c356084` — pusheado a `main`

### Restauración de contraseña de admin
- Se cambió la contraseña del admin directamente en Supabase (email: `jm8270@gmail.com`).
- No requirió cambios en el código.

### UI: Bloque seleccionado en azul en página de exámenes
- **Problema:** Al elegir un bloque en el simulacro, no se notaba claramente cuál estaba seleccionado.
- **Solución:** El bloque seleccionado ahora tiene fondo azul (`bg-blue-600`), texto blanco, icono semi-transparente y escala aumentada. Los no seleccionados mantienen fondo blanco con opacidad reducida.
- **Archivo modificado:** `src/pages/ExamsPage.tsx`

## DNI registrado
- `40924833`
