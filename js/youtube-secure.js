/**
 * YouTube Videos Integration - Versión Optimizada con JSON Estático
 * Lee videos desde un archivo JSON pre-generado para optimizar el rendimiento
 * El JSON se actualiza manualmente desde el panel admin cuando sea necesario
 */

const YOUTUBE_SECURE_CONFIG = {
  // Ruta del archivo JSON estático
  jsonDataPath: 'datos/videos-recientes.json',

  // Configuración de reintentos
  retry: {
    maxAttempts: 2,
    delayMs: 500
  }
};

/**
 * Obtiene los videos desde el archivo JSON estático
 * @returns {Promise<Array>} Array con los videos
 */
async function fetchYouTubeVideosSecure() {
  let lastError = null;

  // Intentar con reintentos (por si hay problemas de red)
  for (let attempt = 1; attempt <= YOUTUBE_SECURE_CONFIG.retry.maxAttempts; attempt++) {
    try {
      console.log(`🎥 Cargando videos desde JSON estático...`);

      const response = await fetch(YOUTUBE_SECURE_CONFIG.jsonDataPath);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      // Validar estructura del JSON
      if (!result.videos || !Array.isArray(result.videos)) {
        throw new Error('Formato de JSON inválido');
      }

      // Transformar datos al formato esperado por el frontend
      const videos = result.videos.map(video => ({
        id: video.id,
        title: video.title,
        url: video.url || `https://www.youtube.com/watch?v=${video.id}`,
        thumbnail: video.thumbnail,
        publishedAt: new Date(video.publishedAt),
        description: video.description || ''
      }));

      console.log(`✅ ${videos.length} videos cargados desde JSON estático`);
      console.log(`📅 Última actualización: ${new Date(result.fechaActualizacion).toLocaleString('es-ES')}`);
      return videos;

    } catch (error) {
      console.error(`❌ Error cargando JSON (intento ${attempt}):`, error.message);
      lastError = error;

      // Si no es el último intento, esperar antes de reintentar
      if (attempt < YOUTUBE_SECURE_CONFIG.retry.maxAttempts) {
        const delay = YOUTUBE_SECURE_CONFIG.retry.delayMs;
        console.log(`⏳ Reintentando en ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // Si todos los intentos fallaron, usar placeholders
  console.error('❌ No se pudo cargar videos-recientes.json:', lastError);
  console.log('💡 Usa el panel admin.html para generar el archivo videos-recientes.json');
  return getPlaceholderVideos();
}

/**
 * Retorna videos placeholder cuando falla la carga
 * @returns {Array} Videos placeholder
 */
function getPlaceholderVideos() {
  console.log('📦 Usando videos placeholder');
  return [
    {
      id: 'placeholder-1',
      title: 'Visita mi canal de YouTube para ver los últimos videos',
      url: 'https://www.youtube.com/@angelgarciadatablog/videos',
      thumbnail: 'https://via.placeholder.com/480x360/1a1a1a/7c3aed?text=Ver+Canal',
      publishedAt: new Date()
    },
    {
      id: 'placeholder-2',
      title: 'Contenido sobre Análisis de Datos y Programación',
      url: 'https://www.youtube.com/@angelgarciadatablog/videos',
      thumbnail: 'https://via.placeholder.com/480x360/1a1a1a/2674ed?text=YouTube',
      publishedAt: new Date()
    },
    {
      id: 'placeholder-3',
      title: 'Tutoriales de SQL, Power BI, Python y más',
      url: 'https://www.youtube.com/@angelgarciadatablog/videos',
      thumbnail: 'https://via.placeholder.com/480x360/1a1a1a/ec4899?text=Suscríbete',
      publishedAt: new Date()
    }
  ];
}

/**
 * Renderiza los videos en el DOM
 * @param {Array} videos - Array de videos
 */
function renderYouTubeVideos(videos) {
  const container = document.getElementById('youtube-videos');
  if (!container) {
    console.warn('⚠️ Contenedor #youtube-videos no encontrado');
    return;
  }

  // Limpiar contenedor
  container.innerHTML = '';

  // Si no hay videos, mostrar mensaje
  if (videos.length === 0) {
    container.innerHTML = `
      <div class="video-card">
        <p class="video-preview">No se pudieron cargar los videos. Visita el canal directamente.</p>
        <a href="https://www.youtube.com/@angelgarciadatablog" class="video-link" target="_blank" rel="noopener noreferrer">
          Ver Canal →
        </a>
      </div>
    `;
    return;
  }

  // Crear tarjetas de video
  videos.forEach(video => {
    const card = document.createElement('a');
    card.className = 'video-card';
    card.href = video.url;
    card.target = '_blank';
    card.rel = 'noopener noreferrer';

    card.innerHTML = `
      <div class="video-thumbnail">
        <img src="${video.thumbnail}" alt="${video.title}" loading="lazy">
        <div class="video-play-icon">
          <svg viewBox="0 0 24 24" fill="currentColor" width="48" height="48">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </div>
      </div>
      <div class="video-info">
        <h3 class="video-title">${video.title}</h3>
        <p class="video-date">${formatDate(video.publishedAt)}</p>
      </div>
    `;

    container.appendChild(card);
  });

  // Actualizar indicadores de scroll
  updateVideoScrollIndicators(videos.length);
}

/**
 * Formatea la fecha de publicación
 * @param {Date} date - Fecha a formatear
 * @returns {string} Fecha formateada
 */
function formatDate(date) {
  if (!(date instanceof Date) || isNaN(date)) {
    return 'Reciente';
  }

  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Hace 1 día';
  if (diffDays < 7) return `Hace ${diffDays} días`;
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
  if (diffDays < 365) return `Hace ${Math.floor(diffDays / 30)} meses`;
  return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
}

/**
 * Actualiza los indicadores de scroll
 * @param {number} count - Número de videos
 */
function updateVideoScrollIndicators(count) {
  const indicatorsContainer = document.getElementById('videos-indicators');
  if (!indicatorsContainer) return;

  indicatorsContainer.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const dot = document.createElement('span');
    dot.className = `scroll-dot ${i === 0 ? 'active' : ''}`;
    indicatorsContainer.appendChild(dot);
  }
}

/**
 * Inicializa la carga de videos de YouTube
 */
async function initYouTubeVideos() {
  console.log('🚀 Inicializando carga segura de videos de YouTube...');
  const videos = await fetchYouTubeVideosSecure();
  renderYouTubeVideos(videos);
}

// Exportar para uso global
window.YouTubeVideos = {
  init: initYouTubeVideos,
  fetch: fetchYouTubeVideosSecure,
  config: YOUTUBE_SECURE_CONFIG
};

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initYouTubeVideos);
} else {
  initYouTubeVideos();
}
