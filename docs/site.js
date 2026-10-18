/* Baresand · piezas de interfaz compartidas (navegación, expansores, secciones, contacto) */
(function () {
  'use strict';
  const C = window.BARESAND_CONTENT;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  let uid = 0;

  const Site = {
    C, esc,
    section: id => C.sections.find(s => s.id === id),

    nav(opts) {
      opts = opts || {};
      const el = document.createElement('header');
      el.className = 'nav';
      el.innerHTML = `<a class="brand" href="#inicio" aria-label="Baresand Electronics, inicio">${window.logoSVG({mark: false})}</a>
        <nav class="links" aria-label="Secciones">${C.nav.map(n => `<a href="#${n.id}" data-nav="${n.id}">${esc(n.label)}</a>`).join('')}
        <a class="cta" href="#contacto">Hablemos</a></nav>`;
      document.body.prepend(el);
      addEventListener('scroll', () => el.classList.toggle('solid', scrollY > 40), {passive: true});
      Site.switcher(el);
      return el;
    },
    // every proposal can reach the others, the guion and the index
    OPTIONS: [['opcion-1.html', 'Metamorfosis'], ['opcion-2.html', 'Relieve'], ['opcion-3.html', 'Estratos'], ['opcion-4.html', 'Tablero'], ['opcion-5.html', 'Órbita']],
    switcher(nav) {
      const file = location.pathname.split('/').pop();
      const k = Site.OPTIONS.findIndex(o => o[0] === file);
      if (k < 0) return;
      const box = document.createElement('div');
      box.className = 'switch';
      box.innerHTML = `<button type="button" aria-expanded="false" aria-controls="switchMenu"><span class="full">Propuesta ${k + 1} de ${Site.OPTIONS.length} · ${esc(Site.OPTIONS[k][1])}</span><span class="short">${k + 1}/${Site.OPTIONS.length}</span><i aria-hidden="true"></i></button>
        <div class="menu" id="switchMenu" hidden>
          <a href="index.html" class="back">← Todas las propuestas</a>
          <a href="guion.html">Guion del sitio</a>
          <hr>
          ${Site.OPTIONS.map((o, i) => `<a href="${o[0]}"${i === k ? ' aria-current="page"' : ''}><b>${i + 1}</b>${esc(o[1])}</a>`).join('')}
        </div>`;
      nav.querySelector('.brand').after(box);
      const btn = box.querySelector('button'), menu = box.querySelector('.menu');
      const set = open => { btn.setAttribute('aria-expanded', open); menu.hidden = !open; };
      btn.addEventListener('click', e => { e.stopPropagation(); set(menu.hidden); });
      document.addEventListener('click', e => { if (!box.contains(e.target)) set(false); });
      addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
    },
    setNav(id) {
      document.querySelectorAll('.nav [data-nav]').forEach(a => a.setAttribute('aria-current', a.dataset.nav === id ? 'true' : 'false'));
    },

    // a "+" toggle and the panel it opens
    more(label, inner) {
      const id = 'more-' + (++uid);
      return `<button class="more-toggle" type="button" aria-expanded="false" aria-controls="${id}"><span class="pm" aria-hidden="true"></span>${esc(label)}</button>
        <div class="more" id="${id}" role="region"><div>${inner}</div></div>`;
    },
    moreBody(s) {
      if (s.steps) return `<ol class="steps">${s.steps.map(x => `<li><b>${esc(x.title)}</b><span>${esc(x.text)}</span></li>`).join('')}</ol>`;
      if (s.items) return `<ul class="ticks">${s.items.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`;
      return '';
    },
    wireMore(root) {
      (root || document).querySelectorAll('.more-toggle').forEach(b => {
        if (b.dataset.wired) return; b.dataset.wired = 1;
        b.addEventListener('click', () => {
          const open = b.getAttribute('aria-expanded') !== 'true';
          b.setAttribute('aria-expanded', open);
          document.getElementById(b.getAttribute('aria-controls')).classList.toggle('open', open);
          b.dispatchEvent(new CustomEvent('more', {bubbles: true, detail: {open}}));
        });
      });
    },

    // the standard block for a section (kicker, title, lead, what opens)
    block(s, opts) {
      opts = opts || {};
      const H = opts.h1 ? 'h1' : 'h2', cls = opts.h1 ? 'h1' : 'h2';
      let html = `<p class="kicker">${esc(s.kicker)}</p><${H} class="${cls}">${esc(s.title)}</${H}><p class="lead">${esc(s.lead)}</p>`;
      if (s.detail) html += `<p class="small" style="margin-top:14px;letter-spacing:.16em;text-transform:uppercase">${esc(s.detail)}</p>`;
      if (s.moreLabel && !opts.noMore) html += Site.more(s.moreLabel, Site.moreBody(s));
      if (s.cta && opts.cta !== false) html += `<p style="margin-top:28px"><a class="btn" href="${s.cta.href}">${esc(s.cta.label)}</a></p>`;
      return html;
    },
    caseBlock(k, opts) {
      opts = opts || {};
      let html = `<p class="kicker">${esc(k.tag)}</p><h3 class="h2" style="font-size:clamp(22px,2.4vw,32px)">${esc(k.title)}</h3><p class="lead">${esc(k.lead)}</p>`;
      const body = `<p class="lead" style="margin-top:14px">${esc(k.more)}</p>` + (k.link ? `<p style="margin-top:16px"><a class="btn ghost" href="${k.link.href}" target="_blank" rel="noopener">${esc(k.link.label)} ↗</a></p>` : '');
      html += opts.open ? body : Site.more('Ver detalle', body);
      return html;
    },
    contactForm() {
      const c = C.contact;
      return `<form class="form" novalidate>
          <label>Nombre<input name="n" autocomplete="name" required></label>
          <label>Email<input name="e" type="email" autocomplete="email" required></label>
          <label>Tu desafío<textarea name="m" required placeholder="Contanos en pocas líneas qué necesitás resolver"></textarea></label>
          <div><button class="btn" type="submit">Enviar</button></div>
          <p class="note">Prototipo: el formulario todavía no envía. Escribinos a <a href="mailto:${esc(c.email)}">${esc(c.email)}</a> o por Instagram a <a href="${c.instagramUrl}" target="_blank" rel="noopener">${esc(c.instagram)}</a>.</p>
          <p class="sent" hidden>Recibido. Te respondemos a la brevedad.</p>
        </form>`;
    },
    wireForms(root) {
      (root || document).querySelectorAll('form.form').forEach(f => f.addEventListener('submit', e => {
        e.preventDefault();
        if (!f.checkValidity()) { f.reportValidity(); return; }
        f.querySelector('.sent').hidden = false;
      }));
    },

    // which section is at the centre of the screen
    watch(els, cb) {
      const io = new IntersectionObserver(es => {
        es.forEach(e => { if (e.isIntersecting) cb(e.target); });
      }, {rootMargin: '-45% 0px -45% 0px'});
      els.forEach(e => io.observe(e));
      return io;
    },

    // soft inertial scrolling (falls back to native if the library is unavailable)
    smooth() {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches || !window.Lenis || /[?&]still/.test(location.search)) return null;
      const lenis = new window.Lenis({lerp: 0.085, wheelMultiplier: 0.9});
      const raf = t => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf);
      document.addEventListener('click', e => {
        const a = e.target.closest('a[href^="#"]'); if (!a) return;
        const t = document.querySelector(a.getAttribute('href')); if (!t) return;
        e.preventDefault(); lenis.scrollTo(t, {offset: 0, duration: 1.6});
      });
      return lenis;
    },

    ndcOf(el) {   // centre of an element, in the sand's coordinates
      const r = el.getBoundingClientRect();
      return {x: (r.left + r.width / 2) / innerWidth * 2 - 1, y: 1 - (r.top + r.height / 2) / innerHeight * 2, h: r.height / innerHeight * 2};
    },
    isMobile: () => innerWidth < 760,
    // content is built by script, so the browser cannot honour #anchors on load: do it here
    jumpToHash() {
      const h = decodeURIComponent(location.hash.slice(1)); if (!h) return;
      const t = document.getElementById(h); if (!t) return;
      requestAnimationFrame(() => { t.scrollIntoView({block: 'start'}); });
    },
  };
  window.Site = Site;
})();
