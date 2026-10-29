(function () {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isStatic = () => window.matchMedia('(max-width: 860px)').matches;

  /* Year */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* Theme toggle reuse */
  const themeToggle = $('#themeToggle');
  const metaTheme = $('meta[name="theme-color"]');
  function syncThemeUI() {
    const isDark = document.documentElement.dataset.theme !== 'light';
    if (themeToggle) themeToggle.setAttribute('aria-label', isDark ? 'Ganti ke mode terang' : 'Ganti ke mode gelap');
    if (metaTheme) metaTheme.setAttribute('content', isDark ? '#0b0b0d' : '#f7f4ee');
  }
  syncThemeUI();
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
      document.documentElement.dataset.theme = next;
      try {
        localStorage.setItem('insframe-theme', next);
        localStorage.removeItem('bb-theme');
      } catch (e) { }
      syncThemeUI();
    });
  }

  /* To top + progress */
  const toTopBtn = $('#toTop');
  const progressBar = $('#scrollProgress');
  function onScroll() {
    const y = window.scrollY || window.pageYOffset;
    if (progressBar) {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      const p = h > 0 ? (y / h) * 100 : 0;
      progressBar.style.width = Math.min(100, p) + '%';
    }
    if (toTopBtn) toTopBtn.classList.toggle('is-visible', y > 600);
  }
  if (toTopBtn) toTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' }));
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Tabs */
  const tabBtns = $$('.tab-btn');
  const panels = $$('.gallery-panel');
  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.target;
      tabBtns.forEach((b) => {
        const active = b === btn;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-selected', String(active));
      });
      panels.forEach((p) => p.classList.toggle('is-active', p.id === target));
      const main = $('#main');
      if (main) window.scrollTo({ top: main.offsetTop - 70, behavior: prefersReduced ? 'auto' : 'smooth' });
    });
  });

  /* Reveal */
  const reveals = $$('.reveal-up');
  if ('IntersectionObserver' in window && !prefersReduced) {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-visible');
        obs.unobserve(e.target);
      });
    }, { threshold: 0.14 });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- 01. Polaroid Pinboard ---------- */
  const board = $('[data-pinboard]');
  if (board) {
    const cards = $$('.pin-card', board);
    const shuffleBtn = $('[data-pin-shuffle]');
    const rand = (min, max) => Math.random() * (max - min) + min;

    function scatter() {
      if (isStatic()) return;
      cards.forEach((card) => {
        card.style.setProperty('--x', rand(0, 80).toFixed(2) + '%');
        card.style.setProperty('--y', rand(0, 52).toFixed(2) + '%');
        card.style.setProperty('--rot', rand(-12, 12).toFixed(1) + 'deg');
        card.style.setProperty('--dx', '0px');
        card.style.setProperty('--dy', '0px');
      });
    }
    if (shuffleBtn) shuffleBtn.addEventListener('click', scatter);

    cards.forEach((card) => {
      let startX = 0;
      let startY = 0;
      let baseDX = 0;
      let baseDY = 0;
      let dragging = false;
      let moved = 0;

      card.addEventListener('pointerdown', (e) => {
        if (prefersReduced || isStatic()) return;
        if (e.button !== undefined && e.button !== 0) return;
        dragging = true;
        moved = 0;
        startX = e.clientX;
        startY = e.clientY;
        baseDX = parseFloat(getComputedStyle(card).getPropertyValue('--dx')) || 0;
        baseDY = parseFloat(getComputedStyle(card).getPropertyValue('--dy')) || 0;
        card.setPointerCapture(e.pointerId);
        card.classList.add('is-dragging');
      });

      card.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        moved = Math.max(moved, Math.hypot(dx, dy));
        card.style.setProperty('--dx', baseDX + dx + 'px');
        card.style.setProperty('--dy', baseDY + dy + 'px');
      });

      const endDrag = () => {
        if (!dragging) return;
        dragging = false;
        card.classList.remove('is-dragging');
        if (moved > 6) {
          card.dataset.dragged = '1';
          window.setTimeout(() => { delete card.dataset.dragged; }, 0);
        }
      };
      card.addEventListener('pointerup', endDrag);
      card.addEventListener('pointercancel', endDrag);
    });
  }

  /* ---------- 02. Spotlight stage ---------- */
  const spot = $('[data-spotlight]');
  if (spot) {
    const imgs = $$('.spot-img', spot);
    const thumbs = $$('.spot-thumb', spot);
    const catEl = $('[data-spot-cat]', spot);
    const titleEl = $('[data-spot-title]', spot);
    const descEl = $('[data-spot-desc]', spot);
    const countEl = $('[data-spot-count]', spot);
    const info = $('[data-spot-info]', spot);
    const openBtn = $('[data-spot-open]', spot);
    let index = 0;

    const pad = (n) => String(n).padStart(2, '0');

    function show(next) {
      if (!imgs.length) return;
      index = (next + imgs.length) % imgs.length;
      const img = imgs[index];

      imgs.forEach((el, i) => el.classList.toggle('is-active', i === index));
      thumbs.forEach((el, i) => {
        const active = i === index;
        el.classList.toggle('is-active', active);
        el.setAttribute('aria-selected', String(active));
      });

      if (catEl) catEl.textContent = img.dataset.cat || '';
      if (titleEl) titleEl.textContent = img.dataset.title || '';
      if (descEl) descEl.textContent = img.dataset.desc || '';
      if (countEl) countEl.textContent = pad(index + 1) + ' / ' + pad(imgs.length);

      if (openBtn) {
        openBtn.dataset.img = img.dataset.full || img.currentSrc || img.src;
        openBtn.dataset.title = img.dataset.title || '';
        openBtn.dataset.meta = img.dataset.meta || img.dataset.cat || '';
      }

      if (info) {
        info.classList.remove('is-switching');
        void info.offsetWidth;
        info.classList.add('is-switching');
      }
    }

    thumbs.forEach((thumb) => {
      thumb.addEventListener('click', () => show(Number(thumb.dataset.index) || 0));
    });

    const prevBtn = $('[data-spot-prev]', spot);
    const nextBtn = $('[data-spot-next]', spot);
    if (prevBtn) prevBtn.addEventListener('click', () => show(index - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => show(index + 1));

    spot.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        show(index - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        show(index + 1);
      }
    });

    show(0);
  }

  /* ---------- 05. Coverflow carousel ---------- */
  const ring = $('[data-ring]');
  if (ring) {
    const cards = $$('.ring-card', ring);
    const prevBtn = $('[data-ring-prev]', ring);
    const nextBtn = $('[data-ring-next]', ring);
    const counter = $('[data-ring-count]', ring);
    const total = cards.length;
    let current = 0;
    let dragged = false;
    let startX = 0;
    let moved = 0;
    let pointerDown = false;

    function layout() {
      const cardWidth = cards[0] ? cards[0].offsetWidth : 260;
      const stepX = cardWidth * 0.44;

      cards.forEach((card, i) => {
        let delta = i - current;
        if (delta > total / 2) delta -= total;
        if (delta < -total / 2) delta += total;

        const abs = Math.abs(delta);
        const scale = Math.max(0.66, 1 - abs * 0.09);

        card.style.transform =
          'translateX(' + (delta * stepX) + 'px) ' +
          'translateZ(' + (-abs * 90) + 'px) ' +
          'rotateY(' + (-delta * 20) + 'deg) ' +
          'scale(' + scale + ')';
        card.style.opacity = abs > 2 ? '0' : '1';
        card.style.zIndex = String(50 - abs);
        card.style.filter = abs === 0 ? 'none' : 'brightness(0.55) saturate(0.7)';
        card.style.pointerEvents = abs > 2 ? 'none' : 'auto';
        card.classList.toggle('is-front', abs === 0);
        card.setAttribute('aria-hidden', abs > 2 ? 'true' : 'false');
        card.tabIndex = abs > 2 ? -1 : 0;
      });

      if (counter) counter.textContent = String(current + 1).padStart(2, '0') + ' / ' + String(total).padStart(2, '0');
    }

    function go(next) {
      current = (next + total) % total;
      layout();
    }

    if (prevBtn) prevBtn.addEventListener('click', () => go(current - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => go(current + 1));

    ring.addEventListener('pointerdown', (e) => {
      if (prefersReduced) return;
      if (e.target.closest('[data-ring-prev], [data-ring-next]')) return;
      pointerDown = true;
      dragged = false;
      moved = 0;
      startX = e.clientX;
      ring.classList.add('is-dragging');
    });

    ring.addEventListener('pointermove', (e) => {
      if (!pointerDown) return;
      moved = e.clientX - startX;
      if (Math.abs(moved) > 40) dragged = true;
    });

    const endDrag = () => {
      if (!pointerDown) return;
      pointerDown = false;
      ring.classList.remove('is-dragging');
      if (dragged) {
        go(current + (moved < 0 ? 1 : -1));
        window.setTimeout(() => { dragged = false; }, 0);
      }
      moved = 0;
    };
    ring.addEventListener('pointerup', endDrag);
    ring.addEventListener('pointercancel', endDrag);
    ring.addEventListener('pointerleave', endDrag);

    cards.forEach((card, i) => {
      card.addEventListener('click', (e) => {
        if (dragged || !card.classList.contains('is-front')) {
          e.preventDefault();
          e.stopImmediatePropagation();
          if (!dragged) go(i);
        }
      });
    });

    let resizeTimer = null;
    window.addEventListener('resize', () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(layout, 150);
    });

    layout();
    window.setTimeout(layout, 120);
  }

  /* ---------- Lightbox ---------- */
  const lightbox = $('#customLightbox');
  const clImg = $('#clImg');
  const clTitle = $('#clTitle');
  const clMeta = $('#clMeta');
  const clCloses = lightbox ? $$('[data-cl-close]', lightbox) : [];

  $$('[data-lightbox]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      if (!lightbox) return;
      if (btn.dataset.dragged) {
        e.preventDefault();
        return;
      }
      clImg.src = btn.dataset.img || '';
      clImg.alt = btn.dataset.title || '';
      clTitle.textContent = btn.dataset.title || '';
      clMeta.textContent = btn.dataset.meta || '';
      lightbox.hidden = false;
      document.body.classList.add('no-scroll');
    });
  });

  function closeLightbox() {
    if (!lightbox || lightbox.hidden) return;
    lightbox.hidden = true;
    document.body.classList.remove('no-scroll');
    clImg.src = '';
  }

  clCloses.forEach((el) => el.addEventListener('click', closeLightbox));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });
})();
