let todosLosPosts = [];
let categoriaActiva = null;

async function init() {
  await cargarSidebar('__inicio__');
  todosLosPosts = _todosLosPosts;
  renderCatGrid();
  renderPosts(todosLosPosts);
}

// ─── GRID DE CATEGORÍAS ───────────────────────────────────────────────────────
function renderCatGrid() {
  const grid = document.getElementById('catGrid');
  grid.innerHTML = '';

  Object.entries(CATEGORIAS).forEach(([slug, nombre]) => {
    const count = todosLosPosts.filter(p => p.categoria === slug).length;

    const card = document.createElement('div');
    card.className = 'cat-card' + (categoriaActiva === slug ? ' activo' : '');
    card.innerHTML = `
      <div class="cat-card-nombre">${nombre}</div>
      <div class="cat-card-count">${count} ${count === 1 ? 'post' : 'posts'}</div>
    `;
    card.onclick = () => seleccionarCategoria(slug);
    grid.appendChild(card);
  });
}

// ─── LISTA DE POSTS ───────────────────────────────────────────────────────────
function renderPosts(posts) {
  const lista = document.getElementById('postsList');
  const titulo = document.getElementById('postsTitulo');
  const reset = document.getElementById('postsReset');
  lista.innerHTML = '';

  titulo.textContent = categoriaActiva
    ? CATEGORIAS[categoriaActiva]
    : 'Posts recientes';

  reset.style.display = categoriaActiva ? 'block' : 'none';

  if (posts.length === 0) {
    lista.innerHTML = '<div class="posts-vacio">Aún no hay posts en esta categoría.</div>';
    return;
  }

  posts.forEach(p => {
    const fila = document.createElement('div');
    fila.className = 'post-fila';
    fila.innerHTML = `
      <a class="post-fila-titulo" href="/${p.slug}/">${p.titulo}</a>
      <span class="post-fila-cat">${CATEGORIAS[p.categoria] || p.categoria}</span>
      <span class="post-fila-fecha">${p.updated}</span>
    `;
    lista.appendChild(fila);
  });
}

// ─── FILTROS ──────────────────────────────────────────────────────────────────
function seleccionarCategoria(slug) {
  categoriaActiva = categoriaActiva === slug ? null : slug;
  const filtrados = categoriaActiva
    ? todosLosPosts.filter(p => p.categoria === categoriaActiva)
    : todosLosPosts;
  renderSidebar();
  renderCatGrid();
  renderPosts(filtrados);
}

function resetCategoria() {
  categoriaActiva = null;
  renderSidebar();
  renderCatGrid();
  renderPosts(todosLosPosts);
}

function filtrarPosts(query) {
  const q = query.toLowerCase().trim();
  const base = categoriaActiva
    ? todosLosPosts.filter(p => p.categoria === categoriaActiva)
    : todosLosPosts;
  const filtrados = q
    ? base.filter(p =>
        p.titulo.toLowerCase().includes(q) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(q)))
      )
    : base;
  renderPosts(filtrados);
}

init();
