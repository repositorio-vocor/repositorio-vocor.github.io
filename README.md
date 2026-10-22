# VoCor

Repositorio de material de comunicación científica de Córdoba.

**Sitio:** https://repositorio-vocor.github.io/
**Panel de carga:** https://repositorio-vocor.github.io/admin/

## Cómo se carga material

Solo pueden cargar las **personas validadas**: las que son colaboradoras de este repositorio (Settings → Collaborators). Para validar a alguien, invitalo con permiso **Write**. Para quitarle el acceso, sacalo de la lista.

### 1. Desde la web, de a uno

Entrá a `/admin/`, iniciá sesión con GitHub y usá **Nuevo material**. Al guardar, el sitio se actualiza solo en 2 o 3 minutos.

La primera vez, el panel pide un *token* de GitHub:

1. En GitHub: foto de perfil → **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.
2. *Resource owner*: `repositorio-vocor`. *Repository access*: solo `repositorio-vocor.github.io`.
3. *Permissions → Repository permissions → Contents*: **Read and write**.
4. Copiá el token y pegalo en el panel. Queda guardado en ese navegador.

(Si se prefiere un botón "Entrar con GitHub", ver la nota en `admin/config.yml`.)

### De dónde sale el material

Los investigadores cargan sus materiales en [VocAr](https://www.conicet.gov.ar/programas/vocar/recursos/), el repositorio de CONICET. El equipo de VoCor filtra lo que es de Córdoba y lo carga acá, para no mantener dos bases de datos independientes.

### 2. Carga masiva desde Excel

Ver [`importar/LEEME.md`](importar/LEEME.md). En resumen: completar la [planilla modelo](plantilla/vocor-planilla-modelo.xlsx) y subirla a la carpeta `importar/`.

## Cómo está armado

| Carpeta | Qué hay |
|---|---|
| `content/materiales/` | Un archivo `.json` por material. Es la base de datos. |
| `imagenes/` | Portadas. |
| `content/redes.json` | Sitios y redes sociales de los institutos (sección "Redes de los institutos"). Se edita desde `/admin` → Redes de los institutos. |
| `index.html`, `assets/` | El sitio público. |
| `admin/` | Panel de carga ([Sveltia CMS](https://sveltiacms.app)). `config.yml` define los campos y las listas de valores. |
| `importar/` | Donde se suben las planillas. Las procesadas y sus reportes quedan en `importar/procesadas/`. |
| `plantilla/` | Planilla modelo para la carga masiva. |
| `scripts/` | `importar.py` (planillas → materiales), `build.py` (arma el sitio), `plantilla.py` (regenera la planilla modelo). |
| `.github/workflows/publicar.yml` | Con cada cambio: importa planillas, arma el sitio y lo publica en GitHub Pages. |

### Agregar un valor nuevo a Área, Público o Formato

Editar las listas en `admin/config.yml` y en `scripts/vocor_datos.py`, y correr `python scripts/plantilla.py` para actualizar la planilla modelo.

### Probar en tu compu

```
pip install openpyxl pillow
python scripts/build.py
python -m http.server -d _site
```

## Puesta en marcha (una sola vez)

En **Settings → Pages → Build and deployment → Source**, elegir **GitHub Actions**.
