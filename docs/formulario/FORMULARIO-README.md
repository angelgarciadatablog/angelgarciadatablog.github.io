# 📋 Formulario de Contacto - Resumen Ejecutivo

## ✅ Lo que se implementó

### Frontend (Tu sitio web)
- **Formulario HTML** con 4 campos:
  - Nombre
  - Email
  - Tema de consulta (Power BI, SQL, Sitio web, Otros)
  - Mensaje
- **Diseño profesional** acorde a tu tema oscuro con botón morado
- **JavaScript con validaciones** robustas

### Seguridad (2 capas)
1. **Honeypot** - Campo oculto que atrapa bots
2. **Rate Limiting** - Máximo 10 envíos/hora y 20 envíos/día por email

### Backend (Google Apps Script)
- Recibe datos del formulario vía GET (JSONP)
- Valida todo antes de guardar
- Guarda en Google Sheets
- **Envía notificación por email** a angelgarciachanga@gmail.com

---

## 📁 Archivos modificados/creados

```
web-angelgarciadatablog/
├── index.html                              ✏️ Modificado (formulario agregado)
├── styles.css                              ✏️ Modificado (estilos del formulario)
├── script.js                               ✏️ Modificado (smooth scroll)
├── js/
│   └── contact-form.js                     ⭐ Nuevo
└── docs/
    ├── SETUP-FORMULARIO.md                 ⭐ Nuevo (Guía completa)
    ├── google-apps-script-seguro.js        ⭐ Nuevo (Código para Apps Script)
    └── FORMULARIO-README.md                ⭐ Nuevo (Este archivo)
```

---

## 🚀 Próximos pasos (en orden)

### 1. Crear Google Sheet (2 min)
- Crea una hoja con encabezados: `Fecha/Hora | Nombre | Email | Tema | Mensaje`

### 2. Configurar Apps Script (5 min)
- Abre: Extensiones → Apps Script
- Copia el código de `docs/google-apps-script-seguro.js`
- Verifica que el email esté correcto en línea 9

### 3. Desplegar Apps Script (3 min)
- Implementar → Nueva implementación → Aplicación web
- Ejecutar como: Yo
- Acceso: Cualquier persona
- Copia la URL

### 4. Configurar tu sitio (2 min)
Edita `js/contact-form.js` línea 7:

```javascript
const SCRIPT_URL = 'https://script.google.com/macros/s/TU_URL/exec';
```

### 5. Probar (5 min)
- Abre `index.html` en tu navegador
- Completa el formulario
- Verifica que llegue a Google Sheets
- Verifica que llegue el email a angelgarciachanga@gmail.com

---

## 🛡️ Niveles de seguridad

| Medida | Qué bloquea | Nivel |
|--------|-------------|-------|
| Honeypot | Bots automáticos básicos | ⭐⭐ |
| Rate Limiting | Spam masivo, abuso | ⭐⭐⭐⭐ |
| Validaciones | Datos malformados, inyecciones | ⭐⭐⭐ |
| Email notifications | Detectar spam rápidamente | ⭐⭐⭐ |

**Nivel de protección total: ⭐⭐⭐ (Bueno para un sitio personal sin reCAPTCHA)**

---

## 💰 Costos

Todo es **100% GRATIS** para tu uso:

- ✅ GitHub Pages: Gratis
- ✅ Google Apps Script: Gratis (hasta 20,000 ejecuciones/día)
- ✅ Google Sheets: Gratis
- ✅ Gmail (notificaciones): Gratis (hasta 100 emails/día)

**Límites prácticos:**
- ~20,000 envíos de formulario por día (más que suficiente)
- ~100 notificaciones por email por día

---

## 📧 Notificaciones por Email

Cuando alguien envía el formulario:
- Recibes un email en **angelgarciachanga@gmail.com**
- Asunto: "📧 Nuevo mensaje desde angelgarciadatablog.com"
- El email incluye:
  - 👤 Nombre del remitente
  - 📧 Email del remitente
  - 📋 Tema de la consulta
  - 💬 Mensaje completo
  - ↩️ Botón "Responder" configurado para responder directamente al remitente

**Ventajas:**
- Respuesta inmediata: sabes al instante cuando alguien te contacta
- No necesitas revisar Google Sheets constantemente
- Puedes responder directo desde tu email

---

## 📊 Cuando escalar a Cloud Functions

Considera migrar a Cloud Functions cuando:

- ❌ Recibas más de 10,000 formularios/día
- ❌ Quieras ofrecer esto como servicio a terceros
- ❌ Necesites escribir directo a BigQuery (sin Sheets intermediario)
- ❌ Necesites autenticación por cliente (API Keys)
- ❌ Quieras multi-tenancy (varios clientes aislados)
- ❌ Empieces a recibir spam consistente (considera agregar reCAPTCHA primero)

---

## 📖 Documentación completa

Para instrucciones paso a paso detalladas, ver:
- **[docs/SETUP-FORMULARIO.md](./SETUP-FORMULARIO.md)** - Guía completa de configuración

Para el código de Apps Script:
- **[docs/google-apps-script-seguro.js](./google-apps-script-seguro.js)** - Código listo para copiar

---

## 🆘 Ayuda rápida

**¿El formulario no funciona?**
1. Abre DevTools (F12) → Console
2. Busca errores en rojo
3. Verifica que la URL de Apps Script en `js/contact-form.js` sea correcta

**¿Los datos no llegan a Sheets?**
1. Apps Script → Ejecuciones
2. Revisa los logs de la última ejecución
3. Busca el mensaje de error específico

**¿No llegan los emails?**
1. Revisa la carpeta de spam en Gmail
2. Verifica que el email en línea 9 de Apps Script sea correcto
3. Revisa Apps Script → Ejecuciones para ver errores de `sendEmail`

**¿Necesitas ayuda?**
- Revisa la sección "Solución de Problemas" en SETUP-FORMULARIO.md
- Contacta en LinkedIn: https://www.linkedin.com/in/angelgarciachanga/

---

## ✅ Checklist de publicación

Antes de hacer push a GitHub:

- [ ] Google Sheet creado con encabezados
- [ ] Apps Script configurado con tu email
- [ ] Apps Script desplegado
- [ ] URL de Apps Script configurada en `js/contact-form.js`
- [ ] Formulario probado localmente
- [ ] Datos llegando a Google Sheets
- [ ] Email de notificación recibido
- [ ] Protecciones funcionando (honeypot, rate limit)

---

¡Listo para producción! 🚀
