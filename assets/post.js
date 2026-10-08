// ─── TOC (tabla de contenidos derecha) ───────────────────────────────────────
function generarTOC() {
  const toc = document.getElementById('toc');
  const headings = document.querySelectorAll('.post-body h2');

  headings.forEach(h => {
    const id = h.textContent.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    h.id = id;
    const a = document.createElement('a');
    a.href = '#' + id;
    a.textContent = h.textContent;
    toc.appendChild(a);
  });

  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      const link = toc.querySelector(`a[href="#${e.target.id}"]`);
      if (link) link.classList.toggle('activo', e.isIntersecting);
    });
  }, { rootMargin: '0px 0px -80% 0px' });

  headings.forEach(h => observer.observe(h));
}

// ─── SCROLL TRACKING ─────────────────────────────────────────────────────────
let max_scroll = 0;
window.addEventListener('scroll', () => {
  const pct = Math.round(
    (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
  );
  if (pct > max_scroll) max_scroll = pct;
});

// ─── DESCARGAR PDF ────────────────────────────────────────────────────────────
function descargarPDF() {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: 'descarga_post', scroll_maximo: max_scroll });
  window.print();
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
cargarSidebar(CURRENT_SLUG);
generarTOC();
hljs.highlightAll();

// ─── CARRUSEL DE VIDEOS VERTICALES ───────────────────────────────────────────
(function () {
  const carrusel = document.querySelector('.post-shorts');
  if (!carrusel) return;

  const pista = carrusel.querySelector('.post-shorts-pista');
  const [anterior, siguiente] = carrusel.querySelectorAll('.post-shorts-flecha');

  function actualizar() {
    const max = pista.scrollWidth - pista.clientWidth;
    carrusel.classList.toggle('sin-desborde', max <= 1);
    anterior.disabled = pista.scrollLeft <= 1;
    siguiente.disabled = pista.scrollLeft >= max - 1;
  }

  carrusel.querySelectorAll('.post-shorts-flecha').forEach(btn => {
    btn.addEventListener('click', () => {
      const paso = pista.querySelector('.post-short').offsetWidth + 12;
      pista.scrollBy({ left: paso * Number(btn.dataset.dir) });
    });
  });

  pista.addEventListener('scroll', actualizar, { passive: true });
  window.addEventListener('resize', actualizar);
  actualizar();
})();
