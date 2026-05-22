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

// ─── DESCARGAR PDF ────────────────────────────────────────────────────────────
function descargarPDF() {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: 'descarga_post' });
  window.print();
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
cargarSidebar(CURRENT_SLUG);
generarTOC();
hljs.highlightAll();
