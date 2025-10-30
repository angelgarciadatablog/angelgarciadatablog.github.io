# Cloud Function: getYouTubeVideos

Cloud Function segura para obtener datos de YouTube con caché, rate limiting y múltiples modos de operación.

## 🎯 Endpoints disponibles

### 1️⃣ Videos recientes del canal
```
GET ?
```
**Costo**: 1 unidad | **Caché**: 12h

### 2️⃣ Videos de playlist específica  
```
GET ?playlistId=PLxxxxxx&maxResults=50
```
**Costo**: ~3 unidades | **Caché**: 12h

### 3️⃣ **NUEVO**: Listar TODAS las playlists
```
GET ?action=listPlaylists&maxResults=50
```
**Costo**: **1 unidad** (solo metadata) | **Caché**: 12h

## 📊 Uso de cuota diaria: < 1%
