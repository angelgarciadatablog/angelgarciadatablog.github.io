# Flujo Completo del Sistema de Cursos

Este documento explica cómo funciona el sistema de cursos del sitio web, desde la configuración hasta la visualización.

---

## Vista General del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                    SISTEMA DE CURSOS                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. CONFIGURACIÓN (config/)                                      │
│     └─ cursos.json ────► Define qué cursos y playlists existen  │
│                                                                  │
│  2. OBTENCIÓN DE DATOS (scripts/ + Cloud Function)              │
│     └─ Scripts Node.js ──► Llaman a Cloud Function              │
│                          ──► Generan JSONs en datos/            │
│                                                                  │
│  3. ALMACENAMIENTO (datos/)                                      │
│     └─ JSONs generados ──► Datos listos para usar               │
│                                                                  │
│  4. PÁGINAS WEB (cursos/)                                        │
│     └─ HTMLs estáticos ──► Muestran los cursos                  │
│                                                                  │
│  5. SCRIPTS FRONTEND (js/)                                       │
│     └─ JavaScript ────► Cargan y renderizan datos               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1. CONFIGURACIÓN

### 📁 config/cursos.json
**Propósito**: Archivo maestro de configuración
**Tipo**: CONFIGURACIÓN ESTÁTICA (se edita manualmente)

```json
{
  "cloudFunctionUrl": "https://...",
  "cursos": [
    {
      "id": "sql-bigquery",
      "titulo": "Curso de SQL en BigQuery",
      "outputFile": "datos/sql-bigquery-playlist.json",
      "modulos": [...]
    }
  ]
}
```

**¿Cuándo se modifica?**
- Cuando agregas un curso nuevo
- Cuando agregas un módulo a un curso existente
- Cuando cambias la URL de la Cloud Function

---

## 2. OBTENCIÓN DE DATOS (Scripts de Node.js)

### 📁 scripts/

#### A) update-course.js (UNIVERSAL)
**Propósito**: Actualizar CUALQUIER curso definido en config/cursos.json
**Ejecuta**: Manualmente

**Flujo**:
```
1. Recibe cursoId como parámetro
2. Lee config/cursos.json
3. Busca el curso por id
4. Para cada módulo:
   ├─ Extrae playlistId
   ├─ Llama a Cloud Function con ese playlistId
   └─ Recibe datos de YouTube
5. Genera archivo JSON en la ruta de outputFile
```

**Comandos**:
```bash
node scripts/update-course.js sql-bigquery
node scripts/update-course.js power-bi
node scripts/update-course.js google-analytics
node scripts/update-course.js <cualquier-curso-nuevo>
```

**Ventajas**:
- ✅ Un solo script para todos los cursos
- ✅ No necesitas crear script nuevo al agregar curso
- ✅ Detecta automáticamente nuevos módulos

---

#### B) update-videos-recientes.js
**Propósito**: Actualizar los últimos 3 videos del canal
**Ejecuta**: Automáticamente vía GitHub Actions (cada X tiempo)

**Flujo**:
```
1. Llama a Cloud Function con action=getRecentVideos
2. Recibe los últimos 3 videos
3. Genera: datos/videos-recientes.json
```

**Comando**:
```bash
node scripts/update-videos-recientes.js
```

---

### ☁️ Cloud Function (Google Cloud)
**Ubicación**: cloud-function/
**URL**: https://getyoutubevideos-35759247090.us-central1.run.app

**Qué hace**:
- Recibe peticiones con `playlistId` o `action=getRecentVideos`
- Llama a YouTube Data API v3 (con API key protegida)
- Devuelve datos en formato JSON
- Aplica rate limiting, caché, CORS

**Por qué existe**: Para mantener la API key de YouTube segura (no exponerla en el frontend)

---

## 3. ALMACENAMIENTO

### 📁 datos/
**Propósito**: Guardar los JSONs generados por los scripts
**Tipo**: DATOS DINÁMICOS (se actualizan automáticamente)

```
datos/
├── sql-bigquery-playlist.json       ← Generado por update-sql-course.js
├── power-bi-playlist.json           ← Generado por script similar (futuro)
├── google-analytics-playlist.json   ← Generado por script similar (futuro)
├── listas-reproduccion-playlist.json ← Datos de listas de reproducción
└── videos-recientes.json            ← Generado por update-videos-recientes.js
```

**Ejemplo de estructura (sql-bigquery-playlist.json)**:
```json
{
  "curso": "sql-bigquery",
  "titulo": "Curso de SQL en BigQuery",
  "fechaActualizacion": "2025-10-23T...",
  "modulos": [
    {
      "moduloId": 1,
      "titulo": "Cláusulas Principales de SQL",
      "playlistId": "PLV4oS06_KpqbnahoXdN-A8Ql9zVblYUJl",
      "totalVideos": 20,
      "videos": [
        {
          "id": "abc123",
          "titulo": "SELECT básico",
          "url": "https://youtube.com/watch?v=abc123",
          "thumbnail": "https://...",
          "duracion": "PT10M30S",
          "vistas": 1000
        }
      ]
    }
  ]
}
```

---

## 4. PÁGINAS WEB (Frontend)

### 📁 cursos/
**Propósito**: Páginas HTML de cada curso
**Tipo**: PÁGINAS ESTÁTICAS (HTML + CSS + JS)

```
cursos/
├── sql-bigquery/
│   └── index.html          ← Página del curso SQL
├── power-bi/
│   └── index.html          ← Página del curso Power BI
└── google-analytics/
    └── index.html          ← Página del curso Google Analytics
```

**Qué hacen estas páginas**:
1. Muestran información del curso
2. Cargan el JSON correspondiente desde `datos/`
3. Renderizan los módulos y videos dinámicamente
4. Permiten navegación entre módulos

**Ejemplo**: [cursos/sql-bigquery/index.html](cursos/sql-bigquery/index.html)
- Carga: `../../datos/sql-bigquery-playlist.json`
- Renderiza: Módulos, videos, estadísticas

---

## 5. SCRIPTS FRONTEND (JavaScript)

### 📁 js/

#### A) cursos.js
**Propósito**: Renderizar tarjetas de cursos en la página principal
**Dónde se usa**: [index.html](index.html)

**Flujo**:
```
1. Llama a GoogleSheets.getCursosGratuitos()
2. Obtiene lista de cursos desde Google Sheets
3. Para cada curso, genera una tarjeta HTML
4. Detecta el tipo de curso (SQL, Power BI, etc.)
5. Asigna la URL correcta (cursos/sql-bigquery, etc.)
6. Renderiza en #cursos-grid
```

**Relación con carpeta cursos/**:
```javascript
// En cursos.js (líneas 45-53)
function getCursoUrl(nombreCurso) {
  if (nombreCurso.includes('sql')) return 'cursos/sql-bigquery';
  if (nombreCurso.includes('power bi')) return 'cursos/power-bi';
  if (nombreCurso.includes('analytics')) return 'cursos/google-analytics';
}
```

---

#### B) youtube-secure.js
**Propósito**: Conectar con Cloud Function para obtener datos
**Dónde se usa**: En páginas de cursos (cursos/*/index.html)

**Funciones**:
- `fetchPlaylistVideos(playlistId)` - Obtiene videos de una playlist
- `fetchRecentVideos(maxResults)` - Obtiene videos recientes

---

#### C) googleSheets.js
**Propósito**: Obtener datos desde Google Sheets
**Dónde se usa**: [index.html](index.html) (para tarjetas de cursos)

**Funciones**:
- `getCursosGratuitos()` - Lista de cursos gratuitos
- `getRecursos()` - Recursos adicionales

---

#### D) recursos.js
**Propósito**: Renderizar recursos (no relacionado con cursos)

---

#### E) contact-form.js
**Propósito**: Manejar formulario de contacto (no relacionado con cursos)

---

## Flujo Completo: De Configuración a Visualización

### ESCENARIO 1: Agregar un nuevo módulo al curso SQL

```
1. EDITAS: config/cursos.json
   └─ Agregas nuevo módulo con playlistId

2. EJECUTAS: node scripts/update-sql-course.js
   └─ Script lee config/cursos.json
   └─ Llama a Cloud Function con nuevo playlistId
   └─ Cloud Function obtiene datos de YouTube API
   └─ Script genera: datos/sql-bigquery-playlist.json (actualizado)

3. PUBLICAS: Commit y push a GitHub
   └─ Los archivos se despliegan

4. USUARIO VISITA: cursos/sql-bigquery/index.html
   └─ Página carga: datos/sql-bigquery-playlist.json
   └─ JavaScript renderiza el nuevo módulo
   └─ Usuario ve el contenido actualizado
```

---

### ESCENARIO 2: Actualización automática de videos recientes

```
1. GITHUB ACTIONS: Se ejecuta automáticamente (cron)
   └─ Ejecuta: scripts/update-videos-recientes.js

2. SCRIPT:
   └─ Llama a Cloud Function con action=getRecentVideos
   └─ Genera: datos/videos-recientes.json
   └─ Commit automático

3. USUARIO VISITA: index.html
   └─ Página carga: datos/videos-recientes.json
   └─ Muestra los últimos 3 videos
```

---

### ESCENARIO 3: Usuario visita la página principal

```
1. USUARIO ABRE: index.html

2. SE CARGAN:
   ├─ js/googleSheets.js
   └─ js/cursos.js

3. CURSOS.JS:
   └─ Llama: GoogleSheets.getCursosGratuitos()
   └─ Obtiene lista de cursos desde Google Sheets
   └─ Para cada curso, detecta tipo (SQL, Power BI, etc.)
   └─ Genera URL: cursos/sql-bigquery, cursos/power-bi
   └─ Renderiza tarjetas en #cursos-grid

4. USUARIO HACE CLIC:
   └─ Navega a: cursos/sql-bigquery/index.html
   └─ Esa página carga: datos/sql-bigquery-playlist.json
   └─ Muestra módulos y videos
```

---

## Diferencias clave

### config/ vs cursos/ vs datos/

| Carpeta | Tipo | ¿Se edita? | ¿Qué contiene? |
|---------|------|------------|----------------|
| **config/** | Configuración | Sí, manualmente | Definición de cursos y playlists |
| **datos/** | Datos | No, auto-generado | JSONs con datos de YouTube |
| **cursos/** | Páginas | Sí, manualmente | HTMLs que muestran los cursos |
| **scripts/** | Scripts | Sí, manualmente | Scripts que generan datos/ |
| **js/** | Frontend | Sí, manualmente | Scripts que corren en el navegador |

---

### scripts/ vs js/

| Carpeta | Entorno | Lenguaje | Propósito |
|---------|---------|----------|-----------|
| **scripts/** | Node.js (servidor) | JavaScript (Node) | Generar datos/ desde Cloud Function |
| **js/** | Navegador (frontend) | JavaScript (Browser) | Renderizar datos en páginas web |

---

## ¿Qué es fijo y qué es dinámico?

### FIJO (se crea/edita manualmente):
- ✅ config/cursos.json
- ✅ cursos/sql-bigquery/index.html
- ✅ cursos/power-bi/index.html
- ✅ js/cursos.js
- ✅ scripts/update-sql-course.js

### DINÁMICO (se genera automáticamente):
- 🤖 datos/sql-bigquery-playlist.json
- 🤖 datos/power-bi-playlist.json
- 🤖 datos/videos-recientes.json

---

## Resumen en 3 Pasos

```
┌──────────────────┐
│ 1. CONFIGURACIÓN │
│   config/        │  ← TÚ EDITAS AQUÍ
│   cursos.json    │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 2. SCRIPTS       │
│   scripts/       │  ← EJECUTAS ESTO (manual o automático)
│   *.js           │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 3. DATOS         │
│   datos/         │  ← SE GENERAN AUTOMÁTICAMENTE
│   *.json         │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 4. VISUALIZACIÓN │
│   cursos/        │  ← USUARIO LOS VE AQUÍ
│   */index.html   │
└──────────────────┘
```

---

## Comandos Útiles

### Actualizar curso SQL manualmente:
```bash
node scripts/update-sql-course.js
```

### Actualizar videos recientes manualmente:
```bash
node scripts/update-videos-recientes.js
```

### Ver logs de GitHub Actions:
```
GitHub > Actions > Update Videos
```

---

## Preguntas Frecuentes

### ¿Por qué hay carpeta cursos/ si los datos vienen de datos/?
- **cursos/** = Páginas web (HTML) que muestran los cursos
- **datos/** = Información de los cursos (JSON) que se carga dinámicamente

### ¿Por qué hay scripts/ y js/?
- **scripts/** = Se ejecutan en Node.js (servidor) para generar datos
- **js/** = Se ejecutan en el navegador (frontend) para mostrar datos

### ¿Cómo se actualiza un curso?
1. Editas [config/cursos.json](config/cursos.json)
2. Ejecutas `node scripts/update-sql-course.js`
3. Se actualiza `datos/sql-bigquery-playlist.json`
4. La página `cursos/sql-bigquery/index.html` muestra los cambios

### ¿Qué pasa si borro datos/?
- Puedes regenerarla ejecutando los scripts
- Los scripts vuelven a llamar a la Cloud Function
- Se recrean los JSONs

### ¿Puedo agregar un curso nuevo?
Sí, debes:
1. Agregar configuración en [config/cursos.json](config/cursos.json)
2. Crear script nuevo (ej: `scripts/update-powerbi-course.js`)
3. Crear carpeta y HTML (ej: `cursos/power-bi/index.html`)
4. Actualizar [js/cursos.js](js/cursos.js) para detectar el nuevo curso

---

## Documentación relacionada

- [README.md](../README.md) - Documentación general del proyecto
- [SEGURIDAD.md](SEGURIDAD.md) - Seguridad de Cloud Function y API keys
- [config/README.md](config/README.md) - Documentación de configuración
- [cloud-function/README.md](cloud-function/README.md) - Cloud Function
