# 🛡️ Configuración del Formulario de Contacto SEGURO

Este documento explica cómo configurar el formulario de contacto con todas las medidas de seguridad implementadas:

- ✅ **Honeypot** anti-bots
- ✅ **Rate Limiting** (límites de envío)
- ✅ **Notificaciones por Email**
- ✅ **Validaciones** robustas
- ✅ **Sanitización** de datos

---

## 📋 Resumen de Pasos

1. [Crear Google Spreadsheet](#paso-1-crear-google-spreadsheet)
2. [Configurar Google Apps Script](#paso-2-configurar-google-apps-script)
3. [Desplegar como Web App](#paso-3-desplegar-como-web-app)
4. [Configurar la URL en tu sitio](#paso-4-configurar-la-url-en-tu-sitio)
5. [Probar el formulario](#paso-5-probar-el-formulario)

---

## Paso 1: Crear Google Spreadsheet

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

## Paso 2: Configurar Google Apps Script

### 2.1 Abrir el editor

1. En tu Google Sheet, ve a: **Extensiones → Apps Script**
2. Se abrirá el editor de Apps Script
3. Borra todo el código por defecto

### 2.2 Copiar el código seguro

1. Abre el archivo: [`docs/google-apps-script-seguro.js`](./google-apps-script-seguro.js)
2. Copia **TODO** el contenido del archivo
3. Pégalo en el editor de Apps Script

### 2.3 Configurar tu email para notificaciones

En la línea 9 del código, verifica que esté tu email:

```javascript
const NOTIFICATION_EMAIL = 'angelgarciachanga@gmail.com';
```

Si quieres usar otro email, cámbialo aquí.

### 2.4 (Opcional) Ajustar límites de Rate Limiting

Por defecto está configurado con:
- **10 envíos por hora** por email
- **20 envíos por día** por email

Si quieres cambiar estos límites, edita las líneas 12-15:

```javascript
const RATE_LIMIT = {
  MAX_REQUESTS_PER_HOUR: 10,  // Cambia este número
  MAX_REQUESTS_PER_DAY: 20    // Cambia este número
};
```

### 2.5 Guardar el proyecto

1. Haz clic en el icono del **disco** o presiona `Ctrl+S` / `Cmd+S`
2. Ponle un nombre al proyecto: `Formulario Contacto Seguro`

---

## Paso 3: Desplegar como Web App

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

## Paso 4: Configurar la URL en tu sitio

### 4.1 Configurar la URL de Apps Script

1. Abre el archivo: [`js/contact-form.js`](../js/contact-form.js)
2. En la línea 7, reemplaza:

```javascript
const SCRIPT_URL = 'TU_URL_DE_GOOGLE_APPS_SCRIPT_AQUI';
```

Por la URL que copiaste en el Paso 3:

```javascript
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxXXXXXXXXXXXX/exec';
```

### 4.2 Guardar los cambios

Guarda el archivo modificado.

---

## Paso 5: Probar el formulario

### 5.1 Prueba local

1. Abre `index.html` en tu navegador
2. Desplázate hasta el formulario
3. Completa todos los campos:
   - Nombre: `Test Usuario`
   - Email: `test@ejemplo.com`
   - Tema: Selecciona cualquier opción
   - Mensaje: Escribe algo (mínimo 10 caracteres)
4. Haz clic en **Enviar Mensaje**
5. Deberías ver: "¡Mensaje enviado exitosamente!"

### 5.2 Verificar en Google Sheets

1. Ve a tu Google Sheet
2. Deberías ver una nueva fila con los datos del formulario

### 5.3 Verificar notificación por email

1. Revisa tu bandeja de entrada en **angelgarciachanga@gmail.com**
2. Deberías tener un email con asunto: "📧 Nuevo mensaje desde angelgarciadatablog.com"
3. El email incluye todos los detalles del mensaje y permite responder directamente

### 5.4 Probar protecciones

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
- Implementado en el frontend (JavaScript)

### 2. Rate Limiting
- **10 envíos por hora** por email
- **20 envíos por día** por email
- Previene spam masivo
- Los contadores se resetean automáticamente

### 3. Notificaciones por Email
- Recibes un email instantáneo cuando alguien envía el formulario
- Email incluye: nombre, email, tema y mensaje
- Configurado con `replyTo` para responder directamente
- Manejo de errores silencioso (no afecta el formulario si falla)

### 4. Validaciones
- Formato de email correcto
- Longitud del mensaje (10-2000 caracteres)
- Todos los campos requeridos
- Sanitización de datos (previene inyecciones)

### 5. Logs
- Todos los intentos rechazados se registran en Apps Script
- Ver logs: Apps Script → Ejecuciones

---

## 🚨 Solución de Problemas

### Error: "El formulario aún no está configurado"
**Causa**: No configuraste la URL en `js/contact-form.js`

**Solución**: Verifica el Paso 4.1

---

### Los datos no llegan a Google Sheets
**Causas posibles**:

1. **URL incorrecta**: Verifica el Paso 4.1
2. **Script no desplegado**: Verifica el Paso 3
3. **Honeypot activado**: Verifica que no hayas llenado el campo oculto
4. **Rate limit**: Espera 1 hora e intenta con otro email

**Para debugging**:
1. Ve a Apps Script → **Ejecuciones** (menú izquierdo)
2. Busca la última ejecución
3. Revisa los logs para ver qué falló

---

### No llegan los emails de notificación
**Causas posibles**:

1. **Email incorrecto**: Verifica línea 9 en Apps Script
2. **Revisa spam**: El email podría estar en spam/correo no deseado
3. **Permisos**: Verifica que Apps Script tenga permiso para enviar emails

**Solución**:
1. Ve a Apps Script → Ejecuciones
2. Busca errores relacionados con `sendEmail`
3. Si dice "falta permiso", vuelve a autorizar la app (Paso 3.7)

---

## 📊 Monitoreo y Mantenimiento

### Limpiar caché de Rate Limiting
Si necesitas resetear los contadores manualmente:

1. Abre Apps Script
2. Busca la función `clearRateLimitCache()`
3. Haz clic en **Ejecutar**

### Ver logs de intentos rechazados
1. Apps Script → **Ejecuciones**
2. Busca líneas que digan:
   - "Solicitud rechazada: Rate limit excedido"
   - "Bot detectado vía honeypot"

### Cambiar email de notificaciones
1. Edita línea 9 en Apps Script
2. Guarda
3. **NO necesitas re-desplegar**, el cambio aplica inmediatamente

---

## 🚀 Próximos Pasos (Opcional)

### Exportar a BigQuery
Una vez que tengas datos en Google Sheets:

**Opción 1**: Connected Sheets
1. En Google Sheets: Datos → Conectores de datos → Conectar a BigQuery
2. Selecciona tu proyecto y dataset
3. Configura la sincronización automática

**Opción 2**: Apps Script personalizado
Modifica el código de Apps Script para escribir directamente a BigQuery (más avanzado).

---

### Agregar más campos al formulario
Si quieres agregar campos como "teléfono" o "empresa":

1. Agrega el campo en `index.html`
2. Agrega la columna en Google Sheets
3. Actualiza `contact-form.js` para incluir el nuevo campo
4. Actualiza Apps Script para procesar el nuevo campo
5. Re-despliega Apps Script

---

## 📝 Checklist Final

Antes de publicar, verifica:

- [ ] ✅ Google Sheet creado con encabezados correctos
- [ ] ✅ Apps Script configurado con tu email
- [ ] ✅ Apps Script desplegado como Web App
- [ ] ✅ URL de Apps Script configurada en `js/contact-form.js`
- [ ] ✅ Formulario probado localmente
- [ ] ✅ Datos llegando correctamente a Google Sheets
- [ ] ✅ Email de notificación recibido
- [ ] ✅ Rate limiting funcionando
- [ ] ✅ Honeypot funcionando

---

¿Necesitas ayuda? Contáctame en [LinkedIn](https://www.linkedin.com/in/angelgarciachanga/)
