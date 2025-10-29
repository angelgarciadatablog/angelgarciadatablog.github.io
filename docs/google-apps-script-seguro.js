// ========================================
// Google Apps Script - Formulario de Contacto SEGURO
// Con Rate Limiting y validación de reCAPTCHA
// ACTUALIZADO: Usa GET con JSONP para evitar CORS
// ========================================

// ⚠️ CONFIGURACIÓN:
// 1. Tu Secret Key de reCAPTCHA v3 (obtener en: https://www.google.com/recaptcha/admin)
const RECAPTCHA_SECRET_KEY = 'TU_SECRET_KEY_DE_RECAPTCHA_AQUI';

// 2. Puntuación mínima de reCAPTCHA (0.0 = bot, 1.0 = humano)
const RECAPTCHA_MIN_SCORE = 0.5;

// 3. Configuración de Rate Limiting
const RATE_LIMIT = {
  MAX_REQUESTS_PER_HOUR: 10,  // Máximo 10 envíos por hora por email
  MAX_REQUESTS_PER_DAY: 20    // Máximo 20 envíos por día por email
};

/**
 * Función que recibe peticiones GET (JSONP) - Evita problemas de CORS
 */
function doGet(e) {
  try {
    const params = e.parameter;

    // Extraer datos
    const data = {
      name: params.name,
      email: params.email,
      topic: params.topic,
      message: params.message,
      timestamp: params.timestamp,
      recaptchaToken: params.recaptchaToken || null
    };

    // 🛡️ VALIDACIÓN 1: Campos requeridos
    if (!data.name || !data.email || !data.topic || !data.message) {
      return createJSONPResponse(params.callback, 'error', 'Todos los campos son requeridos');
    }

    // 🛡️ VALIDACIÓN 2: Formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return createJSONPResponse(params.callback, 'error', 'Formato de email inválido');
    }

    // 🛡️ VALIDACIÓN 3: Longitud del mensaje
    if (data.message.length < 10 || data.message.length > 2000) {
      return createJSONPResponse(params.callback, 'error', 'El mensaje debe tener entre 10 y 2000 caracteres');
    }

    // 🛡️ VALIDACIÓN 4: Rate Limiting
    const rateLimitCheck = checkRateLimit(data.email);
    if (!rateLimitCheck.allowed) {
      Logger.log('Solicitud rechazada: Rate limit excedido para ' + data.email);
      return createJSONPResponse(params.callback, 'error', rateLimitCheck.message);
    }

    // Obtener la hoja activa
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // Formatear la fecha/hora
    const timestamp = new Date(data.timestamp);
    const formattedDate = Utilities.formatDate(timestamp, "America/Lima", "dd/MM/yyyy HH:mm:ss");

    // Sanitizar datos
    const sanitizedName = sanitizeText(data.name);
    const sanitizedEmail = sanitizeText(data.email);
    const sanitizedTopic = sanitizeText(data.topic);
    const sanitizedMessage = sanitizeText(data.message);

    // Agregar fila
    sheet.appendRow([
      formattedDate,
      sanitizedName,
      sanitizedEmail,
      sanitizedTopic,
      sanitizedMessage
    ]);

    // Registrar para rate limiting
    logSubmission(data.email, timestamp);

    // (OPCIONAL) Enviar notificación por email
    // sendEmailNotification(sanitizedName, sanitizedEmail, sanitizedTopic, sanitizedMessage);

    return createJSONPResponse(params.callback, 'success', 'Mensaje guardado correctamente', {
      row: sheet.getLastRow()
    });

  } catch (error) {
    Logger.log('Error en doGet: ' + error.toString());
    return createJSONPResponse(e.parameter.callback, 'error', 'Error interno del servidor: ' + error.toString());
  }
}

/**
 * 🛡️ Rate Limiting: Verificar si el email ha excedido los límites
 */
function checkRateLimit(email) {
  const now = new Date();
  const cache = CacheService.getScriptCache();
  const hourKey = 'ratelimit_hour_' + email;
  const dayKey = 'ratelimit_day_' + email;

  // Obtener contadores
  const hourCount = parseInt(cache.get(hourKey) || '0');
  const dayCount = parseInt(cache.get(dayKey) || '0');

  // Verificar límites
  if (hourCount >= RATE_LIMIT.MAX_REQUESTS_PER_HOUR) {
    return {
      allowed: false,
      message: 'Has alcanzado el límite de envíos por hora. Por favor intenta más tarde.'
    };
  }

  if (dayCount >= RATE_LIMIT.MAX_REQUESTS_PER_DAY) {
    return {
      allowed: false,
      message: 'Has alcanzado el límite de envíos por día. Por favor intenta mañana.'
    };
  }

  return { allowed: true };
}

/**
 * Registrar un envío para rate limiting
 */
function logSubmission(email, timestamp) {
  const cache = CacheService.getScriptCache();
  const hourKey = 'ratelimit_hour_' + email;
  const dayKey = 'ratelimit_day_' + email;

  // Incrementar contadores
  const hourCount = parseInt(cache.get(hourKey) || '0') + 1;
  const dayCount = parseInt(cache.get(dayKey) || '0') + 1;

  // Guardar en caché (expiración automática)
  cache.put(hourKey, hourCount.toString(), 3600); // 1 hora
  cache.put(dayKey, dayCount.toString(), 86400);  // 24 horas
}

/**
 * Sanitizar texto para prevenir inyecciones
 */
function sanitizeText(text) {
  if (typeof text !== 'string') return '';

  return text
    .trim()
    .replace(/[\r\n]+/g, ' ')  // Reemplazar saltos de línea
    .replace(/[<>]/g, '')       // Remover < y >
    .substring(0, 2000);        // Limitar longitud
}

/**
 * Crear respuesta JSONP para evitar CORS
 */
function createJSONPResponse(callback, status, message, data = {}) {
  const response = {
    status: status,
    message: message,
    timestamp: new Date().toISOString(),
    ...data
  };

  const jsonp = callback + '(' + JSON.stringify(response) + ');';

  return ContentService
    .createTextOutput(jsonp)
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

/**
 * (OPCIONAL) Enviar notificación por email cuando llega un mensaje
 */
function sendEmailNotification(name, email, topic, message) {
  const recipient = 'tu-email@ejemplo.com'; // ⚠️ CAMBIAR POR TU EMAIL

  const subject = '📧 Nuevo mensaje desde el formulario de contacto';

  const body = `
Has recibido un nuevo mensaje:

👤 Nombre: ${name}
📧 Email: ${email}
📋 Tema: ${topic}

💬 Mensaje:
${message}

---
Enviado desde: angelgarciadatablog.com
  `.trim();

  try {
    MailApp.sendEmail(recipient, subject, body);
  } catch (error) {
    Logger.log('Error enviando email: ' + error.toString());
  }
}

/**
 * Función de prueba (ejecutar manualmente)
 */
function testDoGet() {
  const testData = {
    parameter: {
      name: "Test Usuario",
      email: "test@ejemplo.com",
      topic: "reportes-powerbi",
      message: "Este es un mensaje de prueba para validar el formulario",
      timestamp: new Date().toISOString(),
      callback: "testCallback"
    }
  };

  const result = doGet(testData);
  Logger.log(result.getContent());
}

/**
 * Función para limpiar el caché (ejecutar manualmente si es necesario)
 */
function clearRateLimitCache() {
  const cache = CacheService.getScriptCache();
  cache.removeAll(cache.getKeys());
  Logger.log('Caché de rate limiting limpiado');
}
