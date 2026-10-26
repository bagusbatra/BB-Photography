(function () {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
      try { localStorage.setItem('bb-theme', next); } catch (e) {}
      syncThemeUI();
    });
  }

  /* To top */
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
      window.scrollTo({ top: $('#main').offsetTop - 70, behavior: prefersReduced ? 'auto' : 'smooth' });
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

  /* Masonry filter */
  const filterGroups = $$('.filter-group');
  filterGroups.forEach((group) => {
    const pills = $$('.filter-pill', group);
    pills.forEach((pill) => {
      pill.addEventListener('click', () => {
        pills.forEach((p) => p.classList.toggle('is-active', p === pill));
        const filter = pill.dataset.filter;
        const items = $$('.masonry-item', group.closest('.gallery-panel'));
        items.forEach((item) => {
          const match = filter === 'all' || item.dataset.category === filter;
          item.style.display = match ? 'inline-block' : 'none';
        });
      });
    });
  });

  /* Tilt */
  const tiltCards = $$('.tilt-card');
  tiltCards.forEach((card) => {
    const inner = $('.tilt-inner', card);
    card.addEventListener('mousemove', (e) => {
      if (prefersReduced) return;
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const dx = (x - cx) / cx;
      const dy = (y - cy) / cy;
      inner.style.transform = `rotateY(${dx * 10}deg) rotateX(${-dy * 10}deg) translateZ(10px)`;
    });
    card.addEventListener('mouseleave', () => {
      inner.style.transform = 'rotateY(0) rotateX(0) translateZ(0)';
    });
  });

  /* Horizontal drag */
  const hTrack = $('#horizontalTrack');
  if (hTrack && !prefersReduced) {
    let isDown = false;
    let startX;
    let scrollLeft;
    hTrack.addEventListener('mousedown', (e) => {
      isDown = true;
      hTrack.classList.add('is-dragging');
      startX = e.pageX - hTrack.offsetLeft;
      scrollLeft = hTrack.scrollLeft;
    });
    window.addEventListener('mouseup', () => {
      isDown = false;
      hTrack.classList.remove('is-dragging');
    });
    hTrack.addEventListener('mouseleave', () => {
      isDown = false;
      hTrack.classList.remove('is-dragging');
    });
    hTrack.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - hTrack.offsetLeft;
      const walk = (x - startX) * 1.4;
      hTrack.scrollLeft = scrollLeft - walk;
    });
    hTrack.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        hTrack.scrollLeft += e.deltaY;
      }
    }, { passive: false });
  }

  /* Parallax */
  const parallaxImgs = $$('.parallax-img');
  if (parallaxImgs.length && 'IntersectionObserver' in window && !prefersReduced) {
    const ioP = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const img = entry.target;
        const update = () => {
          const rect = entry.target.parentElement.getBoundingClientRect();
          const progress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
          const offset = (progress - 0.5) * 40;
          img.style.transform = `translateY(${offset}px)`;
        };
        update();
        window.addEventListener('scroll', update, { passive: true });
        ioP.unobserve(img);
      });
    }, { threshold: 0.2 });
    parallaxImgs.forEach((img) => ioP.observe(img));
  }

  /* Lightbox */
  const lightbox = $('#customLightbox');
  const clImg = $('#clImg');
  const clTitle = $('#clTitle');
  const clMeta = $('#clMeta');
  const clCloses = $$('[data-cl-close]', lightbox);

  $$('[data-lightbox]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!lightbox) return;
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
