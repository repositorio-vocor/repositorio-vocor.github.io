# Carga masiva desde Excel

1. Descargá la [planilla modelo](../plantilla/vocor-planilla-modelo.xlsx) y completá una fila por material.
2. Subila a **esta carpeta**: botón **Add file → Upload files**, arrastrá el `.xlsx` y confirmá con **Commit changes**.
3. En 2 o 3 minutos los materiales aparecen en el sitio.

Después de procesarla, la planilla se mueve a `procesadas/` junto con un **reporte** que dice qué filas entraron y cuáles no (y por qué). También podés verlo en la pestaña **Actions** del repositorio.

Reglas:

- Obligatorios: **Recurso**, **UE** y **Formato**.
- Varios valores en una celda: separalos con punto y coma (`IDEA; IMBIV`).
- Si ya existe un material con el mismo título, la fila se saltea.
- Columna **Imagen** (opcional): dirección web de la portada; se descarga sola.
- Formatos aceptados: `.xlsx` y `.csv`. Si tenés un `.xls` viejo, guardalo como `.xlsx`.
