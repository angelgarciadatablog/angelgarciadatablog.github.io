"""
generate_og_banner.py — genera og-default.png para el blog.

Corre una sola vez; el PNG resultante se commitea en assets/.
Requiere Pillow (usa el venv de youtube-channel-admin):
  /ruta/.venv/bin/python generate_og_banner.py

Salida: assets/og-default.png (1200x630)
"""

from pathlib import Path
import PIL.Image
import PIL.ImageDraw
import PIL.ImageFont

OUT = Path(__file__).parent / "assets" / "generico_og_banner_all_post.png"

W, H = 1200, 630

BG        = (0,   0,   0)    # negro puro
ACCENT    = (37,  99, 235)   # blue-600 (#2563eb)
ACCENT_LT = (96, 165, 250)   # blue-400 (tagline)
WHITE     = (255, 255, 255)

FONT_TITLE   = "/System/Library/Fonts/Supplemental/DIN Condensed Bold.ttf"
FONT_BRAND   = "/System/Library/Fonts/Supplemental/Arial Black.ttf"
FONT_REGULAR = "/System/Library/Fonts/Supplemental/Arial.ttf"


def main():
    img  = PIL.Image.new("RGB", (W, H), BG)
    draw = PIL.ImageDraw.Draw(img)

    # Barra de acento izquierda
    draw.rectangle([(0, 0), (8, H)], fill=ACCENT)

    # Franja inferior sutil
    draw.rectangle([(0, H - 6), (W, H)], fill=ACCENT)

    # Nombre principal
    f_name = PIL.ImageFont.truetype(FONT_TITLE, size=120)
    name   = "Angel García"
    nw     = draw.textlength(name, font=f_name)
    draw.text(((W - nw) / 2, 170), name, font=f_name, fill=WHITE)

    # Dominio en azul
    f_domain = PIL.ImageFont.truetype(FONT_BRAND, size=36)
    domain   = "angelgarciadatablog.com"
    dw       = draw.textlength(domain, font=f_domain)
    draw.text(((W - dw) / 2, 330), domain, font=f_domain, fill=ACCENT_LT)

    # Separador
    sep_y = 400
    draw.rectangle([(W // 2 - 60, sep_y), (W // 2 + 60, sep_y + 3)], fill=ACCENT)

    # Tagline
    f_tag = PIL.ImageFont.truetype(FONT_REGULAR, size=28)
    tag   = "datos · tecnología · código"
    tw    = draw.textlength(tag, font=f_tag)
    draw.text(((W - tw) / 2, 425), tag, font=f_tag, fill=(148, 163, 184))  # slate-400

    img.save(OUT, "PNG")
    print(f"Banner guardado en: {OUT}")


if __name__ == "__main__":
    main()
