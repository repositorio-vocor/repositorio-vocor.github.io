"""Arma la carpeta _site/ que publica GitHub Pages.

Junta todos los archivos de content/materiales/ en un único materiales.json
que lee el sitio, y copia las páginas, estilos e imágenes.
Para probarlo en tu compu: python scripts/build.py && python -m http.server -d _site
"""
import hashlib
import json
import shutil
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from vocor_datos import CONTENIDO, FORMATOS_OCULTOS, RAIZ

SALIDA = RAIZ / "_site"
COPIAR = ["index.html", "assets", "admin", "imagenes", "plantilla"]


def main():
    if SALIDA.exists():
        shutil.rmtree(SALIDA)
    SALIDA.mkdir()
    for nombre in COPIAR:
        origen = RAIZ / nombre
        if origen.is_dir():
            shutil.copytree(origen, SALIDA / nombre)
        elif origen.exists():
            shutil.copy2(origen, SALIDA / nombre)
    # Versiona estilos y scripts (?v=…) para que el navegador no use una copia vieja después de cada cambio
    pagina = SALIDA / "index.html"
    html = pagina.read_text(encoding="utf-8")
    for rec in ("assets/vocor.css", "assets/vocor.js"):
        v = hashlib.sha1((RAIZ / rec).read_bytes()).hexdigest()[:10]
        html = html.replace(f'"{rec}"', f'"{rec}?v={v}"')
    pagina.write_text(html, encoding="utf-8")
    materiales, errores, ocultos = [], [], 0
    for f in sorted(CONTENIDO.glob("*.json")):
        try:
            d = json.loads(f.read_text(encoding="utf-8"))
        except json.JSONDecodeError as e:
            errores.append(f"{f.name}: {e}")
            continue
        if not d.get("recurso"):
            errores.append(f"{f.name}: no tiene título (recurso)")
            continue
        d["id"] = f.stem
        formatos = [x for x in d.get("formato", []) if x not in FORMATOS_OCULTOS]
        if d.get("formato") and not formatos:
            ocultos += 1
            continue
        d["formato"] = formatos
        if d.get("imagen") and not (RAIZ / d["imagen"].lstrip("/")).exists() and not d["imagen"].startswith("http"):
            print(f"Aviso: {f.name} apunta a una imagen que no existe ({d['imagen']})")
        materiales.append(d)
    if errores:
        print("Hay materiales con problemas y no se publicaron:\n  " + "\n  ".join(errores))
    (SALIDA / "materiales.json").write_text(json.dumps(materiales, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    redes = CONTENIDO.parent / "redes.json"
    if redes.exists():
        shutil.copy2(redes, SALIDA / "redes.json")
    (SALIDA / ".nojekyll").write_text("")
    print(f"Sitio armado en _site/ con {len(materiales)} materiales ({ocultos} ocultos por formato: {', '.join(FORMATOS_OCULTOS) or 'ninguno'}).")


if __name__ == "__main__":
    main()
