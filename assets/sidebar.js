const CATEGORIAS = {
  'google-cloud':   'Google Cloud',
  'aws':            'AWS',
  'azure':          'Azure',
  'git':            'Git',
  'claude-code':    'Claude Code',
  'bash-shell':     'Bash & Shell',
  'python':         'Python',
  'apis':           'APIs',
  'sql':            'SQL',
  'bases-de-datos': 'Bases de datos',
  'portafolio-web': 'Portafolio web',
  'power-bi':       'Power BI',
  'google-analytics': 'Google Analytics',
  'hojas-de-calculo': 'Hojas de cálculo',
  'formacion':        'Formación',
};

let _todosLosPosts = [];
let _slugActivo = '__inicio__';
let _expandidas = new Set();
let _osActivo = 'mac';

function detectarOS() {
  const guardado = localStorage.getItem('os-filter');
  if (guardado) return guardado;
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('android') || ua.includes('win')) return 'windows';
  return 'mac';
}

function postMatchOS(p) {
  const so = p['sistema-operativo'] || '';
  if (!so || so === 'mac-windows') return true;
  return so === _osActivo;
}

async function cargarSidebar(slugActivo) {
  _slugActivo = slugActivo;
  _osActivo = detectarOS();

  const res = await fetch('/posts.json');
  _todosLosPosts = await res.json();

  if (slugActivo !== '__inicio__') {
    const postActivo = _todosLosPosts.find(p => p.slug === slugActivo);
    if (postActivo) _expandidas.add(postActivo.categoria);
  }

  renderOsToggle();
  renderSidebar('');
}

function renderOsToggle() {
  const buttonsHTML = `
    <button class="os-btn${_osActivo === 'mac' ? ' activo' : ''}" onclick="cambiarOS('mac')">Mac</button>
    <button class="os-btn${_osActivo === 'windows' ? ' activo' : ''}" onclick="cambiarOS('windows')">Windows</button>
  `;

  // Toggle en sidebar (desktop)
  const existing = document.getElementById('os-toggle');
  if (existing) existing.remove();
  const toggle = document.createElement('div');
  toggle.id = 'os-toggle';
  toggle.innerHTML = buttonsHTML;
  const nav = document.getElementById('sidebarNav');
  document.getElementById('sidebar').insertBefore(toggle, nav);

  // Toggle en topnav (mobile)
  const topnavToggle = document.getElementById('topnav-os-toggle');
  if (topnavToggle) topnavToggle.innerHTML = buttonsHTML;
}

function cambiarOS(os) {
  _osActivo = os;
  localStorage.setItem('os-filter', os);
  renderOsToggle();
  renderSidebar(document.querySelector('#sidebar input')?.value || '');
}

function renderSidebar(query) {
  const nav = document.getElementById('sidebarNav');
  nav.innerHTML = '';
  const q = (query || '').toLowerCase().trim();

  // Inicio
  const inicio = document.createElement('a');
  inicio.href = '/';
  inicio.className = 'sidebar-inicio' + (_slugActivo === '__inicio__' ? ' activo' : '');
  inicio.textContent = 'Inicio';
  nav.appendChild(inicio);

  // Categorías
  Object.entries(CATEGORIAS).forEach(([catSlug, catNombre]) => {
    const posts = _todosLosPosts.filter(p => {
      if (p.categoria !== catSlug) return false;
      if (!postMatchOS(p)) return false;
      if (q) return p.titulo.toLowerCase().includes(q) || (p.tags && p.tags.some(t => t.toLowerCase().includes(q)));
      return true;
    });

    if (q && posts.length === 0) return;


    const expandida = _expandidas.has(catSlug) || (q && posts.length > 0);

    const header = document.createElement('div');
    header.className = 'sidebar-cat-header' + (expandida ? ' expandido' : '');
    header.innerHTML = `
      <span class="sidebar-cat-nombre">${catNombre}</span>
      <span class="sidebar-cat-chevron">›</span>
    `;
    header.onclick = () => toggleCategoria(catSlug);
    nav.appendChild(header);

    const postsEl = document.createElement('div');
    postsEl.className = 'sidebar-cat-posts' + (expandida ? ' visible' : '');
    postsEl.dataset.cat = catSlug;

    posts.forEach(p => {
      const a = document.createElement('a');
      a.href = '/' + p.slug + '/';
      a.className = 'sidebar-post-link' + (p.slug === _slugActivo ? ' activo' : '');
      a.title = p.titulo;
      a.textContent = p.titulo;
      postsEl.appendChild(a);
    });

    nav.appendChild(postsEl);
  });
}

function toggleCategoria(catSlug) {
  if (_expandidas.has(catSlug)) {
    _expandidas.delete(catSlug);
  } else {
    _expandidas.add(catSlug);
  }
  renderSidebar(document.querySelector('#sidebar input')?.value || '');
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
