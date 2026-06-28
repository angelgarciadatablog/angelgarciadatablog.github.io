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
from datetime import date

import frontmatter
import markdown

# ─── RUTAS ────────────────────────────────────────────────────────────────────
VAULT_DATABLOG = Path.home() / "infinity-memory" / "vault" / "datablog"
WEB_ROOT = Path(__file__).parent
TEMPLATE_PATH = WEB_ROOT / "assets" / "post_template.html"
TOMBSTONE_TEMPLATE_PATH = WEB_ROOT / "assets" / "tombstone_template.html"
POSTS_JSON = WEB_ROOT / "posts.json"
LINKS_PERDIDOS = WEB_ROOT / "links-perdidos.json"

BASE_URL = "https://www.angelgarciadatablog.com"
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


def normalizar_videos(value):
    """Normaliza el campo `video-youtube` a una lista de dicts {titulo, url}.

    El campo es polimórfico (ver vault/proyectos/web-angelgarciadatablog.md):
    - "" / None             → []  (sin video)
    - "https://..."         → un video con título por defecto "Video explicativo"
    - ["url1", "url2", ...]  → varios videos sin título explícito
    - [{titulo, url}, ...]   → varios videos, cada uno con su etiqueta propia
    """
    if not value:
        return []
    if isinstance(value, str):
        return [{"titulo": "Video explicativo", "url": value}]
    videos = []
    for item in value:
        if isinstance(item, str):
            videos.append({"titulo": "Video explicativo", "url": item})
        elif isinstance(item, dict) and item.get("url"):
            videos.append({"titulo": item.get("titulo") or "Video explicativo", "url": item["url"]})
    return videos


def escribir_lapida(slug):
    """Genera una página-lápida estética para un slug borrado (link perdido).

    Política (ver vault/proyectos/web-angelgarciadatablog.md → 'Política de borrado'):
    la URL vieja nunca hace 404 ni redirect silencioso; muestra una lápida visible
    con un botón manual hacia el home.
    """
    tpl = TOMBSTONE_TEMPLATE_PATH.read_text(encoding="utf-8")

    datalayer = {"event": "tombstone_view", "slug_retirado": slug}
    datalayer_push = ("<script>\nwindow.dataLayer = window.dataLayer || [];\n"
                      f"window.dataLayer.push({json.dumps(datalayer, ensure_ascii=False)});\n</script>")

    html = tpl
    html = html.replace("{{titulo_pagina}}", "Contenido no disponible")
    html = html.replace("{{head_extra}}", '<meta name="robots" content="noindex, follow" />')
    html = html.replace("{{datalayer_push}}", datalayer_push)
    html = html.replace("{{icono}}", "○")
    html = html.replace("{{mensaje_titulo}}", "Este contenido cambió de lugar")
    html = html.replace("{{mensaje_texto}}",
                        "La página que buscabas se actualizó o se movió. "
                        "Te invitamos a seguir explorando desde el inicio.")
    html = html.replace("{{boton_url}}", "/")
    html = html.replace("{{boton_texto}}", "Ir al inicio")

    out_dir = WEB_ROOT / slug
    out_dir.mkdir(exist_ok=True)
    (out_dir / "index.html").write_text(html, encoding="utf-8")

# ─── CARGAR TEMPLATE ──────────────────────────────────────────────────────────
template = TEMPLATE_PATH.read_text(encoding="utf-8")

# ─── LEER TODOS LOS POSTS ─────────────────────────────────────────────────────
md_files = [f for f in VAULT_DATABLOG.glob("**/*.md") if f.name != "00-index.md"]

todos_los_posts = []
for md_file in md_files:
    post = frontmatter.load(md_file)
    meta = post.metadata
    if not meta.get("slug") or not meta.get("titulo"):
        continue
    todos_los_posts.append(meta)

# Índice slug → titulo para resolver posts-relacionados y navegación de serie
slug_a_titulo = {p["slug"]: p.get("titulo", p["slug"]) for p in todos_los_posts}

# Slugs que tendrán página publicada (status listo/publicado). Un post-relacionado
# que no esté aquí (tema aún no publicado, o borrador) NO se renderiza, para evitar
# generar un enlace a una URL inexistente (404 que la lápida no cubre).
slugs_publicables = {p["slug"] for p in todos_los_posts if p.get("status") in STATUS_PUBLICABLES}

# ─── REGISTRO DE LINKS PERDIDOS (slugs borrados) ──────────────────────────────
# Un slug que estuvo publicado (posts.json) pero ya no existe en el vault es un
# "link perdido". Se registra en links-perdidos.json (memoria persistente + reporte
# para Ángel). Su URL mostrará una lápida estética hacia el home, nunca un 404.
# No se edita a mano: el script lo mantiene solo.
vault_slugs = {p["slug"] for p in todos_los_posts}

links_perdidos = []
if LINKS_PERDIDOS.exists():
    links_perdidos = json.loads(LINKS_PERDIDOS.read_text(encoding="utf-8"))
registrados = {e["slug"] for e in links_perdidos}

publicados_antes = set()
if POSTS_JSON.exists():
    publicados_antes = {p["slug"] for p in json.loads(POSTS_JSON.read_text(encoding="utf-8"))}

nuevos_perdidos = publicados_antes - vault_slugs - registrados
if nuevos_perdidos:
    hoy = date.today().isoformat()
    for s in sorted(nuevos_perdidos):
        links_perdidos.append({"slug": s, "url": f"{BASE_URL}/{s}", "detectado": hoy})
        print(f"🔗 link perdido nuevo: {s}  → registrado en links-perdidos.json")
    LINKS_PERDIDOS.write_text(json.dumps(links_perdidos, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

# Memoria completa de slugs retirados (regenera su lápida en cada corrida)
retired_slugs = {e["slug"] for e in links_perdidos}

# ─── FILTRAR LOS QUE SE PUBLICAN ──────────────────────────────────────────────
def debe_publicar(meta):
    status = meta.get("status", "")
    if args.slug and meta.get("slug") != args.slug:
        return False
    if args.borrador:
        return True
    return status in STATUS_PUBLICABLES

posts_a_publicar = [p for p in todos_los_posts if debe_publicar(p)]

if not posts_a_publicar and not retired_slugs:
    print("No hay posts para publicar ni lápidas que generar.")
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
        for f in VAULT_DATABLOG.glob("**/*.md"):
            p = frontmatter.load(f)
            if p.metadata.get("slug") == slug:
                md_file = f
                break

    post = frontmatter.load(md_file)
    body = re.sub(r'^\s*#[^#][^\n]*\n?', '', post.content, count=1)
    md_converter.reset()
    contenido_html = md_converter.convert(body)

    # Tags
    tags_raw = meta.get("tags", [])
    tags_html = " ".join(f'<span class="post-tag">{t}</span>' for t in tags_raw)

    # Video(s) de YouTube — campo polimórfico: string (un video) o lista de
    # {titulo, url} (varios). Ver decisión en vault/proyectos/web-angelgarciadatablog.md
    videos = normalizar_videos(meta.get("video-youtube", ""))
    video_urls = [v["url"] for v in videos]
    video_html = ""
    for v in videos:
        video_id = extraer_video_id(v["url"])
        video_html += f"""
<div class="post-video">
  <div class="post-video-title">{v["titulo"]}</div>
  <iframe src="https://www.youtube.com/embed/{video_id}" allowfullscreen></iframe>
</div>"""

    # Posts relacionados (solo los que tendrán página publicada — el resto se omite)
    relacionados_raw = meta.get("posts-relacionados") or []
    items = ""
    for s in relacionados_raw:
        if s not in slugs_publicables:
            continue
        titulo_rel = slug_a_titulo.get(s, s)
        items += f'<a class="relacionado-item" href="/{s}">{titulo_rel}</a>\n'
    if items:
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

    # Navegación prev/next
    serie = meta.get("serie", "") or ""
    parte_anterior = meta.get("parte-anterior", "") or ""
    parte_siguiente = meta.get("parte-siguiente", "") or ""
    series_relacionadas = meta.get("series-relacionadas", "") or ""

    if parte_anterior:
        titulo_anterior = slug_a_titulo.get(parte_anterior, parte_anterior)
        nav_anterior_html = f'<a class="nav-anterior" href="/{parte_anterior}"><span class="nav-label">← Anterior en la serie</span><span class="nav-titulo">{titulo_anterior}</span></a>'
    else:
        nav_anterior_html = ""

    if parte_siguiente:
        titulo_siguiente = slug_a_titulo.get(parte_siguiente, parte_siguiente)
        nav_siguiente_html = f'<a class="nav-siguiente" href="/{parte_siguiente}"><span class="nav-label">Siguiente en la serie →</span><span class="nav-titulo">{titulo_siguiente}</span></a>'
    else:
        nav_siguiente_html = ""

    # DataLayer push — metadatos del post para GTM
    datalayer_data = {
        "titulo": meta.get("titulo", ""),
        "categoria": meta.get("categoria", ""),
        "serie": serie,
        "series_relacionadas": series_relacionadas,
        "slug": slug,
        "sistema_operativo": meta.get("sistema-operativo", ""),
        "fecha_publicacion": str(meta.get("created", "")),
        "video_youtube": video_urls,
    }
    datalayer_json = json.dumps(datalayer_data, ensure_ascii=False)
    datalayer_push = f"<script>\nwindow.dataLayer = window.dataLayer || [];\nwindow.dataLayer.push({datalayer_json});\n</script>"

    # Rellenar template
    canonical_url = f"https://www.angelgarciadatablog.com/{slug}/"
    og_image = "https://www.angelgarciadatablog.com/assets/generico_og_banner_all_post.png"

    html = template
    html = html.replace("{{datalayer_push}}", datalayer_push)
    html = html.replace("{{slug}}", slug)
    html = html.replace("{{canonical_url}}", canonical_url)
    html = html.replace("{{og_image}}", og_image)
    html = html.replace("{{titulo}}", meta.get("titulo", ""))
    html = html.replace("{{descripcion}}", meta.get("descripcion", "") or meta.get("titulo", ""))
    html = html.replace("{{categoria}}", meta.get("categoria", ""))
    html = html.replace("{{updated}}", str(meta.get("updated", "")))
    html = html.replace("{{tags}}", tags_html)
    html = html.replace("{{sistema_operativo}}", so_html)
    html = html.replace("{{contenido}}", contenido_html)
    html = html.replace("{{video_youtube}}", video_html)
    html = html.replace("{{posts_relacionados}}", relacionados_html)
    html = html.replace("{{nav_anterior}}", nav_anterior_html)
    html = html.replace("{{nav_siguiente}}", nav_siguiente_html)

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
        "posts-relacionados": relacionados_raw,
        "video-youtube": video_urls,
        "sistema-operativo": meta.get("sistema-operativo", ""),
        "repositorio": meta.get("repositorio", "") or "",
        "descripcion": meta.get("descripcion", "") or "",
        "serie": serie,
        "series-relacionadas": series_relacionadas,
        "parte-anterior": parte_anterior,
        "parte-siguiente": parte_siguiente,
    })

# ─── ACTUALIZAR posts.json ────────────────────────────────────────────────────
# Mezcla con el índice existente para no borrar posts ya publicados
if POSTS_JSON.exists():
    existentes = json.loads(POSTS_JSON.read_text(encoding="utf-8"))
    slugs_nuevos = {p["slug"] for p in indice}
    existentes = [p for p in existentes if p["slug"] not in slugs_nuevos]
    indice = existentes + indice

# ─── GENERAR LÁPIDAS (links perdidos) ─────────────────────────────────────────
for s in sorted(retired_slugs):
    escribir_lapida(s)
    print(f"🪦 lápida: {s}/ → home")
# Los slugs retirados no deben listarse en la home ni indexarse en el sitemap
indice = [p for p in indice if p["slug"] not in retired_slugs]
# Limpiar referencias colgantes a slugs retirados en los posts que quedan
for p in indice:
    if p.get("posts-relacionados"):
        p["posts-relacionados"] = [s for s in p["posts-relacionados"] if s not in retired_slugs]
    if p.get("parte-anterior") in retired_slugs:
        p["parte-anterior"] = ""
    if p.get("parte-siguiente") in retired_slugs:
        p["parte-siguiente"] = ""

indice.sort(key=lambda p: p["updated"], reverse=True)
POSTS_JSON.write_text(json.dumps(indice, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"✓ posts.json actualizado ({len(indice)} posts)")

# ─── GENERAR sitemap.xml ──────────────────────────────────────────────────────
urls = [f'  <url>\n    <loc>{BASE_URL}/</loc>\n  </url>']
for p in indice:
    urls.append(f'  <url>\n    <loc>{BASE_URL}/{p["slug"]}/</loc>\n    <lastmod>{p["updated"]}</lastmod>\n  </url>')

sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n'
sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
sitemap += "\n".join(urls) + "\n"
sitemap += "</urlset>\n"

(WEB_ROOT / "sitemap.xml").write_text(sitemap, encoding="utf-8")
print(f"✓ sitemap.xml actualizado ({len(indice) + 1} URLs)")
