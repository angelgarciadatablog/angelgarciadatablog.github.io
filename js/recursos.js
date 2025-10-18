/**
 * Módulo para cargar y renderizar recursos de Notion
 * Lee datos de la pestaña "recursos-notion" del Google Sheet
 */

/**
 * Carga y renderiza los recursos de Notion
 */
async function loadRecursos() {
  try {
    console.log('🎨 Cargando recursos de Notion...');

    // Obtener datos desde Google Sheets
    const recursos = await GoogleSheets.getRecursosNotion();

    console.log(`📦 ${recursos.length} recursos obtenidos`);

    if (recursos.length === 0) {
      console.warn('⚠️ No se encontraron recursos');
      renderEmptyState();
      return;
    }

    // Renderizar recursos
    renderRecursos(recursos);

  } catch (error) {
    console.error('❌ Error cargando recursos:', error);
    renderErrorState();
  }
}

/**
 * Renderiza la lista de recursos
 */
function renderRecursos(recursos) {
  const grid = document.getElementById('recursos-grid');
  if (!grid) {
    console.error('❌ Elemento recursos-grid no encontrado');
    return;
  }

  // Limpiar skeletons
  grid.innerHTML = '';

  // Renderizar cada recurso
  recursos.forEach(recurso => {
    const card = createRecursoCard(recurso);
    grid.appendChild(card);
  });

  console.log('✅ Recursos renderizados');
}

/**
 * Crea una tarjeta de recurso
 */
function createRecursoCard(recurso) {
  const card = document.createElement('a');
  card.className = 'recurso-card';
  card.href = recurso.link || '#';
  card.target = '_blank';
  card.rel = 'noopener noreferrer';

  card.innerHTML = `
    <span class="recurso-nombre">${recurso['nombre-recurso'] || 'Recurso sin nombre'}</span>
  `;

  return card;
}

/**
 * Renderiza estado vacío
 */
function renderEmptyState() {
  const grid = document.getElementById('recursos-grid');
  if (!grid) return;

  grid.innerHTML = `
    <div class="empty-state">
      <p>No hay recursos disponibles en este momento.</p>
    </div>
  `;
}

/**
 * Renderiza estado de error
 */
function renderErrorState() {
  const grid = document.getElementById('recursos-grid');
  if (!grid) return;

  grid.innerHTML = `
    <div class="error-state">
      <p>Error al cargar recursos. Por favor, intenta más tarde.</p>
    </div>
  `;
}

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('🎨 DOMContentLoaded - iniciando carga de recursos...');
    if (window.GoogleSheets) {
      console.log('✅ GoogleSheets API disponible');
      loadRecursos();
    } else {
      console.warn('⚠️ GoogleSheets API no disponible aún, esperando...');
      setTimeout(loadRecursos, 500);
    }
  });
} else {
  // DOM ya está listo
  console.log('🎨 DOM ya listo - iniciando carga de recursos...');
  if (window.GoogleSheets) {
    console.log('✅ GoogleSheets API disponible');
    loadRecursos();
  } else {
    console.warn('⚠️ GoogleSheets API no disponible aún, esperando...');
    setTimeout(loadRecursos, 500);
  }
}

// Exportar para uso manual si es necesario
window.loadRecursos = loadRecursos;
