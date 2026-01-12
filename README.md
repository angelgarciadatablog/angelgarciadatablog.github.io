# 🎓 angelgarciadatablog.github.io

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Active-success)](https://angelgarciadatablog.github.io)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Sitio web personal de **Ángel García**: proyectos, cursos gratuitos y recursos sobre análisis de datos, SQL, Power BI, Google Analytics y programación.

🌐 **URL:** [angelgarciadatablog.github.io](https://angelgarciadatablog.github.io)

---

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Tecnologías](#-tecnologías)
- [Automatización](#-automatización)
- [Panel de Administración](#-panel-de-administración)
- [Desarrollo Local](#-desarrollo-local)
- [Documentación](#-documentación)

---

## ✨ Características

### 🎥 Videos Recientes
- Carga **instantánea** desde JSON estático
- Actualización **automática diaria** vía GitHub Actions (9 AM hora Perú)
- Sin llamadas a APIs en producción

### 📚 Bloque de Cursos Gratuitos que están en el home
- **SQL en BigQuery** - Completo
- **Power BI** - Completo
- **Google Analytics 4** - Completo
- Datos desde Google Sheets con caché de 60 minutos

### 🎬 Tutoriales
- **Listas de Reproducción** - Todas las playlists del canal
- **Temas Importantes** - Videos destacados curados

### 📝 Recursos
- Enlaces a Notion con apuntes y materiales
- Timeline interactivo del journey como analista de datos

---

## 📁 Estructura del Proyecto

```
.
├── .github/
│   └── workflows/
│       └── update-videos.yml          # GitHub Action (actualización diaria)
├── cloud-function/                     # Cloud Function de YouTube API
│   └── index.js                       # Código de la función
├── config/
│   └── cursos.json                    # Configuración de cursos
├── cursos/                            # Páginas de cursos individuales
│   ├── sql-bigquery/
│   ├── power-bi/
│   └── google-analytics/
├── datos/                             # Archivos JSON estáticos
│   ├── videos-recientes.json          # 3 videos más recientes (auto)
│   ├── listas-reproduccion-playlist.json      # Todas las playlists
│   ├── sql-bigquery-playlist.json
│   ├── power-bi-playlist.json
│   └── google-analytics-playlist.json
├── js/                                # JavaScript modular
│   ├── googleSheets.js                # Integración con Google Sheets
│   ├── youtube-secure.js              # Carga de videos desde JSON
│   ├── cursos.js                      # Renderizado de cursos
│   └── recursos.js                    # Recursos de Notion
├── scripts/
│   └── update-videos-recientes.js     # Script Node.js (usado por GH Actions)
├── tutoriales/
│   ├── listas-reproduccion/           # Página de playlists
│   └── temas-importantes/             # Videos importantes
├── journey/
│   └── mi-historia/                   # Timeline personal
├── docs/                              # Documentación del proyecto
│   ├── formulario/                    # Docs del formulario de contacto
│   ├── SEGURIDAD.md                   # Análisis de seguridad
│   ├── LLAMADAS-EXTERNAS.md          # Auditoría de APIs
│   └── FLUJO-CURSOS.md               # Flujo de actualización de cursos
├── index.html                         # Página principal
├── styles.css                         # Estilos globales
├── script.js                          # JavaScript global
└── README.md                          # Este archivo
```

---

## 🛠️ Tecnologías

### Frontend
- **HTML5** - Semántico y accesible
- **CSS3** - Variables CSS, Grid, Flexbox
- **Vanilla JavaScript** - Sin frameworks, modular
- **GitHub Pages** - Hosting gratuito

### Integraciones
- **Google Sheets API** - Datos dinámicos (cursos, recursos)
- **Cloud Function (GCP)** - YouTube Data API v3
- **GitHub Actions** - Automatización CI/CD

### Optimizaciones
- Caché dual (memoria + localStorage) - 60 minutos
- JSON estático para videos (carga instantánea)
- Lazy loading de imágenes
- Versioning de assets (`?v=2`)

---

## 🤖 Automatización

### GitHub Actions - Actualización Diaria

**Workflow:** `.github/workflows/update-videos.yml`

**Horario:** Todos los días a las 9:00 AM (hora Perú, UTC-5)

**Proceso:**
1. Llama a Cloud Function
2. Obtiene 3 videos más recientes del canal
3. Actualiza `datos/videos-recientes.json`
4. Hace commit automático si hay cambios

**Ejecución manual:**
```bash
# Desde GitHub
Actions → "Actualizar Videos Recientes" → Run workflow

# Desde local
node scripts/update-videos-recientes.js
```

**Ver historial:**
- GitHub → Actions → Actualizar Videos Recientes

---

## 🔄 Actualización de Datos

Los datos de cursos y playlists se actualizan mediante scripts de Node.js:

### Scripts disponibles:

#### 1. Actualizar cualquier curso (Universal)
```bash
# Actualizar curso de SQL BigQuery
node scripts/update-course.js sql-bigquery

# Actualizar curso de Power BI
node scripts/update-course.js power-bi

# Actualizar curso de Google Analytics 4
node scripts/update-course.js google-analytics

# Actualizar cualquier curso nuevo que agregues
node scripts/update-course.js <id-del-curso>

# Forzar actualización ignorando caché de 12 horas
node scripts/update-course.js sql-bigquery --clear-cache
```
**Ventajas:**
- ✅ Un solo script para todos los cursos
- ✅ No necesitas crear script nuevo al agregar curso
- ✅ Detecta automáticamente nuevos módulos
- ✅ Opción `--clear-cache` para actualizar inmediatamente

#### 2. Actualizar listado de playlists
```bash
node scripts/update-listas-reproduccion.js

# Forzar actualización ignorando caché
node scripts/update-listas-reproduccion.js --clear-cache
```
Genera: `datos/listas-reproduccion-playlist.json`

#### 3. Actualizar videos recientes
```bash
node scripts/update-videos-recientes.js

# Forzar actualización ignorando caché
node scripts/update-videos-recientes.js --clear-cache
```
Genera: `datos/videos-recientes.json`

**Nota:** Todos los scripts leen la configuración desde `config/cursos.json`

### ⚡ Caché y Actualización Forzada

**Comportamiento del caché:**
- Cloud Function tiene caché de 12 horas para reducir uso de YouTube API
- Si ejecutas un script normalmente, usará datos en caché si están disponibles

**Cuándo usar `--clear-cache`:**
- ✅ Acabas de modificar descripción de playlist en YouTube
- ✅ Agregaste nuevos videos a una playlist
- ✅ Necesitas datos actualizados inmediatamente
- ❌ NO usar para actualizaciones de rutina (desperdicia cuota API)

**Ejemplo de uso típico:**
```bash
# 1. Modificas descripción de playlist en YouTube
# 2. Esperas 1-2 minutos para que YouTube actualice
# 3. Ejecutas con --clear-cache
node scripts/update-course.js google-analytics --clear-cache
```

---

## 💻 Desarrollo Local

### Requisitos
- Navegador web moderno
- Servidor local (opcional, para CORS)

### Instalación

```bash
# Clonar repositorio
git clone https://github.com/angelgarciadatablog/angelgarciadatablog.github.io.git
cd angelgarciadatablog.github.io

# Abrir con Live Server (VS Code)
# O usar Python
python -m http.server 8000

# O usar Node.js
npx serve .
```

### Desarrollo

**Estructura modular:**
- Cada página importa solo los JS que necesita
- `styles.css` es global
- `script.js` contiene funcionalidad común

**Convenciones:**
- Usar camelCase para JavaScript
- Usar kebab-case para archivos
- Comentarios en español
- Commits en español (convenciones: feat, fix, docs, etc.)

---

## 📚 Documentación

### Archivos de Documentación

| Archivo | Descripción |
|---------|-------------|
| `README.md` | Documentación principal (este archivo) |
| `docs/SEGURIDAD.md` | Análisis de seguridad del proyecto |
| `docs/LLAMADAS-EXTERNAS.md` | Auditoría completa de APIs externas |
| `docs/FLUJO-CURSOS.md` | Flujo de actualización de cursos |
| `docs/cloud-function/README.md` | Documentación de Cloud Function |
| `docs/cloud-function/DEPLOYMENT-GUI.md` | Deploy por interfaz gráfica |
| `docs/cloud-function/GUIA-PASO-A-PASO.md` | Guía detallada de deployment |
| `docs/config/README.md` | Documentación de configuración de cursos |
| `docs/formulario/` | Documentación del formulario de contacto |

### Recursos Externos

- **Google Sheets (Datos):** [Ver sheet](https://docs.google.com/spreadsheets/d/1elCq8KOmeXghYSzVq9PEbIh5F_T5wxd1Gqh1vyNqg3E/edit)
  - Pestaña: `cursos-gratuitos`
  - Pestaña: `recursos-notion`
  - Pestaña: `videos-importantes`

- **Cloud Function:** `https://getyoutubevideos-35759247090.us-central1.run.app`
  - Endpoints: `getRecentVideos`, `listPlaylists`, `getPlaylistWithDetails`

- **YouTube Channel:** [@angelgarciadatablog](https://www.youtube.com/@angelgarciadatablog)

---

## 📊 Métricas y Performance

### Llamadas a APIs

**Google Sheets:**
- Sin caché: ~1,600 llamadas/día
- Con caché 60 min: **~66 llamadas/día**
- **Reducción: 95.9%**

**Cloud Function (YouTube API):**
- Producción: **0 llamadas** (usa JSON estático)
- Automatización: **1 llamada/día** (GitHub Actions)
- Admin manual: **~0.3 llamadas/día** (promedio)

**Total estimado:** ~1.3 unidades YouTube API/día (límite: 10,000)

### Performance

- **Carga inicial:** ~200ms (sin APIs bloqueantes)
- **Videos recientes:** Instantáneo (JSON local)
- **Cursos/Recursos:** Instantáneo (caché efectivo)

---

## 🔐 Seguridad

- ✅ Sin API keys expuestas en frontend
- ✅ Cloud Function con rate limiting
- ✅ CORS configurado correctamente
- ✅ GitHub Actions con permisos mínimos
- ✅ Google Sheets en modo lectura pública

---

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver archivo `LICENSE` para más detalles.

---

## 👤 Autor

**Ángel García**

- YouTube: [@angelgarciadatablog](https://www.youtube.com/@angelgarciadatablog)
- LinkedIn: [Angel García](https://www.linkedin.com/in/angelgarciachanga/)
- GitHub: [@angelgarciadatablog](https://github.com/angelgarciadatablog)
- Web: [angelgarciadatablog.github.io](https://angelgarciadatablog.github.io)

---

## 🙏 Agradecimientos

- **Claude Code** - Asistencia en desarrollo
- **GitHub Pages** - Hosting gratuito
- **Google Cloud** - Cloud Functions
- **Comunidad de YouTube** - Feedback y apoyo

---

**Última actualización:** Octubre 2025
