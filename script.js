
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

      const h2 = document.createElement('h2');
      h2.textContent = section.title || '';
      sec.appendChild(h2);

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

      sec.appendChild(grid);
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