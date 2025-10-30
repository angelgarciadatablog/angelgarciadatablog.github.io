# 🚀 Guía Paso a Paso: Desplegar Cloud Function para YouTube

Esta guía te llevará desde cero hasta tener tu Cloud Function funcionando en Google Cloud.

---

## 📋 Tabla de Contenido

1. [Instalar Google Cloud CLI](#paso-1-instalar-google-cloud-cli)
2. [Crear Proyecto en Google Cloud](#paso-2-crear-proyecto-en-google-cloud)
3. [Configurar Facturación](#paso-3-configurar-facturación)
4. [Habilitar APIs](#paso-4-habilitar-apis-necesarias)
5. [Crear API Key de YouTube](#paso-5-crear-api-key-de-youtube)
6. [Desplegar la Cloud Function](#paso-6-desplegar-la-cloud-function)
7. [Obtener la URL](#paso-7-obtener-la-url)
8. [Actualizar el Frontend](#paso-8-actualizar-el-frontend)

---

## Paso 1: Instalar Google Cloud CLI

### Para macOS:

```bash
# Opción A: Con Homebrew (recomendado)
brew install --cask google-cloud-sdk

# Opción B: Script de instalación
curl https://sdk.cloud.google.com | bash
exec -l $SHELL  # Reiniciar shell
```

### Para Windows:

1. Descarga el instalador desde:
   https://cloud.google.com/sdk/docs/install#windows

2. Ejecuta el instalador GoogleCloudSDKInstaller.exe

3. Sigue el asistente de instalación

### Verificar instalación:

```bash
gcloud --version
```

Deberías ver algo como:
```
Google Cloud SDK 460.0.0
```

---

## Paso 2: Crear Proyecto en Google Cloud

### Opción A: Por línea de comandos (rápido)

```bash
# 1. Autenticarse
gcloud auth login

# 2. Crear proyecto (reemplaza 'mi-proyecto-youtube' con tu nombre)
gcloud projects create mi-proyecto-youtube --name="YouTube Videos API"

# 3. Configurar como proyecto activo
gcloud config set project mi-proyecto-youtube
```

### Opción B: Por Google Cloud Console (visual)

1. Ve a: https://console.cloud.google.com/

2. Clic en el selector de proyectos (arriba a la izquierda)

3. Clic en "**NEW PROJECT**"

4. Rellena:
   - **Project name**: `angelgarciadatablog-youtube` (o el que prefieras)
   - **Project ID**: Se genera automáticamente (guárdalo, lo necesitarás)

5. Clic en "**CREATE**"

6. Espera 10-30 segundos

7. Selecciona tu proyecto recién creado

📝 **ANOTA TU PROJECT ID** - Lo necesitarás después

---

## Paso 3: Configurar Facturación

⚠️ **IMPORTANTE**: Necesitas una cuenta de facturación, PERO todo estará dentro del FREE TIER (gratis).

### Por Google Cloud Console:

1. Ve a: https://console.cloud.google.com/billing

2. Si no tienes cuenta de facturación:
   - Clic en "**Add billing account**"
   - Sigue el proceso (te pedirá tarjeta de crédito pero NO te cobrará)
   - Google da $300 de crédito gratis por 90 días

3. Vincula tu proyecto:
   - Selecciona tu proyecto
   - Clic en "**Link billing account**"

💰 **Tranquilo**: Con el FREE TIER y los límites que configuramos, NO pagarás nada.

---

## Paso 4: Habilitar APIs Necesarias

### Por línea de comandos (más rápido):

```bash
# Habilitar Cloud Functions API
gcloud services enable cloudfunctions.googleapis.com

# Habilitar Cloud Build API
gcloud services enable cloudbuild.googleapis.com

# Habilitar YouTube Data API v3
gcloud services enable youtube.googleapis.com

# Habilitar Cloud Run (para Gen2 functions)
gcloud services enable run.googleapis.com
```

Cada comando toma 10-30 segundos. Verás mensajes como:
```
Operation "operations/..." finished successfully.
```

### Por Google Cloud Console:

1. Ve a: https://console.cloud.google.com/apis/library

2. Busca y habilita una por una:
   - **Cloud Functions API**
   - **Cloud Build API**
   - **YouTube Data API v3**
   - **Cloud Run API**

---

## Paso 5: Crear API Key de YouTube

### 🔑 Crear nueva API Key (SEGURA)

1. Ve a: https://console.cloud.google.com/apis/credentials

2. Clic en "**+ CREATE CREDENTIALS**" → "**API key**"

3. Se crea una API key. **CÓPIALA** inmediatamente.

4. Clic en "**RESTRICT KEY**" (muy importante para seguridad)

5. Configura restricciones:

   **Application restrictions:**
   - Selecciona: "**None**"
     (Las Cloud Functions usan IPs dinámicas, no podemos restringir por IP)

   **API restrictions:**
   - Selecciona: "**Restrict key**"
   - Busca y marca SOLO: ☑️ **YouTube Data API v3**

6. Clic en "**SAVE**"

7. Espera 1-2 minutos para que se propaguen los cambios

📝 **GUARDA TU API KEY EN UN LUGAR SEGURO** - La necesitarás en el siguiente paso

Ejemplo de API key:
```
AIzaSyBk7J8xXxXxXxXxXxXxXxXxXxXxXxX
```

### 🗑️ Revocar API Key antigua (si existe)

Si tenías una API key expuesta antes:

1. En la misma página de Credentials
2. Busca la API key antigua
3. Clic en los tres puntos (⋮) → "**Delete**"

---

## Paso 6: Desplegar la Cloud Function

### 📦 Preparar el código

```bash
# 1. Ir a la carpeta de la Cloud Function
cd cloud-function

# 2. Instalar dependencias
npm install
```

Deberías ver:
```
added 50 packages in 3s
```

### 🚀 Hacer el deployment

Copia este comando y **REEMPLAZA** `TU_API_KEY` con tu API key real:

```bash
gcloud functions deploy getYouTubeVideos \
  --gen2 \
  --runtime=nodejs20 \
  --region=us-central1 \
  --source=. \
  --entry-point=getYouTubeVideos \
  --trigger-http \
  --allow-unauthenticated \
  --max-instances=10 \
  --min-instances=0 \
  --memory=256MB \
  --timeout=10s \
  --set-env-vars YOUTUBE_API_KEY="TU_API_KEY"
```

**Ejemplo completo:**
```bash
gcloud functions deploy getYouTubeVideos \
  --gen2 \
  --runtime=nodejs20 \
  --region=us-central1 \
  --source=. \
  --entry-point=getYouTubeVideos \
  --trigger-http \
  --allow-unauthenticated \
  --max-instances=10 \
  --min-instances=0 \
  --memory=256MB \
  --timeout=10s \
  --set-env-vars YOUTUBE_API_KEY="AIzaSyBk7J8xXxXxXxXxXxXxXxXxXxXxXxX"
```

### ⏱️ Proceso de deployment

El deployment toma **2-5 minutos**. Verás algo como:

```
Preparing function...done.
✓ Deploying function...
  ✓ [Build] Logs are available at [...]
  ✓ [Service] Deploying new service...
  ✓ [Service] Routing traffic...
Done.
```

### ❓ Si aparecen preguntas

- **"Allow unauthenticated invocations?"** → Responde: `Y` (yes)
- **"Enable required APIs?"** → Responde: `Y` (yes)

---

## Paso 7: Obtener la URL

### La URL aparecerá al final del deployment:

```
url: https://us-central1-tu-proyecto.cloudfunctions.net/getYouTubeVideos
```

### Si no la copiaste, obtenerla nuevamente:

```bash
gcloud functions describe getYouTubeVideos \
  --gen2 \
  --region=us-central1 \
  --format="value(serviceConfig.uri)"
```

### 🧪 Probar que funciona:

```bash
# Reemplaza con tu URL
curl "https://us-central1-tu-proyecto.cloudfunctions.net/getYouTubeVideos"
```

Deberías ver JSON con videos:
```json
{
  "success": true,
  "data": [
    {
      "id": "dQw4w9WgXcQ",
      "title": "Video Title",
      "thumbnail": "https://...",
      ...
    }
  ],
  "cached": false
}
```

📝 **COPIA Y GUARDA ESTA URL** - La necesitas para el frontend

---

## Paso 8: Actualizar el Frontend

### 1. Editar el archivo de configuración

Abre el archivo: `js/youtube-secure.js`

Busca la línea 8:
```javascript
cloudFunctionUrl: 'https://REGION-PROJECT_ID.cloudfunctions.net/getYouTubeVideos',
```

Reemplaza con tu URL real:
```javascript
cloudFunctionUrl: 'https://us-central1-tu-proyecto.cloudfunctions.net/getYouTubeVideos',
```

### 2. Configurar dominios permitidos (CORS)

Abre: `cloud-function/index.js`

Busca la línea 13:
```javascript
allowedOrigins: [
  'https://tudominio.com',
  'https://www.tudominio.com',
  'http://localhost:3000',
  'http://localhost:5500'
]
```

Reemplaza con TUS dominios:
```javascript
allowedOrigins: [
  'https://angelgarciadatablog.github.io',  // Tu dominio de GitHub Pages
  'http://127.0.0.1:5500',                   // Para desarrollo local
  'http://localhost:5500'
]
```

Guarda y **RE-DEPLOY** la función (repite el comando del Paso 6).

### 3. Habilitar la sección en index.html

Abre: `index.html`

Busca alrededor de la línea 123-152 y **des-comenta** la sección:

ANTES:
```html
<!-- Sección: Videos Recientes - TEMPORALMENTE DESHABILITADA -->
<!--
<section class="recent-videos">
  ...
</section>
-->
```

DESPUÉS:
```html
<!-- Sección: Videos Recientes -->
<section class="recent-videos">
  <div class="container">
    <h2>Videos Recientes</h2>
    <div class="videos-carousel-wrapper">
      <div class="videos-grid" id="youtube-videos">
        <!-- Los videos se cargarán aquí -->
      </div>
    </div>
  </div>
</section>
```

### 4. Actualizar referencia del script

Busca la línea 358 en `index.html`:

ANTES:
```html
<!-- <script src="js/youtube.js"></script> --> <!-- Deshabilitado temporalmente -->
```

DESPUÉS:
```html
<script src="js/youtube-secure.js"></script>
```

---

## ✅ Checklist Final

Marca cada paso completado:

- [ ] ✅ Google Cloud CLI instalado
- [ ] ✅ Proyecto de Google Cloud creado
- [ ] ✅ Facturación configurada
- [ ] ✅ APIs habilitadas (Cloud Functions, YouTube Data API v3)
- [ ] ✅ API Key de YouTube creada con restricciones
- [ ] ✅ Cloud Function desplegada exitosamente
- [ ] ✅ URL de la función obtenida
- [ ] ✅ Dominios configurados en CORS
- [ ] ✅ Frontend actualizado con la URL
- [ ] ✅ Sección de videos habilitada en index.html
- [ ] ✅ Script actualizado a youtube-secure.js
- [ ] ✅ Prueba local exitosa

---

## 🧪 Probar Todo

### 1. Abrir tu web localmente

```bash
# Si tienes Python 3
python3 -m http.server 8000

# O usa Live Server en VSCode
```

Abre: http://localhost:8000

### 2. Verificar la consola del navegador

Presiona F12 → Pestaña "Console"

Deberías ver:
```
🚀 Inicializando carga segura de videos de YouTube...
🎥 Cargando videos (intento 1/3)...
✅ Videos obtenidos desde YouTube API
✅ 3 videos cargados correctamente
```

### 3. ¿Ves los videos en pantalla?

¡Felicitaciones! 🎉 Todo está funcionando.

---

## 🆘 Troubleshooting

### Error: "command not found: gcloud"

**Solución:**
```bash
# macOS/Linux: Agregar al PATH
echo 'source "/usr/local/Caskroom/google-cloud-sdk/latest/google-cloud-sdk/path.bash.inc"' >> ~/.zshrc
source ~/.zshrc

# Verificar
gcloud --version
```

### Error: "billing account required"

**Solución:**
1. Ve a: https://console.cloud.google.com/billing
2. Configura una cuenta de facturación (no te cobrarán dentro del free tier)

### Error: "API youtube.googleapis.com not enabled"

**Solución:**
```bash
gcloud services enable youtube.googleapis.com
```

Espera 1-2 minutos y vuelve a intentar.

### Error: "CORS policy: No 'Access-Control-Allow-Origin'"

**Solución:**
1. Edita `cloud-function/index.js`
2. Agrega tu dominio a `allowedOrigins`
3. Re-deploy la función

### Error 403: "API key not valid"

**Solución:**
1. Verifica que habilitaste YouTube Data API v3
2. Espera 2-3 minutos (propagación)
3. Verifica que copiaste la API key correctamente
4. Intenta crear una nueva API key

### No se ven videos (sin errores)

**Solución:**
1. Abre la consola del navegador (F12)
2. Ve a la pestaña "Network"
3. Busca la llamada a tu Cloud Function
4. Verifica el status code y la respuesta

---

## 📊 Monitorear tu Cloud Function

### Ver logs en tiempo real:

```bash
gcloud functions logs read getYouTubeVideos \
  --gen2 \
  --region=us-central1 \
  --limit=50
```

### Ver métricas y uso:

1. Ve a: https://console.cloud.google.com/functions
2. Selecciona `getYouTubeVideos`
3. Pestaña "METRICS"

Verás:
- Invocaciones por segundo
- Tiempo de ejecución
- Errores
- Uso de memoria

---

## 💰 Monitorear Costos

### Dashboard de facturación:

https://console.cloud.google.com/billing

### Configurar alertas de presupuesto:

1. Ve a: https://console.cloud.google.com/billing/budgets
2. Clic en "CREATE BUDGET"
3. Configurar:
   - Budget name: "Cloud Functions Alert"
   - Budget amount: $5/mes
   - Alertas: 50%, 80%, 100%
4. Guardar

Recibirás emails si te acercas al límite.

---

## 🎯 Resumen de lo que acabas de hacer

1. ✅ Instalaste Google Cloud CLI
2. ✅ Creaste un proyecto en Google Cloud
3. ✅ Habilitaste las APIs necesarias
4. ✅ Creaste una API Key segura de YouTube
5. ✅ Desplegaste una Cloud Function con:
   - Rate limiting (10 req/min)
   - CORS configurado
   - Caché de 5 minutos
   - Límite de 10 instancias
   - 256MB RAM
6. ✅ Integraste la función con tu frontend
7. ✅ Habilitaste el carrusel de videos

**¡Tu API key ahora está 100% segura!** 🔒

---

## 📚 Recursos Adicionales

- [Documentación Cloud Functions](https://cloud.google.com/functions/docs)
- [YouTube Data API Quotas](https://developers.google.com/youtube/v3/getting-started#quota)
- [Cloud Functions Pricing](https://cloud.google.com/functions/pricing)
- [Guía de Seguridad](https://cloud.google.com/functions/docs/securing)

---

## 🎉 ¡Felicitaciones!

Has desplegado exitosamente tu primera Cloud Function en Google Cloud con todas las medidas de seguridad implementadas.

Si tienes dudas, revisa los logs o consulta la documentación.

**¡Ahora tu web tiene un carrusel de videos de YouTube completamente funcional y seguro!** 🚀
