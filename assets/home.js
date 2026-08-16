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

// ─── ASESORÍA: BOTÓN DE WHATSAPP ──────────────────────────────────────────────
// Sustituye al formulario de correo + objetivo. Motivo: en la práctica casi
// nadie dejaba sus datos, y quien lo hacía quedaba esperando una respuesta
// manual. WhatsApp abre la conversación en dos clics y con el mensaje escrito.
// Mismo patrón que la página de links (proyecto-links/links/assets/links.js).

// Troceado a propósito, igual que en links.json: el número viaja dentro de la
// URL de wa.me y los enlaces wa.me publicados en HTML terminan indexados por
// buscadores. Solo dígitos, primera parte = código de país (Perú 51), sin +.
const ASESORIA_WA_PARTES = ['51', '967', '130', '241'];

// El texto que llega identifica el origen del lead sin abrir GA4: es el
// tracking que sobrevive al clic.
const ASESORIA_WA_MENSAJE = 'Hola Ángel, vengo de tu blog. Me interesa la asesoría personalizada y quiero agendar la sesión de descubrimiento de 20 minutos.';

(function () {
  const enlace = document.getElementById('asesoriaWhatsapp');
  if (!enlace) return;

  // Si el número quedó mal armado, se oculta la sección entera: mejor que
  // publicar un wa.me roto que manda al visitante a un error de WhatsApp.
  const numero = ASESORIA_WA_PARTES.join('');
  if (!/^[0-9]{8,15}$/.test(numero)) {
    document.getElementById('asesoria').hidden = true;
    return;
  }

  // El href real se escribe recién cuando alguien va a usar el botón. Googlebot
  // renderiza JS pero no dispara eventos de interacción, así que nunca ve el
  // número armado. Es un obstáculo contra bots, NO contra personas.
  let armado = false;
  function armar() {
    if (armado) return;
    enlace.href = 'https://wa.me/' + numero + '?text=' + encodeURIComponent(ASESORIA_WA_MENSAJE);
    armado = true;
  }

  ['mousedown', 'touchstart', 'focus', 'keydown'].forEach(function (evento) {
    enlace.addEventListener(evento, armar, { passive: true });
  });

  enlace.addEventListener('click', function () {
    // Red de seguridad: si ningún evento previo disparó (clic sintético, lector
    // de pantalla), se arma aquí antes de que el navegador navegue.
    armar();

    // Mismo flag que usa el popup de GTM: ya inició conversación, no tiene
    // sentido seguir persiguiéndolo con el popup.
    localStorage.setItem('pp_d', '1');

    // Mismo evento y mismos parámetros que /links/, para que el tag de GTM que
    // ya existe lo recoja sin configurar nada nuevo. link_seccion lo distingue.
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'link_click',
      link_id: 'asesoria-home',
      link_destino: 'whatsapp',
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
