
(function initMenu() {
  const toggle = document.querySelector('.menu-toggle');
  const menu = document.getElementById('site-menu');
  if (!toggle || !menu) return;

  toggle.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  // Cierra el menú al navegar (mejor UX)
  menu.addEventListener('click', (e) => {
    const target = e.target;
    if (target && target.matches('a.menu-link')) {
      menu.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
})();

(async () => {
  const root = document.getElementById('sections-root');
  if (!root) return;

  try {
    const res = await fetch('data/sections.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const frag = document.createDocumentFragment();
    (data.sections || []).forEach(section => {
      const sec = document.createElement('section');
      sec.className = 'block';
      if (section.id) sec.id = section.id;

      // Crear contenedor interno
      const container = document.createElement('div');
      container.className = 'container';

      const h2 = document.createElement('h2');
      h2.textContent = section.title || '';
      container.appendChild(h2);

      const grid = document.createElement('div');
      grid.className = 'grid';

      (section.items || []).forEach(item => {
        const a = document.createElement('a');
        const isUnavailable = !item.url || item.url === '#';
        a.className = isUnavailable ? 'card card--unavailable' : 'card';
        a.href = item.url || '#';

        // Solo agregar target="_blank" para enlaces reales
        if (!isUnavailable) {
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
        }

        const span = document.createElement('span');
        span.textContent = item.label || '';
        a.appendChild(span);

        grid.appendChild(a);
      });

      container.appendChild(grid);
      sec.appendChild(container);
      frag.appendChild(sec);
    });

    root.replaceChildren(frag);
  } catch (err) {
    console.error('No se pudo cargar data/sections.json', err);
    const fallback = document.createElement('p');
    fallback.textContent = 'No se pudo cargar el contenido. Intenta recargar la página.';
    root.replaceChildren(fallback);
  }
})();

// Funcionalidad del carrusel de publicaciones recientes
(function initPostsCarousel() {
  const postsGrid = document.getElementById('linkedin-posts');
  const indicators = document.querySelectorAll('#posts-indicators .scroll-dot');

  if (!postsGrid || indicators.length === 0) return;

  function updateIndicators() {
    const scrollLeft = postsGrid.scrollLeft;
    const cardWidth = postsGrid.querySelector('.post-card')?.offsetWidth || 300;
    const gap = 16;
    const totalWidth = cardWidth + gap;
    const currentIndex = Math.round(scrollLeft / totalWidth);

    indicators.forEach((dot, index) => {
      if (index === currentIndex) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
  }

  postsGrid.addEventListener('scroll', updateIndicators);
  updateIndicators(); // Estado inicial
})();

// Funcionalidad del carrusel de recursos
(function initResourcesCarousel() {
  const track = document.getElementById('resources-carousel');
  const prevBtn = document.querySelector('.carousel-btn--prev');
  const nextBtn = document.querySelector('.carousel-btn--next');

  if (!track || !prevBtn || !nextBtn) return;

  const scrollAmount = 300; // Cantidad de píxeles a desplazar

  prevBtn.addEventListener('click', () => {
    track.scrollBy({
      left: -scrollAmount,
      behavior: 'smooth'
    });
  });

  nextBtn.addEventListener('click', () => {
    track.scrollBy({
      left: scrollAmount,
      behavior: 'smooth'
    });
  });

  // Actualizar estado de botones según posición del scroll
  function updateButtons() {
    const isAtStart = track.scrollLeft <= 0;
    const isAtEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 1;

    prevBtn.style.opacity = isAtStart ? '0.3' : '1';
    prevBtn.style.pointerEvents = isAtStart ? 'none' : 'auto';

    nextBtn.style.opacity = isAtEnd ? '0.3' : '1';
    nextBtn.style.pointerEvents = isAtEnd ? 'none' : 'auto';
  }

  track.addEventListener('scroll', updateButtons);
  updateButtons(); // Estado inicial
})();