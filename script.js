
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

// Código de sections.json eliminado - ahora usaremos Google Sheets

// Funcionalidad del carrusel de videos recientes
(function initVideosCarousel() {
  const videosGrid = document.getElementById('youtube-videos');
  const indicators = document.querySelectorAll('#videos-indicators .scroll-dot');

  if (!videosGrid) return;

  function updateIndicators() {
    // Solo funciona en mobile (cuando es flex/scroll)
    if (window.innerWidth >= 640) return;

    const scrollLeft = videosGrid.scrollLeft;
    const cardWidth = videosGrid.querySelector('.video-card')?.offsetWidth || 300;
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

  // Solo agregar listener si existe el contenedor
  if (videosGrid) {
    videosGrid.addEventListener('scroll', updateIndicators);
    window.addEventListener('resize', updateIndicators);

    // Esperar a que los videos se carguen para actualizar
    setTimeout(updateIndicators, 1000);
  }
})();