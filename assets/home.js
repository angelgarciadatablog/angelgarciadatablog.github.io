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

// ─── FORMULARIO DE ASESORÍA ───────────────────────────────────────────────────
// Mismo endpoint de Apps Script que usa el popup de GTM (variable url-apps-script-popup-suscripcion)
const ASESORIA_ENDPOINT = 'https://script.google.com/macros/s/AKfycbwaoACq0wLtaCCpWKbyBaXi1f44WWzlU6M8Xwu2sfebxYKGNXhRxEIr-wlzd_AhU35cwg/exec';

document.getElementById('asesoriaForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const form = this;
  const btn = document.getElementById('asesoriaBtn');
  const estado = document.getElementById('asesoriaEstado');
  const email = document.getElementById('asesoriaEmail').value.trim();
  const objetivo = document.getElementById('asesoriaObjetivo').value.trim();

  if (email.indexOf('@') < 0 || !objetivo) return;

  btn.disabled = true;
  btn.textContent = 'Enviando...';

  try {
    await fetch(ASESORIA_ENDPOINT, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify({ email: email, message: objetivo, page: location.href })
    });

    // Mismo flag que usa el popup de GTM: ya se suscribió, no volver a mostrarlo
    localStorage.setItem('pp_d', '1');

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: 'lead_form_submit', form_location: 'home' });

    form.style.display = 'none';
    estado.textContent = '¡Gracias! Te escribiré pronto a tu correo para coordinar la asesoría.';
    estado.classList.add('visible');
  } catch (err) {
    btn.disabled = false;
    btn.textContent = 'Enviar';
    estado.textContent = 'Hubo un problema al enviar. Inténtalo de nuevo en unos segundos.';
    estado.classList.add('visible');
  }
});

// Re-renderiza home cuando cambia el OS (sidebar llama cambiarOS desde los botones)
const _cambiarOSSidebar = cambiarOS;
window.cambiarOS = function(os) {
  _cambiarOSSidebar(os);
  renderCatGrid();
  renderPosts(getPostsFiltrados());
};

init();
