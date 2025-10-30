// Helper: Convertir duración ISO 8601 a formato legible
function formatDuration(isoDuration) {
  if (!isoDuration) return '';

  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '';

  const hours = parseInt(match[1]) || 0;
  const minutes = parseInt(match[2]) || 0;
  const seconds = parseInt(match[3]) || 0;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

// Helper: Formatear número de vistas
function formatViews(views) {
  if (!views) return '0';
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
  if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
  return views.toString();
}

// Cargar y renderizar los módulos desde el JSON
async function loadCourseData() {
  try {
    const response = await fetch('../../datos/google-analytics-playlist.json');
    if (!response.ok) throw new Error('No se pudo cargar el contenido del curso');

    const data = await response.json();
    renderCourse(data);
  } catch (error) {
    console.error('Error cargando curso:', error);
    showError();
  }
}

// VERSION2: Configuración para paginación
const VIDEOS_PER_PAGE = 5;
const videoState = {}; // Trackear cuántos videos mostrar por módulo

function renderCourse(data) {
  const container = document.getElementById('modules-container');
  const { modulos } = data;

  // Actualizar estadísticas
  document.getElementById('total-modules').textContent = modulos.length;
  const totalVideos = modulos.reduce((sum, mod) => sum + mod.totalVideos, 0);
  document.getElementById('total-videos').textContent = totalVideos;

  // Inicializar estado de videos (mostrar solo los primeros 5 por defecto)
  modulos.forEach(mod => {
    videoState[mod.moduloId] = {
      showing: VIDEOS_PER_PAGE,
      total: mod.videos.length
    };
  });

  // Renderizar módulos
  container.innerHTML = modulos.map((modulo, index) =>
    renderModuleCard(modulo)
  ).join('');
}

function renderModuleCard(modulo) {
  // Extraer solo el primer párrafo de la descripción larga
  let primerParrafo = '';
  if (modulo.descripcionLarga) {
    primerParrafo = modulo.descripcionLarga.split('\n\n')[0].trim();
  }

  return `
    <div class="module-card" data-module-id="${modulo.moduloId}">
      <div class="module-header" onclick="toggleModule(${modulo.moduloId})">
        <div class="module-info">
          <h3 class="module-title">
            <span class="module-number">${modulo.moduloId}</span>
            ${modulo.titulo}
          </h3>
          <p class="module-description">${modulo.descripcion}</p>
          ${primerParrafo ? `<p class="module-description-long">${primerParrafo}</p>` : ''}
          <div class="module-meta">
            <span>${modulo.totalVideos} videos</span>
            <a href="${modulo.playlistUrl}" target="_blank" rel="noopener noreferrer"
               onclick="event.stopPropagation()"
               style="color: var(--accent); text-decoration: none;">
              Ver playlist completa en YouTube →
            </a>
          </div>
        </div>
        <div class="module-toggle">
          <span class="toggle-text">Ver videos</span>
          <svg class="toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </div>
      <div class="module-content" id="module-content-${modulo.moduloId}">
        <!-- El contenido se renderizará dinámicamente al expandir -->
      </div>
    </div>
  `;
}

function renderModuleContent(modulo) {
  const state = videoState[modulo.moduloId];
  const videosToShow = modulo.videos.slice(0, state.showing);
  const hasMore = state.showing < state.total;

  return `
    <div class="videos-grid" id="videos-grid-${modulo.moduloId}">
      ${videosToShow.map(video => renderVideoCard(video, modulo.totalVideos)).join('')}
    </div>
    ${hasMore ? `
      <div style="text-align: center; padding: 1.5rem;">
        <button onclick="loadMoreVideos(${modulo.moduloId})" class="load-more-btn">
          Cargar más videos (${state.total - state.showing} restantes)
        </button>
      </div>
    ` : ''}
  `;
}

function renderVideoCard(video, totalVideos) {
  const duration = formatDuration(video.duracion);
  const views = formatViews(video.vistas);

  return `
    <a href="${video.url}" target="_blank" rel="noopener noreferrer" class="video-card">
      <p class="video-position">${video.posicion + 1}/${totalVideos}</p>
      <div class="video-thumbnail">
        <img src="${video.thumbnail}" alt="${video.titulo}" loading="lazy">
        <div class="play-overlay">
          <svg viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </div>
      </div>
      <div class="video-info">
        <h4 class="video-title">${video.titulo}</h4>
        <div class="video-metadata">
          ${duration ? `<span class="meta-item"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7V7z"/></svg>${duration}</span>` : ''}
          <span class="meta-item"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>${views}</span>
          ${video.likes ? `<span class="meta-item"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/></svg>${video.likes}</span>` : ''}
        </div>
      </div>
    </a>
  `;
}

function loadMoreVideos(moduleId) {
  // Obtener datos del módulo
  fetch('../../datos/google-analytics-playlist.json')
    .then(r => r.json())
    .then(data => {
      const modulo = data.modulos.find(m => m.moduloId === moduleId);
      if (!modulo) return;

      const state = videoState[moduleId];
      const previousShowing = state.showing;

      // Mostrar 5 videos más
      state.showing = Math.min(state.showing + VIDEOS_PER_PAGE, state.total);

      // Obtener los nuevos videos a mostrar
      const newVideos = modulo.videos.slice(previousShowing, state.showing);
      const grid = document.getElementById(`videos-grid-${moduleId}`);

      // Agregar los nuevos videos
      newVideos.forEach(video => {
        const cardHTML = renderVideoCard(video, modulo.totalVideos);
        grid.insertAdjacentHTML('beforeend', cardHTML);
      });

      // Actualizar o remover el botón "Cargar más"
      const card = document.querySelector(`[data-module-id="${moduleId}"]`);
      const loadMoreContainer = card.querySelector('.load-more-btn')?.parentElement;

      if (state.showing >= state.total) {
        // Ya no hay más videos, remover el botón
        if (loadMoreContainer) loadMoreContainer.remove();
      } else {
        // Actualizar el contador
        const btn = card.querySelector('.load-more-btn');
        if (btn) {
          btn.textContent = `Cargar más videos (${state.total - state.showing} restantes)`;
        }
      }
    });
}

function toggleModule(moduleId) {
  const card = document.querySelector(`[data-module-id="${moduleId}"]`);
  if (!card) return;

  const isExpanded = card.classList.contains('expanded');
  const contentContainer = document.getElementById(`module-content-${moduleId}`);

  // Cerrar otros módulos y limpiar su contenido
  document.querySelectorAll('.module-card.expanded').forEach(c => {
    if (c !== card) {
      c.classList.remove('expanded');
      const otherModuleId = c.getAttribute('data-module-id');
      const otherContent = document.getElementById(`module-content-${otherModuleId}`);
      if (otherContent) {
        otherContent.innerHTML = ''; // Limpiar contenido
      }
      const otherToggleText = c.querySelector('.toggle-text');
      if (otherToggleText) {
        otherToggleText.textContent = 'Ver videos';
      }
    }
  });

  // Toggle actual módulo
  if (isExpanded) {
    // Cerrar: remover clase y limpiar contenido
    card.classList.remove('expanded');
    if (contentContainer) {
      contentContainer.innerHTML = '';
    }
  } else {
    // Abrir: agregar clase y renderizar contenido
    card.classList.add('expanded');
    if (contentContainer) {
      // Obtener datos del módulo desde el JSON en memoria
      fetch('../../datos/google-analytics-playlist.json')
        .then(r => r.json())
        .then(data => {
          const modulo = data.modulos.find(m => m.moduloId === moduleId);
          if (modulo) {
            contentContainer.innerHTML = renderModuleContent(modulo);
          }
        });
    }
  }

  // Actualizar texto del módulo actual
  const toggleText = card.querySelector('.toggle-text');
  if (toggleText) {
    toggleText.textContent = card.classList.contains('expanded') ? 'Ocultar videos' : 'Ver videos';
  }
}

function showError() {
  const container = document.getElementById('modules-container');
  container.innerHTML = `
    <div class="error-state">
      <div class="error-icon">⚠️</div>
      <h3 style="margin-bottom: 0.5rem; color: var(--danger);">Error al cargar el curso</h3>
      <p style="color: var(--text-secondary); margin-bottom: 1rem;">
        No se pudo cargar el contenido. Por favor, intenta recargar la página.
      </p>
      <button onclick="location.reload()" style="
        background: var(--gradient);
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 500;
      ">
        Recargar página
      </button>
    </div>
  `;
}

// Menu toggle (del index.html)
const menuToggle = document.querySelector('.menu-toggle');
const menu = document.querySelector('.menu');

if (menuToggle && menu) {
  menuToggle.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });
}

// Cargar datos al iniciar
loadCourseData();
