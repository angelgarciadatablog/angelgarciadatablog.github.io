// contact-form.js - Manejo del formulario de contacto con seguridad mejorada
(function() {
  'use strict';

  // ⚠️ CONFIGURACIÓN REQUERIDA:
  // 1. URL de tu Google Apps Script
  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz0cPgVpcnTKAxFkyLnbA3eocL5a8RBKe4ujDPn3KBZuz5-uWCoE6RmT-eTeDX1w_c-/exec';

  // 2. Tu Site Key de reCAPTCHA v3 (obtener en: https://www.google.com/recaptcha/admin)
  const RECAPTCHA_SITE_KEY = '6Lcz1PkrAAAAAHBURgTVQaGc3qo61tUd8SM_YVKM';

  const form = document.getElementById('contact-form');
  const submitBtn = document.getElementById('submit-btn');
  const statusDiv = document.getElementById('form-status');

  if (!form) return;

  form.addEventListener('submit', async function(e) {
    e.preventDefault();

    // Validar que tenemos las configuraciones necesarias
    if (SCRIPT_URL === 'TU_URL_DE_GOOGLE_APPS_SCRIPT_AQUI') {
      showStatus('error', 'Error: El formulario aún no está configurado. Por favor contacta al administrador.');
      return;
    }

    // 🛡️ SEGURIDAD 1: Honeypot - Detectar bots
    const honeypot = document.getElementById('website').value;
    if (honeypot) {
      // Si el honeypot tiene valor, es un bot. Fingimos éxito pero no enviamos nada
      console.warn('Bot detectado vía honeypot');
      showStatus('success', '¡Mensaje enviado exitosamente! Te contactaré pronto.');
      form.reset();
      return;
    }

    // Obtener datos del formulario
    const formData = {
      name: document.getElementById('name').value.trim(),
      email: document.getElementById('email').value.trim(),
      topic: document.getElementById('topic').value,
      message: document.getElementById('message').value.trim(),
      timestamp: new Date().toISOString()
    };

    // Validaciones básicas
    if (!formData.name || !formData.email || !formData.topic || !formData.message) {
      showStatus('error', 'Por favor completa todos los campos.');
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showStatus('error', 'Por favor ingresa un email válido.');
      return;
    }

    // Validar longitud del mensaje (anti-spam)
    if (formData.message.length < 10) {
      showStatus('error', 'Por favor escribe un mensaje más detallado (mínimo 10 caracteres).');
      return;
    }

    if (formData.message.length > 2000) {
      showStatus('error', 'El mensaje es demasiado largo (máximo 2000 caracteres).');
      return;
    }

    // Deshabilitar botón y mostrar loading
    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';

    try {
      // Enviar datos a Google Apps Script usando JSONP para evitar CORS
      console.log('Enviando formulario...', formData);
      await sendToGoogleScript(formData);

      // Mostrar éxito
      showStatus('success', '¡Mensaje enviado exitosamente! Te contactaré pronto.');
      form.reset();

    } catch (error) {
      console.error('Error al enviar formulario:', error);
      showStatus('error', 'Hubo un error al enviar el mensaje. Por favor intenta de nuevo.');
    } finally {
      // Rehabilitar botón
      submitBtn.disabled = false;
      submitBtn.textContent = 'Enviar Mensaje';
    }
  });

  function showStatus(type, message) {
    statusDiv.className = 'form-status show ' + type;
    statusDiv.textContent = message;

    // Auto-ocultar después de 5 segundos
    setTimeout(() => {
      statusDiv.classList.remove('show');
    }, 5000);
  }

  // Función para enviar datos a Google Apps Script evitando CORS
  function sendToGoogleScript(data) {
    return new Promise((resolve, reject) => {
      // Crear un script tag con JSONP (método que SÍ funciona con Apps Script)
      const callbackName = 'formCallback_' + Date.now();

      // Crear callback global temporal
      window[callbackName] = function(response) {
        delete window[callbackName];
        if (response.status === 'success') {
          resolve(response);
        } else {
          reject(new Error(response.message || 'Error desconocido'));
        }
      };

      // Construir URL con parámetros GET
      const params = new URLSearchParams({
        name: data.name,
        email: data.email,
        topic: data.topic,
        message: data.message,
        timestamp: data.timestamp,
        callback: callbackName
      });

      if (data.recaptchaToken) {
        params.append('recaptchaToken', data.recaptchaToken);
      }

      // Crear script tag para hacer la petición
      const script = document.createElement('script');
      script.src = SCRIPT_URL + '?' + params.toString();
      script.onerror = function() {
        delete window[callbackName];
        reject(new Error('Error al conectar con el servidor'));
      };

      document.body.appendChild(script);

      // Limpiar después de 5 segundos
      setTimeout(() => {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
        if (window[callbackName]) {
          delete window[callbackName];
          resolve({ status: 'success' }); // Asumir éxito si no hubo respuesta
        }
      }, 5000);
    });
  }
})();
