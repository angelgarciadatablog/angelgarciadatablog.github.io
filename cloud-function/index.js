/**
 * Cloud Function para obtener videos de YouTube de forma segura
 * Con múltiples capas de protección y límites
 */

const fetch = require('node-fetch');

// ===== CONFIGURACIÓN DE LÍMITES =====
const CONFIG = {
  // Dominios permitidos (CORS)
  allowedOrigins: [
    'https://angelgarciadatablog.github.io',
    'https://angelgarciadatablog.com',
    'https://www.angelgarciadatablog.com',
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
    duration: 12 * 60 * 60 * 1000,  // 12 horas en milisegundos (optimizado)
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
 * Obtiene videos de YouTube (canal o playlist)
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
 * Obtiene información de una playlist (título, descripción)
 */
async function fetchPlaylistInfo(apiKey, playlistId) {
  const url = `https://www.googleapis.com/youtube/v3/playlists?key=${apiKey}&id=${playlistId}&part=snippet`;

  const response = await fetch(url, {
    timeout: CONFIG.youtube.timeout
  });

  if (!response.ok) {
    throw new Error(`YouTube API error: ${response.status}`);
  }

  const data = await response.json();

  if (!data.items || data.items.length === 0) {
    throw new Error('Playlist not found');
  }

  const playlist = data.items[0];
  return {
    title: playlist.snippet.title,
    description: playlist.snippet.description,
    channelTitle: playlist.snippet.channelTitle
  };
}

/**
 * Obtiene videos de una playlist específica
 */
async function fetchPlaylistVideos(apiKey, playlistId, maxResults = 50) {
  const url = `https://www.googleapis.com/youtube/v3/playlistItems?key=${apiKey}&playlistId=${playlistId}&part=snippet&maxResults=${maxResults}`;

  const response = await fetch(url, {
    timeout: CONFIG.youtube.timeout * 2 // Doble timeout para playlists grandes
  });

  if (!response.ok) {
    throw new Error(`YouTube API error: ${response.status}`);
  }

  const data = await response.json();

  // Formatear datos para el frontend
  return data.items.map(item => ({
    id: item.snippet.resourceId.videoId,
    title: item.snippet.title,
    thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
    publishedAt: item.snippet.publishedAt,
    description: item.snippet.description,
    position: item.snippet.position
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
      if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
        res.set('Access-Control-Allow-Origin', origin);
      } else {
        console.warn(`Blocked request from unauthorized origin: ${origin}`);
        // Continuar pero registrar el intento
      }
    }

    // Siempre configurar headers CORS adicionales
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

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

    // ===== 4. OBTENER PARÁMETROS =====
    const playlistId = req.query.playlistId;
    const maxResults = parseInt(req.query.maxResults) || 50;

    // Generar clave de caché única por playlist
    const cacheKey = playlistId ? `playlist_${playlistId}` : 'channel_default';

    // ===== 5. VERIFICAR CACHÉ =====
    if (isCacheValid() && videoCache.cacheKey === cacheKey) {
      console.log('Returning cached data for:', cacheKey);
      const cachedData = videoCache.data;
      return res.status(200).json({
        success: true,
        data: cachedData.videos || cachedData,
        ...(cachedData.playlistInfo && { playlistInfo: cachedData.playlistInfo }),
        cached: true,
        cacheAge: Math.floor((Date.now() - videoCache.timestamp) / 1000),
        totalVideos: (cachedData.videos || cachedData).length
      });
    }

    // ===== 6. OBTENER API KEY DE VARIABLES DE ENTORNO =====
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
      console.error('YOUTUBE_API_KEY not configured');
      return res.status(500).json({
        error: 'Server configuration error',
        message: 'YouTube API key not configured'
      });
    }

    // ===== 7. LLAMAR A YOUTUBE API =====
    let videos;
    let playlistInfo = null;

    if (playlistId) {
      console.log(`Fetching playlist data: ${playlistId}`);
      playlistInfo = await fetchPlaylistInfo(apiKey, playlistId);
      videos = await fetchPlaylistVideos(apiKey, playlistId, maxResults);
    } else {
      console.log('Fetching channel videos');
      const channelId = await getChannelId(apiKey);
      videos = await fetchYouTubeVideos(apiKey, channelId);
    }

    // ===== 8. PREPARAR RESPUESTA =====
    const responseData = playlistId ? {
      videos: videos,
      playlistInfo: playlistInfo
    } : videos;

    // ===== 9. GUARDAR EN CACHÉ =====
    videoCache = {
      data: responseData,
      timestamp: Date.now(),
      cacheKey: cacheKey
    };

    // ===== 10. RETORNAR RESPUESTA =====
    return res.status(200).json({
      success: true,
      data: playlistId ? responseData.videos : responseData,
      ...(playlistId && { playlistInfo: responseData.playlistInfo }),
      cached: false,
      timestamp: new Date().toISOString(),
      playlistId: playlistId || null,
      totalVideos: videos.length
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
