# 📊 Auditoría de Llamadas Externas

Resumen completo de todas las llamadas a APIs externas en el sitio web.

---

## 🎯 Resumen Ejecutivo

| Servicio | Llamadas en Producción | Llamadas en Admin | Frecuencia | Caché |
|----------|------------------------|-------------------|------------|-------|
| **Google Sheets** | ✅ 3 llamadas | ❌ 0 | Por cada visita* | 60 min |
| **Cloud Function (YouTube)** | ❌ 0 | ✅ 4 llamadas | Manual/Diaria | N/A |

**\*Con caché de 60 minutos, reduce llamadas significativamente**

---

## 📱 Google Sheets - Llamadas en PRODUCCIÓN

### Ubicación: Google Sheets API (CSV público)
**URL Base:** `https://docs.google.com/spreadsheets/d/1elCq8KOmeXghYSzVq9PEbIh5F_T5wxd1Gqh1vyNqg3E/gviz/tq?tqx=out:csv&sheet=`

### 1. Página Principal (index.html)

#### Llamada 1: Cursos Gratuitos
- **Archivo:** `js/cursos.js` línea 107
- **Función:** `GoogleSheets.getCursosGratuitos()`
- **Pestaña:** `cursos-gratuitos`
- **Frecuencia:** Cada visita a index.html (con caché 60 min)
- **Usuarios afectados:** Todos los visitantes
- **Datos:** nombre-curso, descripcion-corta, nivel, horas, capitulos

```javascript
// js/cursos.js:107
const cursos = await GoogleSheets.getCursosGratuitos();
```

#### Llamada 2: Recursos de Notion
- **Archivo:** `js/recursos.js` línea 14
- **Función:** `GoogleSheets.getRecursosNotion()`
- **Pestaña:** `recursos-notion`
- **Frecuencia:** Cada visita a index.html (con caché 60 min)
- **Usuarios afectados:** Todos los visitantes
- **Datos:** nombre-recurso, link

```javascript
// js/recursos.js:14
const recursos = await GoogleSheets.getRecursosNotion();
```

### 2. Tutoriales - Temas Importantes

#### Llamada 3: Videos Importantes
- **Archivo:** `tutoriales/temas-importantes/index.html` línea 248
- **Función:** `GoogleSheets.getVideosImportantes()`
- **Pestaña:** `videos-importantes`
- **Frecuencia:** Cada visita a temas-importantes (con caché 60 min)
- **Usuarios afectados:** Visitantes de /tutoriales/temas-importantes
- **Datos:** nombre-video, link

```javascript
// tutoriales/temas-importantes/index.html:248
const videos = await GoogleSheets.getVideosImportantes();
```

### Configuración de Caché
**Archivo:** `js/googleSheets.js` línea 17
```javascript
cacheDuration: 60 * 60 * 1000 // 60 minutos
```

**Implementación:**
- Caché en memoria (session storage)
- Caché en localStorage (persistente)
- Doble capa para máximo rendimiento

### Impacto Real con Caché

**Escenario: 1000 visitantes/día**

Sin caché:
- 1000 visitantes × 3 llamadas = **3000 llamadas/día**

Con caché de 60 minutos (promedio 60 visitantes/hora):
- 24 horas × 3 llamadas = **72 llamadas/día**
- **Reducción: 97.6%** 🎉

---

## ☁️ Cloud Function (YouTube API) - Llamadas MANUALES

### Ubicación: Cloud Function
**URL:** `https://getyoutubevideos-35759247090.us-central1.run.app`

### ❌ NO hay llamadas en producción

**Antes:** index.html llamaba a Cloud Function en cada visita
**Ahora:** Lee desde JSON estático (`datos/videos-recientes.json`)

### Llamadas en Admin Panel (admin.html)

#### Llamada 1: Videos Recientes (Manual)
- **Archivo:** `admin.html` línea 487
- **Función:** `updateRecentVideosLocal()`
- **Endpoint:** `?action=getRecentVideos&maxResults=3`
- **Frecuencia:** Manual desde admin.html
- **Costo API:** ~1 unidad de YouTube API
- **Resultado:** Copia JSON al portapapeles

```javascript
// admin.html:487
const url = `${CLOUD_FUNCTION_URL}?action=getRecentVideos&maxResults=3`;
```

#### Llamada 2: Todas las Playlists (Manual)
- **Archivo:** `admin.html` línea 563
- **Función:** `fetchAllPlaylists()`
- **Endpoint:** `?action=listPlaylists&maxResults=50`
- **Frecuencia:** Manual desde admin.html
- **Costo API:** ~1 unidad de YouTube API
- **Resultado:** Descarga `tutoriales-playlists.json`

```javascript
// admin.html:563
const url = `${CLOUD_FUNCTION_URL}?action=listPlaylists&maxResults=50`;
```

#### Llamada 3-5: Actualizar Cursos (Manual)
- **Archivo:** `admin.html` líneas 620, 685
- **Función:** `updateCourse('sql-bigquery' | 'power-bi' | 'google-analytics')`
- **Endpoint:** `?action=getPlaylistWithDetails&playlistId=XXX`
- **Frecuencia:** Manual desde admin.html
- **Costo API:** ~3-8 unidades por curso (según número de módulos)
- **Resultado:** Descarga JSON del curso

```javascript
// admin.html:620
const url = `${CLOUD_FUNCTION_URL}?action=getPlaylistWithDetails&playlistId=${modulo.playlistId}`;
```

### Automatización GitHub Actions

**Archivo:** `.github/workflows/update-videos.yml`
- **Frecuencia:** Diaria a las 9:00 AM (hora Perú)
- **Script:** `scripts/update-videos-recientes.js`
- **Llamada:** 1 × `getRecentVideos` = ~1 unidad API/día
- **Resultado:** Commit automático de `datos/videos-recientes.json`

---

## 📊 Análisis de Impacto

### Tráfico Estimado Diario

**Suposiciones:**
- 1000 visitantes/día
- 70% ven index.html
- 20% ven temas-importantes
- Caché efectivo de 60 minutos

### Google Sheets (Producción)

| Página | Llamadas sin caché | Llamadas con caché | Reducción |
|--------|-------------------|-------------------|-----------|
| index.html (cursos) | 700 | 29 | 95.9% |
| index.html (recursos) | 700 | 29 | 95.9% |
| temas-importantes | 200 | 8 | 96% |
| **TOTAL** | **1600** | **66** | **95.9%** |

### Cloud Function (Admin + GitHub Actions)

| Operación | Frecuencia | Llamadas/día | Costo API |
|-----------|-----------|--------------|-----------|
| Videos recientes (auto) | 1×/día | 1 | 1 unidad |
| Videos recientes (manual) | ~0.5×/semana | 0.07 | 1 unidad |
| Playlists (manual) | ~1×/semana | 0.14 | 1 unidad |
| Curso SQL (manual) | ~1×/mes | 0.03 | 8 unidades |
| Curso Power BI (manual) | ~1×/mes | 0.03 | 5 unidades |
| Curso GA (manual) | ~1×/mes | 0.03 | 3 unidades |
| **TOTAL** | - | **~1.3** | **~1.3 unidades** |

---

## 🎯 Recomendaciones

### ✅ Implementadas

1. **Caché de Google Sheets (60 min)** ✅
   - Reduce 95.9% de llamadas
   - Memoria + localStorage
   - Sin impacto UX

2. **Videos desde JSON estático** ✅
   - Elimina 100% de llamadas en producción
   - GitHub Actions automático
   - Carga instantánea

3. **Admin panel para operaciones manuales** ✅
   - Todas las llamadas a Cloud Function son manuales
   - Control total sobre cuota de API

### 💡 Optimizaciones Futuras (Opcionales)

1. **Google Sheets → JSON estático**
   - Si el tráfico crece mucho, considera servir cursos/recursos desde JSON
   - Similar al flujo de videos
   - Eliminaría las 66 llamadas/día restantes

2. **CDN para JSONs estáticos**
   - GitHub Pages ya sirve archivos estáticos eficientemente
   - No hay acción necesaria por ahora

3. **Monitoreo de cuota**
   - Google Sheets: Sin límite (CSV público)
   - YouTube API: 10,000 unidades/día (usando ~1.3)
   - Margen: 99.98% disponible 🎉

---

## 🔍 Cómo Verificar

### 1. Ver llamadas en producción (Chrome DevTools)

```bash
# Abrir index.html
1. F12 → Network tab
2. Filtrar: "docs.google.com"
3. Recargar página
4. Verás 2 llamadas (cursos + recursos)
5. Recargar de nuevo → 0 llamadas (caché)
```

### 2. Ver logs de Google Sheets

```javascript
// En consola del navegador
console.log(GoogleSheets.getCacheStats())
```

### 3. Ver GitHub Actions

```
GitHub → Actions → "Actualizar Videos Recientes"
Ver historial de ejecuciones diarias
```

---

## 📝 Notas Técnicas

### Google Sheets API
- **Tipo:** CSV público (no autenticado)
- **Límites:** Ninguno conocido para CSV público
- **Costo:** Gratis
- **Confiabilidad:** 99.9%

### Cloud Function
- **Tipo:** HTTP endpoint público
- **Límites:** YouTube API 10,000 unidades/día
- **Costo:** Gratis (tier gratuito)
- **Uso actual:** ~1.3 unidades/día (0.013% del límite)

### Archivos JSON Estáticos
- **videos-recientes.json:** 3 videos más recientes
- **tutoriales-playlists.json:** Todas las playlists del canal
- **sql-bigquery-playlist.json:** Curso SQL completo
- **power-bi-playlist.json:** Curso Power BI completo
- **google-analytics-playlist.json:** Curso GA4 completo

---

**Última actualización:** 2025-10-22
**Próxima revisión:** Cuando el tráfico supere 10,000 visitantes/día
