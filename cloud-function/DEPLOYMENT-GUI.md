# Deployment de Cloud Function - Interfaz Gráfica (Sin Terminal)

## 🖱️ Guía Completa desde Google Cloud Console

---

## Paso 1: Crear/Seleccionar Proyecto en Google Cloud

### 1.1 Ir a Google Cloud Console
👉 **https://console.cloud.google.com**

### 1.2 Crear un nuevo proyecto (o usar uno existente)

1. Clic en el selector de proyectos (arriba a la izquierda)
2. Clic en **"NEW PROJECT"**
3. Nombre del proyecto: `youtube-api-blog` (o el que prefieras)
4. Clic en **"CREATE"**
5. Espera 30 segundos a que se cree
6. Selecciona el proyecto recién creado

---

## Paso 2: Habilitar APIs Necesarias

### 2.1 Habilitar Cloud Functions API

1. En el menú lateral (☰), ve a **"APIs & Services"** → **"Library"**
2. Busca: `Cloud Functions API`
3. Clic en el resultado
4. Clic en **"ENABLE"**
5. Espera a que se habilite (~30 segundos)

### 2.2 Habilitar Cloud Build API

1. Busca: `Cloud Build API`
2. Clic en el resultado
3. Clic en **"ENABLE"**

### 2.3 Habilitar YouTube Data API v3

1. Busca: `YouTube Data API v3`
2. Clic en el resultado
3. Clic en **"ENABLE"**

---

## Paso 3: Crear Nueva API Key (y revocar la antigua)

### 3.1 Ir a Credentials

👉 **https://console.cloud.google.com/apis/credentials**

### 3.2 Revocar la API Key expuesta (IMPORTANTE)

1. En la sección **"API Keys"**, busca cualquier key existente antigua
2. Si encuentras alguna API key que ya no uses:
   - Clic en los 3 puntos (⋮) al lado derecho
   - Clic en **"Delete"**
   - Confirmar

### 3.3 Crear nueva API Key

1. Clic en **"+ CREATE CREDENTIALS"** (arriba)
2. Selecciona **"API key"**
3. Se creará una nueva key → **Copia y guárdala** en un lugar seguro (la necesitarás luego)
4. Clic en **"RESTRICT KEY"**

### 3.4 Configurar restricciones de la API Key

**En la pantalla de edición de la key:**

1. **Name:** `YouTube API Key - Blog` (o cualquier nombre descriptivo)

2. **Application restrictions:**
   - Selecciona: **"None"** (por ahora)
   - Nota: Después del deployment, puedes agregar HTTP referrers

3. **API restrictions:**
   - Selecciona: **"Restrict key"**
   - En la lista, marca SOLO: ☑️ **YouTube Data API v3**
   - Desmarca todo lo demás

4. Clic en **"SAVE"** (abajo)

✅ **Guarda tu API Key en un lugar seguro** - La necesitarás en el Paso 5

---

## Paso 4: Habilitar Facturación (Requerido pero GRATIS)

### 4.1 Ir a Billing

👉 **https://console.cloud.google.com/billing**

### 4.2 Configurar cuenta de facturación

1. Clic en **"ADD BILLING ACCOUNT"** (si no tienes una)
2. Llena los datos:
   - Nombre
   - País
   - Tarjeta de crédito (no se cobrará nada dentro del free tier)
3. Acepta términos
4. Clic en **"SUBMIT AND ENABLE BILLING"**

**No te preocupes:** Con el free tier de 2 millones de invocaciones/mes, NO pagarás nada para un blog personal.

### 4.3 Configurar Budget Alert (Opcional pero recomendado)

1. Ve a: **https://console.cloud.google.com/billing/budgets**
2. Clic en **"CREATE BUDGET"**
3. Configuración:
   - **Name:** `Monthly Budget Alert`
   - **Budget amount:** `$5.00` USD
   - **Set alerts at:** `50%`, `80%`, `100%`
4. Agrega tu email para recibir alertas
5. Clic en **"FINISH"**

---

## Paso 5: Crear la Cloud Function

### 5.1 Ir a Cloud Functions

👉 **https://console.cloud.google.com/functions**

### 5.2 Crear nueva función

1. Clic en **"CREATE FUNCTION"** (arriba)

2. **Environment:**
   - Selecciona: **"2nd gen"** ⭐ (Recomendado - más barato)

3. **Basics:**
   - **Function name:** `getYouTubeVideos`
   - **Region:** `us-central1` (o la más cercana a ti)

4. **Trigger:**
   - **Trigger type:** `HTTPS`
   - **Authentication:** Selecciona **"Allow unauthenticated invocations"** ☑️
   - (Esto permite que tu sitio web llame a la función)

5. Clic en **"SAVE"** (abajo del trigger)

6. **Runtime, build, connections and security settings** (expandir):

   **Runtime:**
   - **Memory allocated:** `256 MiB`
   - **Timeout:** `10` seconds
   - **Maximum instances:** `10`
   - **Minimum instances:** `0`

   **Runtime environment variables:**
   - Clic en **"ADD VARIABLE"**
   - **Name:** `YOUTUBE_API_KEY`
   - **Value:** `TU_API_KEY_QUE_COPIASTE_EN_PASO_3` (pega aquí tu API key)

7. Clic en **"NEXT"** (abajo)

---

## Paso 6: Agregar el Código de la Cloud Function

### 6.1 Configurar Runtime

En la pantalla de código:

1. **Runtime:** Selecciona `Node.js 20`
2. **Entry point:** `getYouTubeVideos` (debe coincidir con el nombre de la función exportada)

### 6.2 Editar package.json

1. En el panel izquierdo, clic en **`package.json`**
2. **Borra todo** el contenido actual
3. **Copia y pega** exactamente esto:

```json
{
  "name": "youtube-api-proxy",
  "version": "1.0.0",
  "description": "Cloud Function proxy seguro para YouTube API",
  "main": "index.js",
  "dependencies": {
    "@google-cloud/functions-framework": "^3.0.0",
    "node-fetch": "^2.7.0"
  },
  "engines": {
    "node": ">=18"
  }
}
```

### 6.3 Editar index.js

1. En el panel izquierdo, clic en **`index.js`**
2. **Borra todo** el contenido actual
3. **Copia y pega** el código completo del archivo [index.js](index.js) de tu proyecto local

**Para facilitar:** El código está en tu proyecto en:
```
cloud-function/index.js
```

**IMPORTANTE:** Antes de pegar, asegúrate de **editar líneas 13-16** con tu dominio real:

```javascript
allowedOrigins: [
  'https://tudominio.com',           // ⚠️ CAMBIAR por tu dominio real
  'https://www.tudominio.com',       // ⚠️ CAMBIAR por tu dominio real
  'http://localhost:3000',
  'http://localhost:5500'
]
```

Si tu sitio está en GitHub Pages, sería algo como:
```javascript
allowedOrigins: [
  'https://tuusuario.github.io',
  'http://localhost:3000',
  'http://localhost:5500'
]
```

### 6.4 Deploy

1. Verifica que:
   - ✅ `package.json` tiene el código correcto
   - ✅ `index.js` tiene el código completo
   - ✅ Entry point dice `getYouTubeVideos`
   - ✅ La variable `YOUTUBE_API_KEY` está configurada

2. Clic en **"DEPLOY"** (abajo)

3. **Espera 2-5 minutos** mientras se despliega

4. Verás un ✅ verde cuando esté listo

---

## Paso 7: Obtener la URL de tu Cloud Function

### 7.1 Ver detalles de la función

1. En la lista de Cloud Functions, clic en **`getYouTubeVideos`**
2. Ve a la pestaña **"TRIGGER"**
3. Copia la **URL del trigger** - se verá algo así:

```
https://us-central1-tu-proyecto-123456.cloudfunctions.net/getYouTubeVideos
```

✅ **Guarda esta URL** - la necesitarás para el frontend

---

## Paso 8: Probar la Cloud Function

### 8.1 Test Manual

1. Abre una nueva pestaña del navegador
2. Pega la URL de tu función
3. Deberías ver una respuesta JSON como:

```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "title": "Título del video",
      "thumbnail": "...",
      "publishedAt": "...",
      "description": "..."
    }
  ],
  "cached": false
}
```

✅ Si ves esto, **¡funciona perfectamente!**

❌ Si ves un error, revisa:
- La variable `YOUTUBE_API_KEY` está correcta
- YouTube Data API v3 está habilitada
- La API key tiene restricciones correctas

---

## Paso 9: Actualizar tu Frontend

### 9.1 Editar youtube-secure.js

En tu proyecto local, abre: `js/youtube-secure.js`

**Línea 9**, cambia:
```javascript
cloudFunctionUrl: 'https://REGION-PROJECT_ID.cloudfunctions.net/getYouTubeVideos',
```

Por la URL real que copiaste en el Paso 7:
```javascript
cloudFunctionUrl: 'https://us-central1-tu-proyecto-123456.cloudfunctions.net/getYouTubeVideos',
```

### 9.2 Actualizar index.html

Busca en tu `index.html` donde dice:
```html
<script src="js/youtube.js"></script>
```

Cámbialo por:
```html
<script src="js/youtube-secure.js"></script>
```

### 9.3 Subir cambios

1. Guarda los archivos
2. Sube a tu hosting (GitHub Pages, Netlify, etc.)
3. Prueba tu sitio web

---

## Paso 10: Configurar Restricciones Finales (Opcional pero recomendado)

### 10.1 Restringir API Key por Referrer

Ahora que tienes tu sitio funcionando, puedes agregar restricciones adicionales:

1. Ve a: **https://console.cloud.google.com/apis/credentials**
2. Clic en tu API key
3. En **Application restrictions:**
   - Cambia de "None" a **"HTTP referrers (web sites)"**
   - Clic en **"ADD AN ITEM"**
   - Agrega: `https://tudominio.com/*`
   - Agrega: `https://www.tudominio.com/*`
4. Clic en **"SAVE"**

**Nota:** Esto hace que la API key SOLO funcione cuando se llama desde tu Cloud Function.

---

## 📊 Monitoreo (Opcional)

### Ver logs de la función

1. Ve a Cloud Functions
2. Clic en `getYouTubeVideos`
3. Pestaña **"LOGS"**
4. Aquí verás todas las invocaciones, errores, etc.

### Ver métricas de uso

1. Pestaña **"METRICS"**
2. Verás gráficas de:
   - Invocations (llamadas)
   - Execution time (tiempo de ejecución)
   - Memory usage (uso de memoria)
   - Error rate (tasa de errores)

---

## ✅ Checklist Final

- [ ] Proyecto creado en Google Cloud
- [ ] APIs habilitadas (Cloud Functions, Cloud Build, YouTube)
- [ ] API key antigua revocada
- [ ] Nueva API key creada con restricciones
- [ ] Facturación habilitada (con budget alert)
- [ ] Cloud Function creada y deployada
- [ ] URL de la función copiada
- [ ] Frontend actualizado con la URL correcta
- [ ] Sitio web actualizado y funcionando
- [ ] Restricciones de CORS configuradas con tu dominio

---

## 🎉 ¡Listo!

Tu API key ahora está **100% segura** con:
- ✅ Rate limiting (10 requests/min por IP)
- ✅ Caché de 5 minutos (reduce costos 95%)
- ✅ Validación de origen (CORS)
- ✅ Límites de recursos (10 instancias máx)
- ✅ Budget alerts (alertas si gastas más de $5)
- ✅ API key protegida en variables de entorno

**Costo estimado:** $0.00/mes (dentro del free tier)

---

## 🚨 Troubleshooting

### Error: "API key not valid"
- Espera 5 minutos después de crear la key
- Verifica que YouTube Data API v3 esté habilitada
- Verifica que la key tenga las restricciones correctas

### Error: "Permission denied"
- Verifica que marcaste "Allow unauthenticated invocations"
- Re-deploy la función

### Error CORS en el navegador
- Agrega tu dominio a `allowedOrigins` en `index.js`
- Re-deploy la función (clic en "EDIT" → "DEPLOY")

### Los videos no cargan
- Abre DevTools (F12) → Console
- Revisa errores
- Verifica que la URL en `youtube-secure.js` sea correcta
- Prueba la URL directamente en el navegador

---

## 📞 ¿Necesitas ayuda?

Si algo no funciona:
1. Revisa los **LOGS** en Cloud Functions
2. Verifica las **METRICS** para ver si hay errores
3. Prueba la URL directamente en el navegador
4. Revisa la consola del navegador (F12)
