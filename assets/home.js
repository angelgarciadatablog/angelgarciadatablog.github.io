let todosLosPosts = [];
let categoriaActiva = null;

async function init() {
  await cargarSidebar('__inicio__');
  todosLosPosts = _todosLosPosts;
  renderCatGrid();
  renderPosts(getPostsFiltrados());
}

function getPostsFiltrados() {
  const base = categoriaActiva
    ? todosLosPosts.filter(p => p.categoria === categoriaActiva)
    : todosLosPosts;
  return base.filter(postMatchOS);
}

// ─── GRID DE CATEGORÍAS ───────────────────────────────────────────────────────
function renderCatGrid() {
  const grid = document.getElementById('catGrid');
  grid.innerHTML = '';

  Object.entries(CATEGORIAS).forEach(([slug, nombre]) => {
    const count = todosLosPosts.filter(p => p.categoria === slug && postMatchOS(p)).length;

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
  renderCatGrid();
  renderPosts(getPostsFiltrados());
}

function resetCategoria() {
  categoriaActiva = null;
  renderCatGrid();
  renderPosts(getPostsFiltrados());
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
  renderPosts(filtrados.filter(postMatchOS));
}

// ─── ASESORÍA: BANNER AL FORMULARIO PREVIO ───────────────────────────────────
// Sustituye al botón de WhatsApp (2026-08-25). Motivo: cuatro sesiones en una
// semana y solo una o dos con formulario llenado; la conversación arrancaba
// tomando notas en vez de conversando. Ahora el formulario es la única puerta
// y el link del calendario vive en su pantalla de confirmación.
//
// Efecto secundario buscado: el número de WhatsApp deja de publicarse en el
// blog entero. Solo queda en /links/, en los tres botones de asesoría pagada.
// Por eso ya no hace falta trocear el número ni escribir el href al interactuar:
// el destino es público y va directo en el HTML.

(function () {
  const enlace = document.getElementById('asesoriaWhatsapp');
  if (!enlace) return;

  enlace.addEventListener('click', function () {
    // Mismo flag que usa el popup de GTM: ya entró al formulario, no tiene
    // sentido seguir persiguiéndolo con el popup.
    localStorage.setItem('pp_d', '1');

    // Mismo evento y mismos parámetros que /links/, para que el tag de GTM que
    // ya existe lo recoja sin configurar nada nuevo. link_seccion lo distingue.
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'link_click',
      link_id: 'asesoria-home',
      link_destino: 'formulario',
      link_seccion: 'home',
      link_posicion: 1,
      campana: ''
    });
  });
})();

// Re-renderiza home cuando cambia el OS (sidebar llama cambiarOS desde los botones)
const _cambiarOSSidebar = cambiarOS;
window.cambiarOS = function(os) {
  _cambiarOSSidebar(os);
  renderCatGrid();
  renderPosts(getPostsFiltrados());
};

init();
