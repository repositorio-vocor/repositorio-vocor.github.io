"""Funciones y vocabularios compartidos por los scripts de VoCor.

Si agregás un valor nuevo de Área, Público o Formato, sumalo también en
admin/config.yml para que aparezca en el panel de carga.
"""
import json
import re
import unicodedata
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
CONTENIDO = RAIZ / "content" / "materiales"
IMAGENES = RAIZ / "imagenes"

# Las mismas cuatro grandes áreas de CONICET que usan las redes de los institutos.
AREAS = [
    "Ciencias Agrarias, de las Ingenierías y Materiales / Desarrollo Tecnológico y Social",
    "Ciencias Biológicas y de la Salud",
    "Ciencias Exactas y Naturales",
    "Ciencias Sociales y Humanidades",
]
PUBLICOS = [
    "Público General",
    "Infancia temprana (0-5 años)",
    "Infantil (7 a 11 años)",
    "Juvenil (12 a 18 años)",
    "Docentes",
]
FORMATOS = [
    "Audiovisual", "Podcast", "Material didáctico", "Libro", "Revista", "Notas y entrevistas", "Sitio Web",
]
# Formatos que por ahora NO se muestran en el sitio. Sus materiales se conservan en
# content/materiales/ y se pueden seguir cargando; para volver a mostrarlos, sacalos de esta lista.
FORMATOS_OCULTOS = ["Notas y entrevistas"]
# Nombres viejos que se convierten al importar planillas.
ALIAS_FORMATO = {
    "nota": "Notas y entrevistas", "notas": "Notas y entrevistas", "entrevista": "Notas y entrevistas", "entrevistas": "Notas y entrevistas",
    "video": "Audiovisual", "videos": "Audiovisual", "cartilla": "Material didáctico", "recursos para docentes": "Material didáctico",
    "revista anual": "Revista", "libros": "Libro", "revistas": "Revista",
    "publicacion de divulgacion cientifica": "Material didáctico", "publicacion": "Material didáctico", "webinar": "Audiovisual", "webinars": "Audiovisual", "redes sociales": "Material didáctico",
}

# Valores que llevan coma adentro y no se deben partir.
CON_COMA = {
    "area": {"tecnologia, de la ingenieria y materiales": "Ciencias Agrarias, de las Ingenierías y Materiales / Desarrollo Tecnológico y Social",
             "ciencias agrarias, de las ingenierias y materiales / desarrollo tecnologico y social": "Ciencias Agrarias, de las Ingenierías y Materiales / Desarrollo Tecnológico y Social",
             "ciencias agrarias, de las ingenierias y materiales": "Ciencias Agrarias, de las Ingenierías y Materiales / Desarrollo Tecnológico y Social",
             # nombres viejos o abreviados de la misma área
             "ciencias agrarias": AREAS[0], "agrarias": AREAS[0], "tecnologia": AREAS[0], "ingenieria": AREAS[0],
             "ciencias agrarias, de las ingenierias y materiales / desarrollo tecnologico y social": AREAS[0]},
    "formato": {"recursos para docentes (planificaciones, manuales, etc)": "Material didáctico"},
}
VOCAB = {"area": AREAS, "publico": PUBLICOS, "formato": FORMATOS}

CAMPOS = ["recurso", "ue", "area", "formato", "publico", "palabras", "descripcion", "links", "imagen", "origen", "creado"]


def norm(s):
    s = unicodedata.normalize("NFD", str(s or "")).encode("ascii", "ignore").decode()
    return re.sub(r"\s+", " ", s.lower()).strip()


def slugify(s, largo=70):
    s = re.sub(r"[^a-z0-9]+", "-", norm(s)).strip("-")
    return (s[:largo].rstrip("-")) or "material"


def separar(valor, campo):
    """Parte una celda con varios valores (separados por ; , o salto de línea)."""
    partes = [p.strip() for p in re.split(r"[;,\n]", str(valor or "")) if p.strip()]
    especiales = dict(CON_COMA.get(campo, {}))
    especiales.update({norm(v): v for v in VOCAB.get(campo, []) if "," in v})
    salida, i = [], 0
    while i < len(partes):
        v, paso = None, 1
        for j in range(min(len(partes), i + 4), i + 1, -1):  # une partes que formaban un valor con coma
            unido = norm(", ".join(partes[i:j]))
            if unido in especiales:
                v, paso = especiales[unido], j - i
                break
        if v is None:
            p = partes[i]
            v = especiales.get(norm(p)) or (ALIAS_FORMATO.get(norm(p)) if campo == "formato" else None) or next((x for x in VOCAB.get(campo, []) if norm(x) == norm(p)), p)
        if v not in salida:
            salida.append(v)
        i += paso
    return salida


def separar_palabras(valor):
    return [k.strip(" .") for k in re.split(r"\s[-–]\s|[,;\n]", str(valor or "")) if k.strip(" .")]


def separar_links(valor):
    """Devuelve [{"url": ...}] con cada dirección web que aparezca en la celda."""
    return [{"url": l.rstrip(").,;")} for l in re.findall(r"https?://[^\s,;]+", str(valor or ""))]


def cargar_materiales():
    items = []
    for f in sorted(CONTENIDO.glob("*.json")):
        d = json.loads(f.read_text(encoding="utf-8"))
        d["id"] = f.stem
        items.append(d)
    return items


def nombre_libre(base, existentes):
    nombre, n = base, 2
    while nombre in existentes:
        nombre = f"{base}-{n}"
        n += 1
    existentes.add(nombre)
    return nombre


def guardar_material(slug, datos):
    CONTENIDO.mkdir(parents=True, exist_ok=True)
    limpio = {k: datos.get(k) for k in CAMPOS if datos.get(k) not in (None, "", [])}
    (CONTENIDO / f"{slug}.json").write_text(json.dumps(limpio, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
