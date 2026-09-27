// Orden alfabético por nombre visible (A-Z) — Inicio y Portafolio van antes,
// fuera de este objeto, ver renderSidebar().
const CATEGORIAS = {
  'apis':             'APIs',
  'aws':              'AWS',
  'azure':            'Azure',
  'bases-de-datos':   'Bases de datos',
  'bash-shell':       'Bash & Shell',
  'claude-code':      'Claude Code',
  'git':              'Git',
  'google-analytics': 'Google Analytics',
  'google-cloud':     'Google Cloud',
  'hojas-de-calculo': 'Hojas de cálculo',
  'portafolio-web':   'Portafolio web',
  'power-bi':         'Power BI',
  'python':           'Python',
  'sistemas-y-redes': 'Sistemas y redes',
  'sql':              'SQL',
};

let _todosLosPosts = [];
let _slugActivo = '__inicio__';
let _catActiva = '';

async function cargarSidebar(slugActivo) {
  _slugActivo = slugActivo;

  const res = await fetch('/posts.json');
  _todosLosPosts = await res.json();

  if (slugActivo !== '__inicio__') {
    const postActivo = _todosLosPosts.find(p => p.slug === slugActivo);
    _catActiva = postActivo ? postActivo.categoria : '';
  } else {
    _catActiva = new URLSearchParams(location.search).get('cat') || '';
  }

  renderSidebar('');
}

// Todo item de nivel raíz de la sidebar (Inicio, Portafolio, cada categoría)
// usa el mismo estilo — no hay una categoría "principal" y otras secundarias.
function crearLink(href, texto, activo) {
  const a = document.createElement('a');
  a.href = href;
  a.className = 'sidebar-link' + (activo ? ' activo' : '');
  a.textContent = texto;
  return a;
}

function renderSidebar(query) {
  const nav = document.getElementById('sidebarNav');
  nav.innerHTML = '';
  const q = (query || '').toLowerCase().trim();

  nav.appendChild(crearLink('/', 'Inicio', _slugActivo === '__inicio__' && !_catActiva));
  nav.appendChild(crearLink('/portafolio', 'Portafolio', false));

  if (q) {
    renderResultadosBusqueda(nav, q);
  } else {
    // Categorías: link plano a su pantalla en el home (/?cat=slug), sin
    // desplegar nada aquí. La lista de posts, agrupada por serie, vive en
    // esa pantalla — ver renderPosts() en home.js.
    Object.entries(CATEGORIAS).forEach(([catSlug, catNombre]) => {
      nav.appendChild(crearLink('/?cat=' + catSlug, catNombre, catSlug === _catActiva));
    });
  }
}

function renderResultadosBusqueda(nav, q) {
  const resultados = _todosLosPosts.filter(p =>
    p.titulo.toLowerCase().includes(q) || (p.tags && p.tags.some(t => t.toLowerCase().includes(q)))
  );

  const titulo = document.createElement('div');
  titulo.className = 'sidebar-cat-nombre';
  titulo.textContent = resultados.length ? 'Resultados' : 'Sin resultados';
  nav.appendChild(titulo);

  resultados.forEach(p => {
    const a = document.createElement('a');
    a.href = '/' + p.slug + '/';
    a.className = 'sidebar-post-link' + (p.slug === _slugActivo ? ' activo' : '');
    a.title = p.titulo;
    a.textContent = p.titulo;
    nav.appendChild(a);
  });
}

function filtrarSidebar(query) {
  renderSidebar(query);
}

// ─── MÓVIL: abrir / cerrar sidebar ───────────────────────────────────────────
function abrirSidebar() {
  document.getElementById('sidebar').classList.add('abierto');
  document.getElementById('sidebarOverlay').classList.add('visible');
}

function cerrarSidebar() {
  document.getElementById('sidebar').classList.remove('abierto');
  document.getElementById('sidebarOverlay').classList.remove('visible');
}

// ─── REDIMENSIONAR SIDEBAR (arrastrar el borde) ──────────────────────────────
const SIDEBAR_MIN = 240;   // ancho por defecto, no se reduce más
const SIDEBAR_MAX = 440;   // tope al expandir
const SIDEBAR_KEY = 'sidebar-width';

// Restaurar el ancho guardado cuanto antes (evita el parpadeo al cargar)
(function restaurarAnchoSidebar() {
  const guardado = parseInt(localStorage.getItem(SIDEBAR_KEY), 10);
  if (guardado >= SIDEBAR_MIN && guardado <= SIDEBAR_MAX) {
    document.documentElement.style.setProperty('--sidebar-width', guardado + 'px');
  }
})();

function initSidebarResize() {
  if (document.querySelector('.sidebar-resizer')) return; // evitar duplicados

  const resizer = document.createElement('div');
  resizer.className = 'sidebar-resizer';
  resizer.title = 'Arrastra para ajustar el ancho · doble clic para restablecer';
  document.body.appendChild(resizer);

  let arrastrando = false;

  resizer.addEventListener('mousedown', (e) => {
    arrastrando = true;
    resizer.classList.add('arrastrando');
    document.body.classList.add('sidebar-resizing');
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!arrastrando) return;
    let ancho = Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, e.clientX));
    document.documentElement.style.setProperty('--sidebar-width', ancho + 'px');
  });

  document.addEventListener('mouseup', () => {
    if (!arrastrando) return;
    arrastrando = false;
    resizer.classList.remove('arrastrando');
    document.body.classList.remove('sidebar-resizing');
    const actual = parseInt(getComputedStyle(document.documentElement)
      .getPropertyValue('--sidebar-width'), 10);
    localStorage.setItem(SIDEBAR_KEY, actual);
  });

  // Doble clic en la manija → volver al ancho por defecto
  resizer.addEventListener('dblclick', () => {
    document.documentElement.style.setProperty('--sidebar-width', SIDEBAR_MIN + 'px');
    localStorage.setItem(SIDEBAR_KEY, SIDEBAR_MIN);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSidebarResize);
} else {
  initSidebarResize();
}
