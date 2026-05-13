const CATEGORIAS = {
  'google-cloud':   'Google Cloud',
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
};

let _todosLosPosts = [];
let _slugActivo = '__inicio__';
let _expandidas = new Set();

async function cargarSidebar(slugActivo) {
  _slugActivo = slugActivo;

  // Expandir la categoría del post activo por defecto
  if (slugActivo !== '__inicio__') {
    const res = await fetch('/posts.json');
    _todosLosPosts = await res.json();
    const postActivo = _todosLosPosts.find(p => p.slug === slugActivo);
    if (postActivo) _expandidas.add(postActivo.categoria);
  } else {
    const res = await fetch('/posts.json');
    _todosLosPosts = await res.json();
  }

  renderSidebar('');
}

function renderSidebar(query) {
  const nav = document.getElementById('sidebarNav');
  nav.innerHTML = '';
  const q = query.toLowerCase().trim();

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
      if (q) return p.titulo.toLowerCase().includes(q) || (p.tags && p.tags.some(t => t.toLowerCase().includes(q)));
      return true;
    });

    // Si hay búsqueda activa y no hay resultados, ocultar categoría
    if (q && posts.length === 0) return;

    const expandida = _expandidas.has(catSlug) || (q && posts.length > 0);

    // Header de categoría
    const header = document.createElement('div');
    header.className = 'sidebar-cat-header' + (expandida ? ' expandido' : '');
    header.innerHTML = `
      <span class="sidebar-cat-nombre">${catNombre}</span>
      <span class="sidebar-cat-chevron">›</span>
    `;
    header.onclick = () => toggleCategoria(catSlug);
    nav.appendChild(header);

    // Posts de la categoría
    const postsEl = document.createElement('div');
    postsEl.className = 'sidebar-cat-posts' + (expandida ? ' visible' : '');
    postsEl.dataset.cat = catSlug;

    posts.forEach(p => {
      const a = document.createElement('a');
      a.href = '/' + p.slug + '/';
      a.className = 'sidebar-post-link' + (p.slug === _slugActivo ? ' activo' : '');
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
