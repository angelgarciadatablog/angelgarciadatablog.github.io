/**
 * Portafolio Preview
 * Muestra los últimos 3 proyectos del Google Sheet en el home
 */

function parseFechaPortafolio(str) {
  if (!str) return null;
  const m = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
  if (/^\d{4}-\d{2}/.test(str)) {
    const p = str.split('-');
    return new Date(+p[0], +p[1] - 1, +p[2] || 1);
  }
  return null;
}

function formatFechaPortafolio(fechaStr) {
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const d = parseFechaPortafolio(fechaStr);
  if (!d) return fechaStr || '';
  return meses[d.getMonth()] + ' ' + d.getFullYear();
}

async function loadPortafolioPreview() {
  const grid = document.getElementById('portafolio-preview-grid');
  if (!grid) return;

  try {
    const proyectos = await GoogleSheets.getPortafolio();

    if (!proyectos || proyectos.length === 0) {
      grid.innerHTML = '<p style="color:var(--text-secondary);text-align:center;padding:2rem 0;">No hay proyectos disponibles aún.</p>';
      return;
    }

    // Ordenar por fecha descendente y tomar los 3 más recientes
    proyectos.sort((a, b) => {
      const fa = parseFechaPortafolio(a['fecha-publicacion']);
      const fb = parseFechaPortafolio(b['fecha-publicacion']);
      if (!fa && !fb) return 0;
      if (!fa) return 1;
      if (!fb) return -1;
      return fb - fa;
    });

    const recientes = proyectos.slice(0, 3);

    grid.innerHTML = recientes.map(p => `
      <a class="portafolio-preview-card" href="${p.link || '/portafolio'}">
        <span class="portafolio-preview-fecha">${formatFechaPortafolio(p['fecha-publicacion'])}</span>
        <div class="portafolio-preview-nombre">${p['nombre-proyecto'] || ''}</div>
        <p class="portafolio-preview-desc">${p['descripcion-corta'] || ''}</p>
      </a>
    `).join('');

  } catch (error) {
    console.error('Error cargando portafolio preview:', error);
    grid.innerHTML = '';
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadPortafolioPreview);
} else {
  loadPortafolioPreview();
}
