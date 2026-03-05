/**
 * YouTube Videos Integration
 * Lee videos desde Google Cloud Storage (actualización diaria automática)
 */

const YOUTUBE_SECURE_CONFIG = {
  jsonDataUrl: 'https://storage.googleapis.com/angelgarciadatablog-analytics/daily/latest_videos_current.json',
  maxVideos: 5,
  retry: {
    maxAttempts: 2,
    delayMs: 500
  }
};

/**
 * Obtiene los videos desde el JSON en Cloud Storage
 */
async function fetchYouTubeVideosSecure() {
  let lastError = null;

  for (let attempt = 1; attempt <= YOUTUBE_SECURE_CONFIG.retry.maxAttempts; attempt++) {
    try {
      console.log('Cargando videos desde Cloud Storage...');

      const response = await fetch(YOUTUBE_SECURE_CONFIG.jsonDataUrl);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!Array.isArray(result) || result.length === 0) {
        throw new Error('Formato de JSON invalido o vacio');
      }

      const videos = result.slice(0, YOUTUBE_SECURE_CONFIG.maxVideos).map(video => ({
        id: video.video_id,
        title: video.title,
        url: video.video_url,
        thumbnail: video.thumbnail_url,
        publishedAt: new Date(video.published_at),
        viewCount: video.view_count || 0,
        likeCount: video.like_count || 0,
        commentCount: video.comment_count || 0
      }));

      console.log(`${videos.length} videos cargados`);
      return videos;

    } catch (error) {
      console.error(`Error cargando videos (intento ${attempt}):`, error.message);
      lastError = error;

      if (attempt < YOUTUBE_SECURE_CONFIG.retry.maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, YOUTUBE_SECURE_CONFIG.retry.delayMs));
      }
    }
  }

  console.error('No se pudo cargar videos:', lastError);
  return getPlaceholderVideos();
}

/**
 * Formatea numeros grandes (1200 -> 1.2K, 1500000 -> 1.5M)
 */
function formatNumber(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace('.0', '') + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'K';
  return n.toString();
}

/**
 * Retorna videos placeholder cuando falla la carga
 */
function getPlaceholderVideos() {
  return [
    {
      id: 'placeholder-1',
      title: 'Visita mi canal de YouTube para ver los ultimos videos',
      url: 'https://www.youtube.com/@angelgarciadatablog/videos',
      thumbnail: 'https://via.placeholder.com/480x360/1a1a1a/7c3aed?text=Ver+Canal',
      publishedAt: new Date(),
      viewCount: 0, likeCount: 0, commentCount: 0
    },
    {
      id: 'placeholder-2',
      title: 'Contenido sobre Analisis de Datos y Programacion',
      url: 'https://www.youtube.com/@angelgarciadatablog/videos',
      thumbnail: 'https://via.placeholder.com/480x360/1a1a1a/2674ed?text=YouTube',
      publishedAt: new Date(),
      viewCount: 0, likeCount: 0, commentCount: 0
    },
    {
      id: 'placeholder-3',
      title: 'Tutoriales de SQL, Power BI, Python y mas',
      url: 'https://www.youtube.com/@angelgarciadatablog/videos',
      thumbnail: 'https://via.placeholder.com/480x360/1a1a1a/ec4899?text=Suscribete',
      publishedAt: new Date(),
      viewCount: 0, likeCount: 0, commentCount: 0
    }
  ];
}

/**
 * Renderiza los videos en el DOM
 */
function renderYouTubeVideos(videos) {
  const container = document.getElementById('youtube-videos');
  if (!container) return;

  container.innerHTML = '';

  if (videos.length === 0) {
    container.innerHTML = `
      <div class="video-card">
        <p>No se pudieron cargar los videos.</p>
        <a href="https://www.youtube.com/@angelgarciadatablog" target="_blank" rel="noopener noreferrer">Ver Canal</a>
      </div>
    `;
    return;
  }

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
        <div class="video-stats">
          <span class="video-stat">
            <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
            ${formatNumber(video.viewCount)}
          </span>
          <span class="video-stat">
            <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/></svg>
            ${formatNumber(video.likeCount)}
          </span>
          <span class="video-stat">
            <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18z"/></svg>
            ${formatNumber(video.commentCount)}
          </span>
        </div>
      </div>
    `;

    container.appendChild(card);
  });

  updateVideoScrollIndicators(videos.length);
}

/**
 * Formatea la fecha de publicacion
 */
function formatDate(date) {
  if (!(date instanceof Date) || isNaN(date)) return 'Reciente';

  const now = new Date();
  const diffDays = Math.ceil(Math.abs(now - date) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Hace 1 dia';
  if (diffDays < 7) return `Hace ${diffDays} dias`;
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
  if (diffDays < 365) return `Hace ${Math.floor(diffDays / 30)} meses`;
  return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
}

/**
 * Actualiza los indicadores de scroll
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

async function initYouTubeVideos() {
  const videos = await fetchYouTubeVideosSecure();
  renderYouTubeVideos(videos);
}

window.YouTubeVideos = {
  init: initYouTubeVideos,
  fetch: fetchYouTubeVideosSecure,
  config: YOUTUBE_SECURE_CONFIG
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initYouTubeVideos);
} else {
  initYouTubeVideos();
}
