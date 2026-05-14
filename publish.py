"""
Convierte posts de vault/datablog/ a HTML estático en la web.

Uso:
  python publish.py                  # publica solo status: listo o publicado
  python publish.py --borrador       # incluye borradores (para testear)
  python publish.py --slug html-fundamentos  # publica solo un post específico
"""

import os
import json
import re
import argparse
from pathlib import Path

import frontmatter
import markdown

# ─── RUTAS ────────────────────────────────────────────────────────────────────
VAULT_DATABLOG = Path.home() / "infinity-memory" / "vault" / "datablog"
WEB_ROOT = Path(__file__).parent
TEMPLATE_PATH = WEB_ROOT / "assets" / "post_template.html"
POSTS_JSON = WEB_ROOT / "posts.json"

STATUS_PUBLICABLES = {"listo", "publicado"}

# ─── ARGUMENTOS ───────────────────────────────────────────────────────────────
parser = argparse.ArgumentParser()
parser.add_argument("--borrador", action="store_true", help="incluye posts con status: borrador")
parser.add_argument("--slug", type=str, help="publica solo el post con este slug")
args = parser.parse_args()

# ─── HELPERS ──────────────────────────────────────────────────────────────────
def extraer_video_id(url):
    """Extrae el video ID de una URL de YouTube."""
    match = re.search(r"(?:v=|youtu\.be/)([A-Za-z0-9_-]{11})", url)
    return match.group(1) if match else url

# ─── CARGAR TEMPLATE ──────────────────────────────────────────────────────────
template = TEMPLATE_PATH.read_text(encoding="utf-8")

# ─── LEER TODOS LOS POSTS ─────────────────────────────────────────────────────
md_files = [f for f in VAULT_DATABLOG.glob("*.md") if f.name != "00-index.md"]

todos_los_posts = []
for md_file in md_files:
    post = frontmatter.load(md_file)
    meta = post.metadata
    if not meta.get("slug") or not meta.get("titulo"):
        continue
    todos_los_posts.append(meta)

# Índice slug → titulo para resolver temas-relacionados
slug_a_titulo = {p["slug"]: p.get("titulo", p["slug"]) for p in todos_los_posts}

# ─── FILTRAR LOS QUE SE PUBLICAN ──────────────────────────────────────────────
def debe_publicar(meta):
    status = meta.get("status", "")
    if args.slug and meta.get("slug") != args.slug:
        return False
    if args.borrador:
        return True
    return status in STATUS_PUBLICABLES

posts_a_publicar = [p for p in todos_los_posts if debe_publicar(p)]

if not posts_a_publicar:
    print("No hay posts para publicar.")
    exit()

# ─── GENERAR HTML POR POST ────────────────────────────────────────────────────
md_converter = markdown.Markdown(extensions=["fenced_code", "tables"])

indice = []

for meta in posts_a_publicar:
    # Recargar para tener el body
    slug = meta["slug"]
    md_file = VAULT_DATABLOG / f"{slug}.md"
    if not md_file.exists():
        # Buscar por nombre de archivo que tenga ese slug en el frontmatter
        for f in VAULT_DATABLOG.glob("*.md"):
            p = frontmatter.load(f)
            if p.metadata.get("slug") == slug:
                md_file = f
                break

    post = frontmatter.load(md_file)
    md_converter.reset()
    contenido_html = md_converter.convert(post.content)

    # Tags
    tags_raw = meta.get("tags", [])
    tags_html = " ".join(f'<span class="post-tag">{t}</span>' for t in tags_raw)

    # Video YouTube
    video_url = meta.get("video-youtube", "")
    if video_url:
        video_id = extraer_video_id(video_url)
        video_html = f"""
<div class="post-video">
  <div class="post-video-title">Video explicativo</div>
  <iframe src="https://www.youtube.com/embed/{video_id}" allowfullscreen></iframe>
</div>"""
    else:
        video_html = ""

    # Temas relacionados
    relacionados_raw = meta.get("temas-relacionados") or []
    if relacionados_raw:
        items = ""
        for s in relacionados_raw:
            titulo_rel = slug_a_titulo.get(s, s)
            items += f'<a class="relacionado-item" href="/{s}">{titulo_rel}</a>\n'
        relacionados_html = f"""
<div class="post-relacionados">
  <div class="post-relacionados-titulo">Posts relacionados</div>
  <div class="relacionados-lista">
    {items}
  </div>
</div>"""
    else:
        relacionados_html = ""

    # Sistema operativo
    so = meta.get("sistema-operativo", "")
    so_labels = {"mac": "Mac", "windows": "Windows", "mac-windows": "Mac & Windows"}
    so_html = f'<span class="post-so">{so_labels.get(so, so)}</span>' if so else ""

    # Rellenar template
    html = template
    html = html.replace("{{slug}}", slug)
    html = html.replace("{{titulo}}", meta.get("titulo", ""))
    html = html.replace("{{descripcion}}", meta.get("titulo", ""))
    html = html.replace("{{categoria}}", meta.get("categoria", ""))
    html = html.replace("{{updated}}", str(meta.get("updated", "")))
    html = html.replace("{{tags}}", tags_html)
    html = html.replace("{{sistema_operativo}}", so_html)
    html = html.replace("{{contenido}}", contenido_html)
    html = html.replace("{{video_youtube}}", video_html)
    html = html.replace("{{temas_relacionados}}", relacionados_html)

    # Escribir archivo
    output_dir = WEB_ROOT / slug
    output_dir.mkdir(exist_ok=True)
    (output_dir / "index.html").write_text(html, encoding="utf-8")
    print(f"✓ {slug}/index.html")

    # Agregar al índice
    indice.append({
        "titulo": meta.get("titulo", ""),
        "slug": slug,
        "categoria": meta.get("categoria", ""),
        "tags": tags_raw,
        "updated": str(meta.get("updated", "")),
        "temas-relacionados": relacionados_raw,
        "video-youtube": video_url or "",
        "sistema-operativo": meta.get("sistema-operativo", ""),
    })

# ─── ACTUALIZAR posts.json ────────────────────────────────────────────────────
# Mezcla con el índice existente para no borrar posts ya publicados
if POSTS_JSON.exists():
    existentes = json.loads(POSTS_JSON.read_text(encoding="utf-8"))
    slugs_nuevos = {p["slug"] for p in indice}
    existentes = [p for p in existentes if p["slug"] not in slugs_nuevos]
    indice = existentes + indice

indice.sort(key=lambda p: p["updated"], reverse=True)
POSTS_JSON.write_text(json.dumps(indice, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"✓ posts.json actualizado ({len(indice)} posts)")
