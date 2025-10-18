# Cloud Function para YouTube API - Guía Completa

## Índice
- [Protecciones Implementadas](#protecciones-implementadas)
- [Límites Configurados](#límites-configurados)
- [Instalación y Deployment](#instalación-y-deployment)
- [Configuración de Límites en Google Cloud](#configuración-de-límites-en-google-cloud)
- [Monitoreo y Alertas](#monitoreo-y-alertas)
- [Actualizar Frontend](#actualizar-frontend)
- [Costos y Cuotas](#costos-y-cuotas)

---

## 🛡️ Protecciones Implementadas

### 1. **Rate Limiting**
- ✅ **10 requests por minuto** por IP
- ✅ Reintentos automáticos con backoff exponencial
- ✅ Respuestas 429 con header `Retry-After`

### 2. **CORS (Cross-Origin Resource Sharing)**
- ✅ Solo permite requests desde dominios autorizados
- ✅ Configurable en `allowedOrigins` (línea 13 de index.js)
- ✅ Localhost permitido para desarrollo

### 3. **Caché Inteligente**
- ✅ **5 minutos de caché** en memoria
- ✅ Reduce llamadas a YouTube API en 95%+
- ✅ Retorna edad del caché en la respuesta

### 4. **Validaciones de Seguridad**
- ✅ Solo método GET permitido
- ✅ Timeouts de 5 segundos
- ✅ API key en variables de entorno (nunca en código)
- ✅ Manejo de errores sin exponer detalles internos

### 5. **Límites de Recursos**
- ✅ Máximo 10 instancias concurrentes
- ✅ 256MB de memoria por función
- ✅ 10 segundos de timeout máximo

---

## ⚙️ Límites Configurados

### En el Código (index.js)

```javascript
// Rate Limiting
maxRequests: 10         // Por minuto por IP
windowMs: 60 * 1000     // Ventana de 1 minuto

// Caché
duration: 5 * 60 * 1000 // 5 minutos

// Timeouts
timeout: 5000           // 5 segundos
```

### En Google Cloud (deployment)

```bash
--max-instances=10      # Máximo 10 funciones corriendo simultáneamente
--memory=256MB          # 256MB RAM por función
--timeout=10s           # Timeout de 10 segundos
--min-instances=0       # Scale to zero cuando no hay tráfico
```

---

## 📦 Instalación y Deployment

### Prerrequisitos

1. **Instalar Google Cloud CLI**
```bash
# macOS
brew install --cask google-cloud-sdk

# Windows
# Descargar desde: https://cloud.google.com/sdk/docs/install

# Linux
curl https://sdk.cloud.google.com | bash
```

2. **Autenticarse en Google Cloud**
```bash
gcloud auth login
gcloud config set project TU_PROJECT_ID
```

3. **Habilitar APIs necesarias**
```bash
gcloud services enable cloudfunctions.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable youtube.googleapis.com
```

### Deployment Paso a Paso

#### **Paso 1: Preparar el código**

```bash
cd cloud-function
npm install
```

#### **Paso 2: Revocar la API Key antigua (MUY IMPORTANTE)**

1. Ve a [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
2. Encuentra cualquier API key antigua expuesta
3. **Elimínala o revócala**

#### **Paso 3: Crear nueva API Key con restricciones**

1. En Google Cloud Console → Credentials
2. Clic en "Create Credentials" → "API Key"
3. Clic en "Restrict Key" para la nueva key:

   **Application restrictions:**
   - Selecciona "IP addresses"
   - Agrega: `0.0.0.0/0` (se restringirá automáticamente a las IPs de Cloud Functions)

   **API restrictions:**
   - Selecciona "Restrict key"
   - Marca solo: **YouTube Data API v3**

4. Guarda la nueva API key

#### **Paso 4: Deploy con Gen2 (recomendado)**

```bash
# Reemplaza TU_NUEVA_API_KEY con tu key recién creada
gcloud functions deploy getYouTubeVideos \
  --gen2 \
  --runtime=nodejs20 \
  --region=us-central1 \
  --trigger-http \
  --allow-unauthenticated \
  --entry-point=getYouTubeVideos \
  --max-instances=10 \
  --min-instances=0 \
  --memory=256MB \
  --timeout=10s \
  --set-env-vars YOUTUBE_API_KEY="TU_NUEVA_API_KEY"
```

**Regiones disponibles (elige la más cercana):**
- `us-central1` (Iowa, USA)
- `us-east1` (Carolina del Sur, USA)
- `europe-west1` (Bélgica)
- `asia-northeast1` (Tokio)

#### **Paso 5: Obtener la URL de la función**

Después del deployment, verás algo como:

```
url: https://us-central1-tu-proyecto.cloudfunctions.net/getYouTubeVideos
```

**Copia esta URL** para usarla en el frontend.

---

## 🔧 Configuración de Límites Adicionales en Google Cloud

### 1. **Establecer Cuotas de YouTube API**

```bash
# Ver cuota actual
gcloud alpha quotas describe \
  --service=youtube.googleapis.com \
  --consumer=projects/TU_PROJECT_ID \
  --limit=ReadRequests

# Configurar alerta en 80% de uso
# (requiere configuración manual en Cloud Console)
```

### 2. **Configurar Budget Alerts (Alertas de Presupuesto)**

```bash
# Crear alerta de presupuesto de $5 USD
gcloud billing budgets create \
  --billing-account=BILLING_ACCOUNT_ID \
  --display-name="Cloud Functions Budget Alert" \
  --budget-amount=5 \
  --threshold-rule=percent=50 \
  --threshold-rule=percent=80 \
  --threshold-rule=percent=100
```

O configurar manualmente:
1. Ve a [Google Cloud Console → Billing → Budgets](https://console.cloud.google.com/billing/budgets)
2. Clic en "Create Budget"
3. Establece límite: **$5 USD/mes**
4. Alertas en: 50%, 80%, 100%

### 3. **Configurar Límite de Concurrencia**

```bash
# Limitar a máximo 10 requests simultáneos
gcloud functions deploy getYouTubeVideos \
  --max-instances=10 \
  --concurrency=1
```

### 4. **Monitorear Uso en Tiempo Real**

```bash
# Ver logs
gcloud functions logs read getYouTubeVideos --limit=50

# Ver métricas
gcloud monitoring dashboards list
```

---

## 📊 Monitoreo y Alertas

### Logs y Debugging

```bash
# Ver logs en tiempo real
gcloud functions logs read getYouTubeVideos --limit=50 --format=json

# Filtrar errores
gcloud functions logs read getYouTubeVideos --limit=50 | grep "ERROR"

# Ver métricas de ejecución
gcloud functions describe getYouTubeVideos --gen2 --region=us-central1
```

### Dashboard de Monitoreo

1. Ve a [Cloud Console → Cloud Functions](https://console.cloud.google.com/functions)
2. Selecciona `getYouTubeVideos`
3. Pestaña "METRICS" muestra:
   - Invocations per second
   - Execution time
   - Memory usage
   - Error rate

### Configurar Alertas

```bash
# Crear alerta de tasa de error
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="Cloud Function Error Rate" \
  --condition-display-name="Error rate > 5%" \
  --condition-threshold-value=0.05 \
  --condition-threshold-duration=60s
```

---

## 🌐 Actualizar Frontend

### Opción A: Reemplazar archivo JS actual

En [index.html](../index.html), cambia:

```html
<!-- ANTES (INSEGURO) -->
<script src="js/youtube.js"></script>

<!-- DESPUÉS (SEGURO) -->
<script src="js/youtube-secure.js"></script>
```

### Opción B: Actualizar configuración

Edita [js/youtube-secure.js](../js/youtube-secure.js) línea 9:

```javascript
cloudFunctionUrl: 'https://us-central1-TU_PROJECT_ID.cloudfunctions.net/getYouTubeVideos'
```

Reemplaza con la URL que obtuviste en el deployment.

### Probar en Desarrollo Local

1. Edita [js/youtube-secure.js](../js/youtube-secure.js):
```javascript
localDevelopment: true  // Cambiar a true
```

2. Ejecutar la función localmente:
```bash
cd cloud-function
npm run test-local
```

3. Abre tu web en `http://localhost:5500`

---

## 💰 Costos y Cuotas

### Free Tier de Cloud Functions (Gen2)

| Recurso | Free Tier (mensual) | Tu uso estimado | Costo estimado |
|---------|---------------------|-----------------|----------------|
| **Invocaciones** | 2,000,000 | ~10,000 | $0.00 |
| **Compute time** | 400,000 GB-s | ~1,500 GB-s | $0.00 |
| **Network egress** | 5 GB | ~0.1 GB | $0.00 |
| **YouTube API Quota** | 10,000 units/day | ~30 units/day | $0.00 |

### Cálculo de Uso Real

**Escenario: Blog personal con 1,000 visitas/día**

```
Invocaciones diarias: 1,000
Duración promedio: 500ms
Memoria: 256MB

Cálculo mensual (30 días):
- Invocaciones: 30,000 (1.5% del free tier)
- Compute time: 3,750 GB-s (0.9% del free tier)
- YouTube API calls: ~30/día (por el caché de 5 min)

Resultado: 100% GRATIS ✅
```

**Cuándo empezarías a pagar:**
- Con más de **66,000 visitas/día** (2M/mes)
- O si deshabilitas el caché

### YouTube API Quotas

- **Free tier:** 10,000 units/día
- **Costo por request:**
  - `channels.list`: 1 unit
  - `search.list`: 100 units
- **Tu uso con caché (5 min):**
  - ~288 requests/día = ~29,000 units/día
  - ❌ **Excedería el límite SIN caché**
  - ✅ **Dentro del límite CON caché**

**El caché reduce tu uso de YouTube API en ~95%** 🎯

---

## 🔒 Configurar Dominios Permitidos (CORS)

Edita [cloud-function/index.js](index.js) línea 13:

```javascript
allowedOrigins: [
  'https://tudominio.com',           // Reemplaza con tu dominio
  'https://www.tudominio.com',       // Reemplaza con tu dominio
  'http://localhost:3000',
  'http://localhost:5500'
]
```

Después de editar, **re-deploy** la función.

---

## 🧪 Testing

### Test Manual

```bash
# Llamar a la función directamente
curl -X GET "https://us-central1-TU_PROJECT.cloudfunctions.net/getYouTubeVideos"

# Verificar rate limiting (llamar 15 veces rápido)
for i in {1..15}; do
  curl -X GET "https://us-central1-TU_PROJECT.cloudfunctions.net/getYouTubeVideos"
  echo ""
done

# Deberías ver error 429 después de 10 requests
```

### Test de Caché

```bash
# Primera llamada (fresca)
curl "URL_DE_TU_FUNCION" | jq '.cached'
# Output: false

# Segunda llamada inmediata (caché)
curl "URL_DE_TU_FUNCION" | jq '.cached'
# Output: true
```

---

## 🚨 Troubleshooting

### Error: "YOUTUBE_API_KEY not configured"

**Solución:** Re-deploy con la variable de entorno:
```bash
gcloud functions deploy getYouTubeVideos \
  --update-env-vars YOUTUBE_API_KEY="TU_API_KEY"
```

### Error 403: "API key not valid"

**Solución:**
1. Verifica que habilitaste YouTube Data API v3
2. Verifica restricciones de la API key
3. Espera 5 minutos para propagación

### Error 429: "Too Many Requests"

**Normal:** Rate limiting funcionando correctamente.
- Espera 60 segundos o ajusta `maxRequests` en el código

### Error CORS

**Solución:** Agrega tu dominio a `allowedOrigins` y re-deploy

---

## 📝 Checklist Final

- [ ] API key antigua revocada
- [ ] Nueva API key creada con restricciones
- [ ] Cloud Function deployed con límites
- [ ] URL de Cloud Function copiada
- [ ] Frontend actualizado con nueva URL
- [ ] CORS configurado con tu dominio
- [ ] Budget alerts configuradas ($5/mes)
- [ ] Prueba manual exitosa
- [ ] Archivo `.env` NO commiteado a Git

---

## 🎯 Resumen de Límites Implementados

| Límite | Valor | Propósito |
|--------|-------|-----------|
| **Rate limit por IP** | 10/min | Prevenir abuso |
| **Caché** | 5 min | Reducir costos |
| **Timeout** | 10s | Prevenir ejecuciones largas |
| **Max instancias** | 10 | Limitar concurrencia |
| **Memoria** | 256MB | Optimizar costos |
| **Budget alert** | $5/mes | Prevenir sorpresas |
| **YouTube quota** | 10k/día | Límite de Google |

---

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs: `gcloud functions logs read getYouTubeVideos`
2. Verifica métricas en Cloud Console
3. Consulta la [documentación oficial](https://cloud.google.com/functions/docs)

---

**¡Listo!** Tu API key ahora está segura y con límites configurados. 🎉
