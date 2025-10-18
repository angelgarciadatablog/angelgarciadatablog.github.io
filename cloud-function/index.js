/**
 * Cloud Function para obtener videos de YouTube de forma segura
 * Con múltiples capas de protección y límites
 */

const fetch = require('node-fetch');

// ===== CONFIGURACIÓN DE LÍMITES =====
const CONFIG = {
  // Dominios permitidos (CORS)
  allowedOrigins: [
    'https://tudominio.com',
    'https://www.tudominio.com',
    'http://localhost:3000', // Para desarrollo local
    'http://localhost:5500'  // Para Live Server
  ],

  // Rate limiting: máximo de requests por IP
  rateLimit: {
    maxRequests: 10,      // Máximo 10 requests
    windowMs: 60 * 1000   // Por cada 60 segundos (1 minuto)
  },

  // Caché para reducir llamadas a YouTube API
  cache: {
    duration: 5 * 60 * 1000,  // 5 minutos en milisegundos
    enabled: true
  },

  // YouTube config
  youtube: {
    channelUsername: '@angelgarciadatablog',
    maxVideos: 3,
    timeout: 5000  // 5 segundos timeout
  }
};

// ===== SISTEMA DE CACHÉ EN MEMORIA =====
let videoCache = {
  data: null,
  timestamp: null
};

// ===== RATE LIMITING EN MEMORIA =====
// NOTA: En producción, usar Redis o Firestore para persistencia
const rateLimitStore = new Map();

/**
 * Verifica rate limiting por IP
 */
function checkRateLimit(ip) {
  const now = Date.now();
  const userRequests = rateLimitStore.get(ip) || [];

  // Limpiar requests antiguos fuera de la ventana de tiempo
  const recentRequests = userRequests.filter(
    timestamp => now - timestamp < CONFIG.rateLimit.windowMs
  );

  // Verificar si excede el límite
  if (recentRequests.length >= CONFIG.rateLimit.maxRequests) {
    return {
      allowed: false,
      retryAfter: Math.ceil((recentRequests[0] + CONFIG.rateLimit.windowMs - now) / 1000)
    };
  }

  // Agregar nueva request
  recentRequests.push(now);
  rateLimitStore.set(ip, recentRequests);

  return { allowed: true };
}

/**
 * Verifica si el caché es válido
 */
function isCacheValid() {
  if (!CONFIG.cache.enabled || !videoCache.data || !videoCache.timestamp) {
    return false;
  }

  const now = Date.now();
  return (now - videoCache.timestamp) < CONFIG.cache.duration;
}

/**
 * Obtiene el Channel ID de YouTube
 */
async function getChannelId(apiKey) {
  const username = CONFIG.youtube.channelUsername.replace('@', '');

  // Primero intentar con forHandle (nuevo método)
  let url = `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${username}&key=${apiKey}`;

  let response = await fetch(url, {
    timeout: CONFIG.youtube.timeout
  });
  let data = await response.json();

  if (data.items && data.items.length > 0) {
    return data.items[0].id;
  }

  // Fallback: intentar con forUsername
  url = `https://www.googleapis.com/youtube/v3/channels?part=id&forUsername=${username}&key=${apiKey}`;
  response = await fetch(url, {
    timeout: CONFIG.youtube.timeout
  });
  data = await response.json();

  if (data.items && data.items.length > 0) {
    return data.items[0].id;
  }

  throw new Error('Channel not found');
}

/**
 * Obtiene videos de YouTube
 */
async function fetchYouTubeVideos(apiKey, channelId) {
  const url = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&channelId=${channelId}&part=snippet&order=date&type=video&maxResults=${CONFIG.youtube.maxVideos}`;

  const response = await fetch(url, {
    timeout: CONFIG.youtube.timeout
  });

  if (!response.ok) {
    throw new Error(`YouTube API error: ${response.status}`);
  }

  const data = await response.json();

  // Formatear datos para el frontend
  return data.items.map(item => ({
    id: item.id.videoId,
    title: item.snippet.title,
    thumbnail: item.snippet.thumbnails.high.url,
    publishedAt: item.snippet.publishedAt,
    description: item.snippet.description
  }));
}

/**
 * Cloud Function principal
 */
exports.getYouTubeVideos = async (req, res) => {
  try {
    // ===== 1. VALIDAR MÉTODO HTTP =====
    if (req.method === 'OPTIONS') {
      // Manejar preflight CORS
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Access-Control-Allow-Methods', 'GET');
      res.set('Access-Control-Allow-Headers', 'Content-Type');
      res.set('Access-Control-Max-Age', '3600');
      return res.status(204).send('');
    }

    if (req.method !== 'GET') {
      return res.status(405).json({
        error: 'Method not allowed',
        message: 'Only GET requests are supported'
      });
    }

    // ===== 2. VALIDAR ORIGEN (CORS) =====
    const origin = req.headers.origin;
    const isAllowedOrigin = CONFIG.allowedOrigins.includes(origin);

    if (isAllowedOrigin) {
      res.set('Access-Control-Allow-Origin', origin);
    } else {
      // En desarrollo, permitir cualquier origen local
      if (origin && origin.includes('localhost')) {
        res.set('Access-Control-Allow-Origin', origin);
      } else {
        console.warn(`Blocked request from unauthorized origin: ${origin}`);
        // Continuar pero registrar el intento
      }
    }

    // ===== 3. RATE LIMITING =====
    const clientIp = req.headers['x-forwarded-for'] ||
                     req.connection.remoteAddress ||
                     'unknown';

    const rateLimitResult = checkRateLimit(clientIp);

    if (!rateLimitResult.allowed) {
      res.set('Retry-After', rateLimitResult.retryAfter);
      return res.status(429).json({
        error: 'Too many requests',
        message: `Rate limit exceeded. Try again in ${rateLimitResult.retryAfter} seconds.`,
        retryAfter: rateLimitResult.retryAfter
      });
    }

    // ===== 4. VERIFICAR CACHÉ =====
    if (isCacheValid()) {
      console.log('Returning cached data');
      return res.status(200).json({
        success: true,
        data: videoCache.data,
        cached: true,
        cacheAge: Math.floor((Date.now() - videoCache.timestamp) / 1000)
      });
    }

    // ===== 5. OBTENER API KEY DE VARIABLES DE ENTORNO =====
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
      console.error('YOUTUBE_API_KEY not configured');
      return res.status(500).json({
        error: 'Server configuration error',
        message: 'YouTube API key not configured'
      });
    }

    // ===== 6. LLAMAR A YOUTUBE API =====
    console.log('Fetching fresh data from YouTube API');

    const channelId = await getChannelId(apiKey);
    const videos = await fetchYouTubeVideos(apiKey, channelId);

    // ===== 7. GUARDAR EN CACHÉ =====
    videoCache = {
      data: videos,
      timestamp: Date.now()
    };

    // ===== 8. RETORNAR RESPUESTA =====
    return res.status(200).json({
      success: true,
      data: videos,
      cached: false,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in getYouTubeVideos:', error);

    // No exponer detalles internos en producción
    const isDevelopment = process.env.NODE_ENV !== 'production';

    return res.status(500).json({
      error: 'Internal server error',
      message: isDevelopment ? error.message : 'Failed to fetch YouTube videos',
      ...(isDevelopment && { stack: error.stack })
    });
  }
};
