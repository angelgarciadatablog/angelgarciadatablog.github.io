/**
 * Módulo para renderizar cursos gratuitos desde Google Sheets
 */

// Iconos SVG para diferentes tipos de cursos
const CURSO_ICONS = {
  default: `<svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 3L1 9l11 6 9-4.91V17h2V9M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/>
  </svg>`,
  sql: `<svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 3C7.58 3 4 4.79 4 7s3.58 4 8 4 8-1.79 8-4-3.58-4-8-4M4 9v3c0 2.21 3.58 4 8 4s8-1.79 8-4V9c0 2.21-3.58 4-8 4s-8-1.79-8-4m0 5v3c0 2.21 3.58 4 8 4s8-1.79 8-4v-3c0 2.21-3.58 4-8 4s-8-1.79-8-4z"/>
  </svg>`,
  python: `<svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M14.25.18l.9.2.73.26.59.3.45.32.34.34.25.34.16.33.1.3.04.26.02.2-.01.13V8.5l-.05.63-.13.55-.21.46-.26.38-.3.31-.33.25-.35.19-.35.14-.33.1-.3.07-.26.04-.21.02H8.77l-.69.05-.59.14-.5.22-.41.27-.33.32-.27.35-.2.36-.15.37-.1.35-.07.32-.04.27-.02.21v3.06H3.17l-.21-.03-.28-.07-.32-.12-.35-.18-.36-.26-.36-.36-.35-.46-.32-.59-.28-.73-.21-.88-.14-1.05-.05-1.23.06-1.22.16-1.04.24-.87.32-.71.36-.57.4-.44.42-.33.42-.24.4-.16.36-.1.32-.05.24-.01h.16l.06.01h8.16v-.83H6.18l-.01-2.75-.02-.37.05-.34.11-.31.17-.28.25-.26.31-.23.38-.2.44-.18.51-.15.58-.12.64-.1.71-.06.77-.04.84-.02 1.27.05zm-6.3 1.98l-.23.33-.08.41.08.41.23.34.33.22.41.09.41-.09.33-.22.23-.34.08-.41-.08-.41-.23-.33-.33-.22-.41-.09-.41.09zm13.09 3.95l.28.06.32.12.35.18.36.27.36.35.35.47.32.59.28.73.21.88.14 1.04.05 1.23-.06 1.23-.16 1.04-.24.86-.32.71-.36.57-.4.45-.42.33-.42.24-.4.16-.36.09-.32.05-.24.02-.16-.01h-8.22v.82h5.84l.01 2.76.02.36-.05.34-.11.31-.17.29-.25.25-.31.24-.38.2-.44.17-.51.15-.58.13-.64.09-.71.07-.77.04-.84.01-1.27-.04-1.07-.14-.9-.2-.73-.25-.59-.3-.45-.33-.34-.34-.25-.34-.16-.33-.1-.3-.04-.25-.02-.2.01-.13v-5.34l.05-.64.13-.54.21-.46.26-.38.3-.32.33-.24.35-.2.35-.14.33-.1.3-.06.26-.04.21-.02.13-.01h5.84l.69-.05.59-.14.5-.21.41-.28.33-.32.27-.35.2-.36.15-.36.1-.35.07-.32.04-.28.02-.21V6.07h2.09l.14.01zm-6.47 14.25l-.23.33-.08.41.08.41.23.33.33.23.41.08.41-.08.33-.23.23-.33.08-.41-.08-.41-.23-.33-.33-.23-.41-.08-.41.08z"/>
  </svg>`,
  powerbi: `<svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M10 2v20H8V2h2m6 4v16h-2V6h2m6 6v10h-2V12h2M4 14v8H2v-8h2z"/>
  </svg>`,
  code: `<svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
  </svg>`
};

/**
 * Selecciona el icono apropiado según el nombre del curso
 * @param {string} nombreCurso - Nombre del curso
 * @returns {string} SVG del icono
 */
function getIconForCurso(nombreCurso) {
  const nombre = nombreCurso.toLowerCase();

  if (nombre.includes('sql')) return CURSO_ICONS.sql;
  if (nombre.includes('python')) return CURSO_ICONS.python;
  if (nombre.includes('power bi') || nombre.includes('powerbi')) return CURSO_ICONS.powerbi;
  if (nombre.includes('programación') || nombre.includes('codigo')) return CURSO_ICONS.code;

  return CURSO_ICONS.default;
}

/**
 * Renderiza una tarjeta de curso
 * @param {Object} curso - Datos del curso
 * @returns {HTMLElement} Tarjeta de curso
 */
function renderCursoCard(curso) {
  const card = document.createElement('div');
  card.className = 'curso-card';

  const icon = getIconForCurso(curso['nombre-curso'] || '');

  card.innerHTML = `
    <div class="curso-header">
      <div class="curso-left">
        <div class="curso-icon">
          ${icon}
        </div>
        <h3 class="curso-nombre">${curso['nombre-curso'] || 'Sin nombre'}</h3>
      </div>
      <div class="curso-meta">
        ${curso.horas || '0'}h | ${curso.capitulos || '0'} capítulos
      </div>
    </div>

    <p class="curso-descripcion">
      ${curso['descripcion-corta'] || 'Sin descripción disponible'}
    </p>

    <div class="curso-footer">
      <a href="#" class="curso-btn">Empezar curso</a>
      <span class="curso-nivel">${curso.nivel || 'N/A'}</span>
    </div>
  `;

  return card;
}

/**
 * Carga y renderiza los cursos desde Google Sheets
 */
async function loadCursos() {
  const container = document.getElementById('cursos-grid');
  if (!container) {
    console.warn('⚠️ Contenedor #cursos-grid no encontrado');
    return;
  }

  try {
    console.log('📚 Cargando cursos gratuitos desde Google Sheets...');

    // Obtener datos de Google Sheets
    const cursos = await GoogleSheets.getCursosGratuitos();

    if (!cursos || cursos.length === 0) {
      console.warn('⚠️ No se encontraron cursos');
      container.innerHTML = `
        <div class="curso-card">
          <p style="text-align: center; color: var(--text-secondary);">
            No hay cursos disponibles en este momento.
          </p>
        </div>
      `;
      return;
    }

    // Limpiar skeleton loaders
    container.innerHTML = '';

    // Renderizar cada curso
    cursos.forEach(curso => {
      const card = renderCursoCard(curso);
      container.appendChild(card);
    });

    console.log(`✅ ${cursos.length} cursos cargados correctamente`);

  } catch (error) {
    console.error('❌ Error al cargar cursos:', error);
    container.innerHTML = `
      <div class="curso-card">
        <p style="text-align: center; color: var(--text-secondary);">
          Error al cargar los cursos. Por favor, recarga la página.
        </p>
      </div>
    `;
  }
}

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('📚 DOMContentLoaded - iniciando carga de cursos...');
    // Verificar que GoogleSheets esté disponible
    if (window.GoogleSheets) {
      console.log('✅ GoogleSheets API disponible');
      loadCursos();
    } else {
      console.warn('⚠️ GoogleSheets API no disponible aún, esperando...');
      setTimeout(loadCursos, 500);
    }
  });
} else {
  // DOM ya está listo
  console.log('📚 DOM ya listo - iniciando carga de cursos...');
  if (window.GoogleSheets) {
    console.log('✅ GoogleSheets API disponible');
    loadCursos();
  } else {
    console.warn('⚠️ GoogleSheets API no disponible aún, esperando...');
    setTimeout(loadCursos, 500);
  }
}

// Exportar para uso manual si es necesario
window.loadCursos = loadCursos;
