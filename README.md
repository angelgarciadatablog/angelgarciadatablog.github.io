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

### 📚 Cursos Gratuitos
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
│   ├── index.js
│   ├── README.md
│   ├── DEPLOYMENT-GUI.md
│   └── GUIA-PASO-A-PASO.md
├── config/
│   └── cursos.json                    # Configuración de cursos
├── cursos/                            # Páginas de cursos individuales
│   ├── sql-bigquery/
│   ├── power-bi/
│   └── google-analytics/
├── datos/                             # Archivos JSON estáticos
│   ├── videos-recientes.json          # 3 videos más recientes (auto)
│   ├── tutoriales-playlists.json      # Todas las playlists
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
├── admin.html                         # Panel de administración
├── index.html                         # Página principal
├── styles.css                         # Estilos globales
├── script.js                          # JavaScript global
├── LLAMADAS-EXTERNAS.md              # Auditoría de APIs
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

## 🎛️ Panel de Administración

**URL:** `/admin.html`

### Funcionalidades:

#### 1. Limpiar Caché de Google Sheets
- Limpia caché de 60 minutos manualmente
- Útil después de actualizar Google Sheets

#### 2. Actualizar Videos Recientes
- Obtiene 3 videos más recientes
- Copia JSON al portapapeles
- Pegar en `datos/videos-recientes.json`

#### 3. Actualizar Playlists
- Obtiene todas las playlists del canal
- Descarga `tutoriales-playlists.json`
- Mover a `datos/`

#### 4. Actualizar Cursos
- SQL BigQuery (8 módulos)
- Power BI (5 módulos)
- Google Analytics 4 (3 módulos)
- Descarga JSON individual por curso

**Ventajas:**
- ✅ Sin Node.js requerido
- ✅ Interfaz visual con logs
- ✅ Funciona desde cualquier navegador

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
| `LLAMADAS-EXTERNAS.md` | Auditoría completa de APIs externas |
| `cloud-function/README.md` | Documentación de Cloud Function |
| `cloud-function/DEPLOYMENT-GUI.md` | Deploy por interfaz gráfica |
| `cloud-function/GUIA-PASO-A-PASO.md` | Guía detallada de deployment |

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
