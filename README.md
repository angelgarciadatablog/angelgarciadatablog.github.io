# angelgarciadatablog.com

Sitio web personal de Ángel García. Blog de datos, tutoriales y recursos sobre análisis de datos.

**URL:** [angelgarciadatablog.com](https://angelgarciadatablog.com)

---

## Stack

- HTML / CSS / Vanilla JS
- GitHub Pages (hosting)
- Google Cloud Storage (datos de YouTube Analytics)
- Google Sheets CSV export (recursos, línea de tiempo)
- Google Apps Script (formulario de contacto)

---

## Estructura

```
/
├── index.html              # Página principal
├── styles.css              # Estilos globales
├── script.js               # JS de la página principal
├── CNAME                   # Dominio personalizado
├── img/                    # Imágenes y assets
├── js/
│   ├── youtube-secure.js   # Carga videos recientes desde Cloud Storage
│   ├── googleSheets.js     # Integración con Google Sheets CSV
│   ├── recursos.js         # Renderiza sección de recursos
│   └── contact-form.js     # Formulario de contacto (Google Apps Script JSONP)
├── journey/
│   └── mi-historia/        # Página de historia personal
└── tutoriales/
    └── listas-reproduccion/ # Página de analytics de playlists de YouTube
```

---

## Fuentes de datos

| Dato | Fuente |
|------|--------|
| Videos recientes (home) | `gs://angelgarciadatablog-analytics/daily/latest_videos_current.json` |
| Analytics de playlists | `gs://angelgarciadatablog-analytics/weekly/view-all-playlist-videos-weekly.json` |
| Recursos / línea de tiempo | Google Sheets (export CSV público) |

Los archivos de Cloud Storage son actualizados por un pipeline externo y se sirven públicamente via:
`https://storage.googleapis.com/angelgarciadatablog-analytics/...`

---

## Páginas

### Home (`/`)
- Carrusel de últimos 5 videos (desde Cloud Storage)
- Sección de recursos (desde Google Sheets)
- Línea de tiempo personal
- Formulario de contacto

### Listas de Reproducción (`/tutoriales/listas-reproduccion/`)
- Carga JSON plano desde Cloud Storage, agrupa por `playlist_id`
- Hero con stats globales: playlists, videos, views semanales
- Cards de playlist con expand/collapse
- Métricas por playlist: views, likes, comentarios totales + badges semanales
  - Badge azul: por encima del umbral (views > 100, likes > 5, comentarios > 1)
  - Badge rojo: por debajo del umbral
- Ordenar playlists: más vistas, más videos
- Ordenar videos por playlist: orden, más vistos, más likes, más comentarios
- Botón "cargar más" (10 videos por vez, contenedor scrollable)

### Mi Historia (`/journey/mi-historia/`)
- Página de journey personal con timeline desde Google Sheets

---

## Desarrollo local

Sin paso de build. Abrir cualquier `.html` directamente o usar un servidor local:

```bash
python3 -m http.server 8000
```

---

## Autor

**Ángel García**
- YouTube: [@angelgarciadatablog](https://www.youtube.com/@angelgarciadatablog)
- LinkedIn: [angelgarciachanga](https://www.linkedin.com/in/angelgarciachanga/)
