let todosLosPosts = [];
let categoriaActiva = null;

// Nombres legibles de serie. Si una serie nueva no está aquí, se muestra
// con su slug prettificado (ver nombreSerie) hasta que se le ponga nombre.
const SERIES_NOMBRES = {
  'postgresql-desde-cero': 'PostgreSQL desde cero',
  'apis-para-analistas': 'APIs para analistas',
  'fabric-desde-cero': 'Microsoft Fabric desde cero',
  'introduccion-claude-code': 'Introducción a Claude Code',
  'fundamentos-http': 'Fundamentos de HTTP',
};

async function init() {
  await cargarSidebar('__inicio__');
  todosLosPosts = _todosLosPosts;

  const catUrl = new URLSearchParams(location.search).get('cat');
  if (catUrl && CATEGORIAS[catUrl]) categoriaActiva = catUrl;

  renderCatGrid();
  renderPosts(getPostsFiltrados());
}

function getPostsFiltrados() {
  return categoriaActiva
    ? todosLosPosts.filter(p => p.categoria === categoriaActiva)
    : todosLosPosts;
}

// ─── GRID DE CATEGORÍAS ───────────────────────────────────────────────────────
function renderCatGrid() {
  // Con categoría activa se oculta homeIntro (ver regla en home.css). Se
  // controla con esta clase, no con style inline, porque el <head> ya la
  // adelanta antes del primer pintado cuando la URL trae ?cat= — así ambos
  // caminos (carga inicial y clic dentro de la página) quedan consistentes.
  document.documentElement.classList.toggle('cat-activa', !!categoriaActiva);

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
function filaPost(p, numero) {
  const fila = document.createElement('div');
  fila.className = 'post-fila';
  const chip = categoriaActiva ? '' : `<span class="post-fila-cat">${CATEGORIAS[p.categoria] || p.categoria}</span>`;
  fila.innerHTML = `
    <a class="post-fila-titulo" href="/${p.slug}/">${numero ? numero + '. ' : ''}${p.titulo}</a>
    ${chip}
    <span class="post-fila-fecha">${p.updated}</span>
  `;
  return fila;
}

function nombreSerie(slug) {
  return SERIES_NOMBRES[slug] || slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// Reconstruye el orden pedagógico real de una serie siguiendo la cadena
// parte-anterior → parte-siguiente, en vez de ordenar por fecha.
function ordenarSerie(posts) {
  const porSlug = new Map(posts.map(p => [p.slug, p]));
  const usados = new Set();
  const ordenado = [];

  let actual = posts.find(p => !p['parte-anterior'] || !porSlug.has(p['parte-anterior']));
  while (actual && !usados.has(actual.slug)) {
    ordenado.push(actual);
    usados.add(actual.slug);
    actual = porSlug.get(actual['parte-siguiente']);
  }

  // Salvaguarda: cualquier post que la cadena no alcanzó (puntero roto,
  // parte pendiente sin publicar) igual se muestra, al final.
  posts.forEach(p => { if (!usados.has(p.slug)) ordenado.push(p); });
  return ordenado;
}

function agruparPorSerie(posts) {
  const series = new Map();
  const sueltos = [];

  posts.forEach(p => {
    if (p.serie) {
      if (!series.has(p.serie)) series.set(p.serie, []);
      series.get(p.serie).push(p);
    } else {
      sueltos.push(p);
    }
  });

  const gruposSerie = Array.from(series.entries()).map(([slug, postsSerie]) => ({
    slug,
    posts: ordenarSerie(postsSerie),
    masReciente: postsSerie.reduce((max, p) => (p.updated > max ? p.updated : max), postsSerie[0].updated),
  }));

  gruposSerie.sort((a, b) => b.masReciente.localeCompare(a.masReciente));

  return { gruposSerie, sueltos };
}

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

  // Sin categoría seleccionada: lista plana de recientes, como siempre.
  // Con categoría: pantalla agrupada por serie (orden real) + sueltos aparte.
  if (!categoriaActiva) {
    posts.forEach(p => lista.appendChild(filaPost(p)));
    return;
  }

  const { gruposSerie, sueltos } = agruparPorSerie(posts);

  gruposSerie.forEach(grupo => {
    const bloque = document.createElement('div');
    bloque.className = 'posts-serie';

    const header = document.createElement('div');
    header.className = 'posts-serie-titulo';
    header.textContent = nombreSerie(grupo.slug);
    bloque.appendChild(header);

    grupo.posts.forEach((p, i) => bloque.appendChild(filaPost(p, i + 1)));
    lista.appendChild(bloque);
  });

  if (sueltos.length) {
    if (gruposSerie.length) {
      const header = document.createElement('div');
      header.className = 'posts-serie-titulo';
      header.textContent = 'Sueltos';
      lista.appendChild(header);
    }
    sueltos.forEach(p => lista.appendChild(filaPost(p)));
  }
}

// ─── FILTROS ──────────────────────────────────────────────────────────────────
function actualizarURL() {
  const url = new URL(location.href);
  if (categoriaActiva) url.searchParams.set('cat', categoriaActiva);
  else url.searchParams.delete('cat');
  history.replaceState(null, '', url);
}

function seleccionarCategoria(slug) {
  categoriaActiva = categoriaActiva === slug ? null : slug;
  actualizarURL();
  renderCatGrid();
  renderPosts(getPostsFiltrados());
}

function resetCategoria() {
  categoriaActiva = null;
  actualizarURL();
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
  renderPosts(filtrados);
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

init();
