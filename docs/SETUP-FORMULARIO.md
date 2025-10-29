# 🛡️ Configuración del Formulario de Contacto SEGURO

Este documento explica cómo configurar el formulario de contacto con todas las medidas de seguridad implementadas:

- ✅ **Honeypot** anti-bots
- ✅ **Google reCAPTCHA v3**
- ✅ **Rate Limiting** (límites de envío)
- ✅ **Validaciones** robustas
- ✅ **Sanitización** de datos

---

## 📋 Resumen de Pasos

1. [Configurar Google reCAPTCHA v3](#paso-1-configurar-google-recaptcha-v3)
2. [Crear Google Spreadsheet](#paso-2-crear-google-spreadsheet)
3. [Configurar Google Apps Script](#paso-3-configurar-google-apps-script)
4. [Desplegar como Web App](#paso-4-desplegar-como-web-app)
5. [Configurar las URLs en tu sitio](#paso-5-configurar-las-urls-en-tu-sitio)
6. [Probar el formulario](#paso-6-probar-el-formulario)

---

## Paso 1: Configurar Google reCAPTCHA v3

### 1.1 Crear cuenta de reCAPTCHA

1. Ve a: [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin)
2. Haz clic en el **+** para crear un nuevo sitio
3. Completa el formulario:
   - **Etiqueta**: `angelgarciadatablog - Formulario Contacto`
   - **Tipo de reCAPTCHA**: Selecciona **reCAPTCHA v3**
   - **Dominios**:
     - `angelgarciachanga.github.io` (para producción)
     - `localhost` (para pruebas locales)
   - **Propietarios**: Tu email de Google
   - Acepta los términos
4. Haz clic en **Enviar**

### 1.2 Guardar las claves

Después de crear el sitio, verás dos claves:

- **Site Key** (clave del sitio): `6Lc...` - Se usa en el frontend
- **Secret Key** (clave secreta): `6Lc...` - Se usa en el backend

⚠️ **IMPORTANTE**: Guarda ambas claves, las necesitarás en los siguientes pasos.

---

## Paso 2: Crear Google Spreadsheet

1. Ve a [Google Sheets](https://sheets.google.com)
2. Crea una nueva hoja de cálculo
3. Nómbrala: **"Formulario Contacto - angelgarciadatablog"**
4. En la primera fila (encabezados), agrega:
   - **A1**: `Fecha/Hora`
   - **B1**: `Nombre`
   - **C1**: `Email`
   - **D1**: `Tema`
   - **E1**: `Mensaje`

5. (Opcional) Dale formato a los encabezados:
   - Selecciona la fila 1
   - Fondo: Color oscuro
   - Texto: Negrita y blanco

---

## Paso 3: Configurar Google Apps Script

### 3.1 Abrir el editor

1. En tu Google Sheet, ve a: **Extensiones → Apps Script**
2. Se abrirá el editor de Apps Script
3. Borra todo el código por defecto

### 3.2 Copiar el código seguro

1. Abre el archivo: [`docs/google-apps-script-seguro.js`](./google-apps-script-seguro.js)
2. Copia **TODO** el contenido del archivo
3. Pégalo en el editor de Apps Script

### 3.3 Configurar tu Secret Key de reCAPTCHA

En la línea 9 del código, reemplaza:

```javascript
const RECAPTCHA_SECRET_KEY = 'TU_SECRET_KEY_DE_RECAPTCHA_AQUI';
```

Por tu **Secret Key** real de reCAPTCHA (la que obtuviste en el Paso 1):

```javascript
const RECAPTCHA_SECRET_KEY = '6Lc_TU_SECRET_KEY_REAL_AQUI';
```

### 3.4 (Opcional) Configurar notificaciones por email

Si quieres recibir un email cada vez que alguien envíe el formulario, busca la línea 207:

```javascript
const recipient = 'tu-email@ejemplo.com'; // ⚠️ CAMBIAR POR TU EMAIL
```

Y reemplázalo por tu email real.

Luego, en la línea 94, descomenta:

```javascript
// sendEmailNotification(sanitizedName, sanitizedEmail, sanitizedTopic, sanitizedMessage);
```

Queda así (sin `//`):

```javascript
sendEmailNotification(sanitizedName, sanitizedEmail, sanitizedTopic, sanitizedMessage);
```

### 3.5 Guardar el proyecto

1. Haz clic en el icono del **disco** o presiona `Ctrl+S` / `Cmd+S`
2. Ponle un nombre al proyecto: `Formulario Contacto Seguro`

---

## Paso 4: Desplegar como Web App

1. En el editor de Apps Script, haz clic en **Implementar** (arriba a la derecha)
2. Selecciona **Nueva implementación**
3. Haz clic en el icono de engranaje ⚙️ junto a "Tipo"
4. Selecciona: **Aplicación web**
5. Configura así:
   - **Descripción**: `v1 - Formulario con seguridad`
   - **Ejecutar como**: `Yo (tu email)`
   - **Quién tiene acceso**: `Cualquier persona`
6. Haz clic en **Implementar**
7. Si aparece un aviso de autorización:
   - Haz clic en **Autorizar acceso**
   - Selecciona tu cuenta de Google
   - Haz clic en **Avanzado** → **Ir a [nombre del proyecto] (no seguro)**
   - Haz clic en **Permitir**

8. **IMPORTANTE**: Copia la **URL de la aplicación web** que aparece:
   ```
   https://script.google.com/macros/s/AKfycbxXXXXXXXXXXXX/exec
   ```

⚠️ Guarda esta URL, la necesitarás en el siguiente paso.

---

## Paso 5: Configurar las URLs en tu sitio

### 5.1 Configurar la URL de Apps Script

1. Abre el archivo: [`js/contact-form.js`](../js/contact-form.js)
2. En la línea 7, reemplaza:

```javascript
const SCRIPT_URL = 'TU_URL_DE_GOOGLE_APPS_SCRIPT_AQUI';
```

Por la URL que copiaste en el Paso 4:

```javascript
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxXXXXXXXXXXXX/exec';
```

### 5.2 Configurar la Site Key de reCAPTCHA

En la **misma línea 10** del archivo `js/contact-form.js`, reemplaza:

```javascript
const RECAPTCHA_SITE_KEY = 'TU_SITE_KEY_AQUI';
```

Por tu **Site Key** de reCAPTCHA (la que obtuviste en el Paso 1):

```javascript
const RECAPTCHA_SITE_KEY = '6Lc_TU_SITE_KEY_REAL_AQUI';
```

### 5.3 Actualizar el HTML con la Site Key

1. Abre el archivo: [`index.html`](../index.html)
2. En la línea 38, reemplaza:

```html
<script src="https://www.google.com/recaptcha/api.js?render=TU_SITE_KEY_AQUI"></script>
```

Por:

```html
<script src="https://www.google.com/recaptcha/api.js?render=6Lc_TU_SITE_KEY_REAL_AQUI"></script>
```

(Usa la misma Site Key del paso anterior)

### 5.4 Guardar los cambios

Guarda todos los archivos modificados.

---

## Paso 6: Probar el formulario

### 6.1 Prueba local

1. Abre `index.html` en tu navegador
2. Desplázate hasta el formulario
3. Completa todos los campos:
   - Nombre: `Test Usuario`
   - Email: `test@ejemplo.com`
   - Tema: Selecciona cualquier opción
   - Mensaje: Escribe algo (mínimo 10 caracteres)
4. Haz clic en **Enviar Mensaje**
5. Deberías ver: "¡Mensaje enviado exitosamente!"

### 6.2 Verificar en Google Sheets

1. Ve a tu Google Sheet
2. Deberías ver una nueva fila con los datos del formulario

### 6.3 Probar protecciones

**Test 1: Rate Limiting**
- Envía el formulario 11 veces con el mismo email
- La 11ª vez debería mostrar: "Has alcanzado el límite de envíos por hora"

**Test 2: Validaciones**
- Intenta enviar con un email inválido → Error
- Intenta enviar con mensaje muy corto → Error
- Intenta enviar con mensaje muy largo (>2000 chars) → Error

**Test 3: Honeypot**
- Abre las DevTools del navegador (F12)
- En Console, ejecuta:
  ```javascript
  document.getElementById('website').value = 'bot';
  ```
- Envía el formulario → Debería mostrar éxito pero NO guardar en Sheets

---

## 🛡️ Medidas de Seguridad Implementadas

### 1. Honeypot
- Campo oculto que los bots llenan pero humanos no ven
- Si se llena, el formulario finge éxito pero no guarda nada

### 2. reCAPTCHA v3
- Analiza el comportamiento del usuario (sin CAPTCHA visible)
- Score de 0.0 (bot) a 1.0 (humano)
- Umbral configurado en 0.5

### 3. Rate Limiting
- **10 envíos por hora** por email
- **20 envíos por día** por email
- Previene spam masivo

### 4. Validaciones
- Formato de email
- Longitud del mensaje (10-2000 caracteres)
- Todos los campos requeridos
- Sanitización de datos (previene inyecciones)

### 5. Logs
- Todos los intentos rechazados se registran en Apps Script
- Ver logs: Apps Script → Ejecuciones

---

## 🚨 Solución de Problemas

### Error: "El formulario aún no está configurado"
**Causa**: No configuraste las URLs en `js/contact-form.js`

**Solución**: Verifica el Paso 5.1 y 5.2

---

### Error: "Verificación de seguridad falló"
**Causa**: reCAPTCHA no está funcionando

**Soluciones**:
1. Verifica que la Site Key en `index.html` (línea 38) sea correcta
2. Verifica que la Site Key en `js/contact-form.js` (línea 10) sea correcta
3. Verifica que la Secret Key en Apps Script (línea 9) sea correcta
4. Abre DevTools (F12) → Console y busca errores de reCAPTCHA

---

### Los datos no llegan a Google Sheets
**Causas posibles**:

1. **URL incorrecta**: Verifica el Paso 5.1
2. **Script no desplegado**: Verifica el Paso 4
3. **Honeypot activado**: Verifica que no hayas llenado el campo oculto
4. **Rate limit**: Espera 1 hora e intenta con otro email

**Para debugging**:
1. Ve a Apps Script → **Ejecuciones** (menú izquierdo)
2. Busca la última ejecución
3. Revisa los logs para ver qué falló

---

### reCAPTCHA muestra "Invalid site key"
**Causa**: Site Key incorrecta o dominio no autorizado

**Solución**:
1. Ve a [reCAPTCHA Admin](https://www.google.com/recaptcha/admin)
2. Selecciona tu sitio
3. En "Dominios", verifica que esté:
   - `localhost` (para pruebas)
   - Tu dominio de GitHub Pages
4. Copia nuevamente la Site Key y reemplázala

---

## 📊 Monitoreo y Mantenimiento

### Ver estadísticas de reCAPTCHA
1. Ve a [reCAPTCHA Admin](https://www.google.com/recaptcha/admin)
2. Selecciona tu sitio
3. Revisa las gráficas de solicitudes y scores

### Limpiar caché de Rate Limiting
Si necesitas resetear los contadores manualmente:

1. Abre Apps Script
2. Busca la función `clearRateLimitCache()`
3. Haz clic en **Ejecutar**

### Ver logs de intentos rechazados
1. Apps Script → **Ejecuciones**
2. Busca líneas que digan:
   - "Solicitud rechazada: reCAPTCHA score bajo"
   - "Solicitud rechazada: Rate limit excedido"

---

## 🚀 Próximos Pasos

### Exportar a BigQuery
Una vez que tengas datos en Google Sheets:

**Opción 1**: Connected Sheets
1. En Google Sheets: Datos → Conectores de datos → Conectar a BigQuery
2. Selecciona tu proyecto y dataset
3. Configura la sincronización automática

**Opción 2**: Apps Script personalizado
Modifica el código de Apps Script para escribir directamente a BigQuery (más avanzado).

---

### Convertir en Servicio (Cloud Functions)
Para ofrecer esto como servicio:

1. Migrar a **Google Cloud Functions**
2. Implementar **API Keys** por cliente
3. Crear **panel de administración**
4. Multi-tenancy (un dataset por cliente)

---

## 📝 Checklist Final

Antes de publicar, verifica:

- [ ] ✅ reCAPTCHA configurado (Site Key y Secret Key)
- [ ] ✅ Google Sheet creado con encabezados correctos
- [ ] ✅ Apps Script desplegado como Web App
- [ ] ✅ URL de Apps Script configurada en `js/contact-form.js`
- [ ] ✅ Site Key de reCAPTCHA en `index.html` y `js/contact-form.js`
- [ ] ✅ Formulario probado localmente
- [ ] ✅ Datos llegando correctamente a Google Sheets
- [ ] ✅ Rate limiting funcionando
- [ ] ✅ Honeypot funcionando

---

¿Necesitas ayuda? Contáctame en [LinkedIn](https://www.linkedin.com/in/angelgarciachanga/)
