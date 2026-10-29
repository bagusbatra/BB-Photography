/* =========================================================
   INS FRAME Photography - main.js
   Semua interaksi halaman: tema, navigasi, reveal, counter,
   filter portofolio, lightbox, slider, accordion, dan form.
   ========================================================= */
(function () {
  'use strict';

  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  /* ---------------------------------------------------------
     Tahun berjalan
     --------------------------------------------------------- */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------------------------------------------------------
     Tema terang / gelap
     --------------------------------------------------------- */
  const themeToggle = $('#themeToggle');
  const metaTheme = $('meta[name="theme-color"]');

  function syncThemeUI() {
    const isDark = document.documentElement.dataset.theme !== 'light';
    if (themeToggle) {
      themeToggle.setAttribute('aria-label', isDark ? 'Ganti ke mode terang' : 'Ganti ke mode gelap');
    }
    if (metaTheme) {
      metaTheme.setAttribute('content', isDark ? '#0b0b0d' : '#eeeef7');
    }
  }

  syncThemeUI();

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      const nextTheme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
      document.documentElement.dataset.theme = nextTheme;
      try {
        localStorage.setItem('insframe-theme', nextTheme);
        localStorage.removeItem('bb-theme');
      } catch (error) {
        /* localStorage bisa diblokir — abaikan */
      }
      syncThemeUI();
    });
  }

  /* ---------------------------------------------------------
     Navigasi mobile
     --------------------------------------------------------- */
  const navToggle = $('#navToggle');
  const primaryNav = $('#primaryNav');
  const navBackdrop = $('#navBackdrop');
  let navCloseTimer = null;

  function openNav() {
    if (!primaryNav || !navToggle || !navBackdrop) return;
    clearTimeout(navCloseTimer);
    primaryNav.classList.add('is-open');
    navToggle.setAttribute('aria-expanded', 'true');
    navToggle.setAttribute('aria-label', 'Tutup menu');
    navBackdrop.hidden = false;
    requestAnimationFrame(function () {
      navBackdrop.classList.add('is-visible');
    });
    document.body.classList.add('no-scroll');
  }

  function closeNav(immediate) {
    if (!primaryNav || !navToggle || !navBackdrop) return;
    primaryNav.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Buka menu');
    navBackdrop.classList.remove('is-visible');
    document.body.classList.remove('no-scroll');
    clearTimeout(navCloseTimer);

    if (immediate) {
      navBackdrop.hidden = true;
    } else {
      navCloseTimer = setTimeout(function () {
        if (!primaryNav.classList.contains('is-open')) navBackdrop.hidden = true;
      }, 400);
    }
  }

  if (navToggle) {
    navToggle.addEventListener('click', function () {
      if (primaryNav.classList.contains('is-open')) closeNav();
      else openNav();
    });
  }

  if (navBackdrop) {
    navBackdrop.addEventListener('click', function () {
      closeNav();
    });
  }

  $$('a', primaryNav || document).forEach(function (link) {
    link.addEventListener('click', function () {
      closeNav();
    });
  });

  window.addEventListener('pageshow', function () {
    closeNav(true);
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && primaryNav && primaryNav.classList.contains('is-open')) {
      closeNav();
      navToggle.focus();
    }
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > 1024) closeNav(true);
  });

  /* ---------------------------------------------------------
     Header, progress bar, tombol ke atas
     --------------------------------------------------------- */
  const header = $('#siteHeader');
  const progressBar = $('#scrollProgress');
  const toTopBtn = $('#toTop');

  function updateScrollUI() {
    const scrollY = window.scrollY || window.pageYOffset;

    if (header) header.classList.toggle('is-scrolled', scrollY > 20);

    if (progressBar) {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const percent = scrollable > 0 ? (scrollY / scrollable) * 100 : 0;
      progressBar.style.width = Math.min(100, Math.max(0, percent)) + '%';
    }

    if (toTopBtn) toTopBtn.classList.toggle('is-visible', scrollY > 600);
  }

  if (toTopBtn) {
    toTopBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  }

  let scrollTicking = false;
  window.addEventListener(
    'scroll',
    function () {
      if (scrollTicking) return;
      scrollTicking = true;
      requestAnimationFrame(function () {
        updateScrollUI();
        scrollTicking = false;
      });
    },
    { passive: true }
  );

  updateScrollUI();

  /* ---------------------------------------------------------
     Animasi reveal saat masuk viewport
     --------------------------------------------------------- */
  const revealElements = $$('.reveal');

  if ('IntersectionObserver' in window && !prefersReducedMotion) {
    const revealObserver = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -50px 0px' }
    );

    revealElements.forEach(function (element) {
      revealObserver.observe(element);
    });
  } else {
    revealElements.forEach(function (element) {
      element.classList.add('is-visible');
    });
  }

  /* ---------------------------------------------------------
     Counter statistik
     --------------------------------------------------------- */
  const statsSection = $('.stats');

  function animateCounter(element) {
    const target = parseFloat(element.dataset.count || '0');
    const decimals = parseInt(element.dataset.decimals || '0', 10);
    const suffix = element.dataset.suffix || '';

    const format = function (value) {
      return value.toLocaleString('id-ID', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }) + suffix;
    };

    if (prefersReducedMotion) {
      element.textContent = format(target);
      return;
    }

    const duration = 1600;
    const startTime = performance.now();

    function tick(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = format(target * eased);

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        element.textContent = format(target);
      }
    }

    requestAnimationFrame(tick);
  }

  if (statsSection) {
    const counters = $$('.stat-num', statsSection);
    let countersStarted = false;

    const runCounters = function () {
      if (countersStarted) return;
      countersStarted = true;
      counters.forEach(animateCounter);
    };

    if ('IntersectionObserver' in window && !prefersReducedMotion) {
      const counterObserver = new IntersectionObserver(
        function (entries, observer) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            runCounters();
            observer.disconnect();
          });
        },
        { threshold: 0.35 }
      );
      counterObserver.observe(statsSection);
    } else {
      runCounters();
    }
  }

  /* ---------------------------------------------------------
     Marquee karya di beranda
     --------------------------------------------------------- */
  const marqueeRoot = $('.pf-marquee[data-marquee]');

  if (marqueeRoot) {
    $$('.pf-track', marqueeRoot).forEach(function (track) {
      const set = $('.pf-set', track);
      const dupSet = $('.pf-set--dup', track);
      if (!set || !dupSet) return;

      const originals = Array.prototype.slice.call(set.children);
      if (!originals.length) return;

      let copyCount = 0;

      /* Setiap set harus lebih lebar dari layar agar loop tidak bolong,
         jadi kartu diulang sesuai lebar viewport. */
      function fit() {
        const sample = set.firstElementChild;
        if (!sample) return;

        const cardWidth = sample.getBoundingClientRect().width;
        const gap = parseFloat(getComputedStyle(set).columnGap) || 0;
        const singleWidth = (cardWidth + gap) * originals.length;
        if (!singleWidth) return;

        const needed = Math.ceil((window.innerWidth * 1.15) / singleWidth);
        const count = Math.min(6, Math.max(1, needed));
        if (count === copyCount) return;

        set.innerHTML = '';
        dupSet.innerHTML = '';

        for (let i = 0; i < count; i += 1) {
          originals.forEach(function (card) {
            set.appendChild(card.cloneNode(true));

            /* Setiap kartu menuju halaman yang sama, jadi duplikat tetap boleh
               diklik - hanya dikeluarkan dari urutan fokus dan pembaca layar. */
            const clone = card.cloneNode(true);
            if (clone.tagName === 'A') clone.setAttribute('tabindex', '-1');
            dupSet.appendChild(clone);
          });
        }

        copyCount = count;
      }

      fit();

      let resizeTimer = null;
      window.addEventListener('resize', function () {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(fit, 180);
      });
    });

    if (!prefersReducedMotion) {
      marqueeRoot.classList.add('is-ready');
    }
  }

  /* ---------------------------------------------------------
     Kartu layanan: sorot cahaya & kemiringan 3D tipis
     --------------------------------------------------------- */
  const serviceCards = $$('.service-card');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  if (serviceCards.length && finePointer.matches && !prefersReducedMotion) {
    const MAX_TILT = 5;

    serviceCards.forEach(function (card) {
      let frame = null;
      let pointerX = 0;
      let pointerY = 0;

      function paint() {
        frame = null;
        const rect = card.getBoundingClientRect();
        if (!rect.width || !rect.height) return;

        const x = (pointerX - rect.left) / rect.width;
        const y = (pointerY - rect.top) / rect.height;

        card.style.setProperty('--mx', (x * 100).toFixed(2) + '%');
        card.style.setProperty('--my', (y * 100).toFixed(2) + '%');
        card.style.setProperty('--ry', ((x - 0.5) * MAX_TILT * 2).toFixed(2) + 'deg');
        card.style.setProperty('--rx', ((0.5 - y) * MAX_TILT * 2).toFixed(2) + 'deg');
      }

      card.addEventListener('pointermove', function (event) {
        if (event.pointerType !== 'mouse') return;
        pointerX = event.clientX;
        pointerY = event.clientY;
        if (frame) return;
        frame = window.requestAnimationFrame(paint);
      });

      card.addEventListener('pointerleave', function () {
        if (frame) {
          window.cancelAnimationFrame(frame);
          frame = null;
        }
        card.style.setProperty('--mx', '50%');
        card.style.setProperty('--my', '0%');
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      });
    });
  }

  /* ---------------------------------------------------------
     Preview Spotlight Stage (halaman layanan)
     --------------------------------------------------------- */
  const stage = $('[data-stage]');

  if (stage) {
    const stageImgs = $$('.stage-img', stage);
    const stageThumbs = $$('.stage-thumb', stage);
    const stageCat = $('[data-stage-cat]', stage);
    const stageTitle = $('[data-stage-title]', stage);
    const stageDesc = $('[data-stage-desc]', stage);
    const stageCount = $('[data-stage-count]', stage);
    const stageInfo = $('[data-stage-info]', stage);
    const stageFrame = $('.stage-frame', stage);
    let stageIndex = 0;

    const pad = (n) => String(n).padStart(2, '0');

    function showStage(next) {
      if (!stageImgs.length) return;
      stageIndex = (next + stageImgs.length) % stageImgs.length;
      const img = stageImgs[stageIndex];

      stageImgs.forEach((el, i) => el.classList.toggle('is-active', i === stageIndex));
      stageThumbs.forEach((el, i) => {
        const active = i === stageIndex;
        el.classList.toggle('is-active', active);
        el.setAttribute('aria-pressed', String(active));
      });

      if (stageCat) stageCat.textContent = img.dataset.cat || '';
      if (stageTitle) stageTitle.textContent = img.dataset.title || '';
      if (stageDesc) stageDesc.textContent = img.dataset.desc || '';
      if (stageCount) {
        stageCount.textContent = pad(stageIndex + 1) + ' / ' + pad(stageImgs.length);
      }

      if (stageInfo) {
        stageInfo.classList.remove('is-switching');
        void stageInfo.offsetWidth;
        stageInfo.classList.add('is-switching');
      }
    }

    stageThumbs.forEach((thumb) => {
      thumb.addEventListener('click', () => showStage(Number(thumb.dataset.index) || 0));
    });

    const stagePrev = $('[data-stage-prev]', stage);
    const stageNext = $('[data-stage-next]', stage);
    if (stagePrev) stagePrev.addEventListener('click', () => showStage(stageIndex - 1));
    if (stageNext) stageNext.addEventListener('click', () => showStage(stageIndex + 1));

    if (stageFrame) {
      stageFrame.addEventListener('keydown', function (event) {
        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          showStage(stageIndex - 1);
        } else if (event.key === 'ArrowRight') {
          event.preventDefault();
          showStage(stageIndex + 1);
        }
      });
    }

    showStage(0);
  }

  /* ---------------------------------------------------------
     Filter portofolio
     --------------------------------------------------------- */
  const filterButtons = $$('.filter-btn');
  const portfolioItems = $$('.portfolio-item');

  filterButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      const filter = button.dataset.filter;

      filterButtons.forEach(function (item) {
        const isActive = item === button;
        item.classList.toggle('is-active', isActive);
        item.setAttribute('aria-pressed', String(isActive));
      });

      portfolioItems.forEach(function (item) {
        const matches = filter === 'all' || item.dataset.category === filter;
        item.classList.toggle('is-hidden', !matches);
      });
    });
  });

  /* ---------------------------------------------------------
     Lightbox portofolio
     --------------------------------------------------------- */
  const lightbox = $('#lightbox');
  const lightboxImg = $('#lightboxImg');
  const lightboxTitle = $('#lightboxTitle');
  const lightboxMeta = $('#lightboxMeta');
  const lightboxClose = $('.lightbox-close', lightbox || document);
  const lightboxPrev = $('#lightboxPrev');
  const lightboxNext = $('#lightboxNext');

  let visiblePortfolio = [];
  let lightboxIndex = 0;
  let lastFocusedElement = null;

  function renderLightbox() {
    const item = visiblePortfolio[lightboxIndex];
    if (!item) return;

    lightboxImg.src = item.dataset.img;
    lightboxImg.alt = item.dataset.title;
    lightboxTitle.textContent = item.dataset.title;
    lightboxMeta.textContent = item.dataset.meta;
  }

  /* Anchor per karya: URL bisa dibagikan dan langsung membuka karya. */
  function currentGalleryHash() {
    const hash = window.location.hash || '';
    return /^#karya-[a-z0-9-]+$/.test(hash) ? hash : '';
  }

  function setGalleryHash(anchor) {
    if (!anchor || window.location.hash === '#' + anchor) return;
    try {
      history.replaceState(null, '', '#' + anchor);
    } catch (error) {
      /* file:// atau mode privasi ketat — abaikan */
    }
  }

  function clearGalleryHash() {
    if (!currentGalleryHash()) return;
    try {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    } catch (error) {
      /* abaikan */
    }
  }

  function revealPortfolioItem(item) {
    if (!item || !item.classList.contains('is-hidden')) return;
    const allButton = filterButtons.find(function (button) {
      return button.dataset.filter === 'all';
    });
    if (allButton) allButton.click();
  }

  function openLightbox(item, options) {
    if (!lightbox || !item) return;

    revealPortfolioItem(item);

    visiblePortfolio = portfolioItems.filter(function (portfolioItem) {
      return !portfolioItem.classList.contains('is-hidden');
    });

    lightboxIndex = Math.max(0, visiblePortfolio.indexOf(item));
    lastFocusedElement = document.activeElement;

    renderLightbox();
    lightbox.hidden = false;
    document.body.classList.add('no-scroll');

    if (!options || !options.keepHash) setGalleryHash(item.id);

    if (lightboxClose) lightboxClose.focus();
  }

  function closeLightbox(options) {
    if (!lightbox) return;

    if (!lightbox.hidden) {
      lightbox.hidden = true;
      document.body.classList.remove('no-scroll');

      if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
        lastFocusedElement.focus();
      }
    }

    if (!options || !options.keepHash) clearGalleryHash();
  }

  function openFromGalleryHash() {
    const hash = currentGalleryHash();

    if (!hash) {
      if (lightbox && !lightbox.hidden) closeLightbox({ keepHash: true });
      return;
    }

    const item = document.getElementById(hash.slice(1));
    if (!item || !item.classList.contains('portfolio-item')) return;

    openLightbox(item, { keepHash: true });
  }

  function stepLightbox(direction) {
    if (!visiblePortfolio.length) return;
    lightboxIndex = (lightboxIndex + direction + visiblePortfolio.length) % visiblePortfolio.length;
    renderLightbox();
    setGalleryHash(visiblePortfolio[lightboxIndex].id);
  }

  portfolioItems.forEach(function (item) {
    item.addEventListener('click', function (event) {
      const target = event.target;

      /* Tautan permanen membiarkan browser mengubah hash; hashchange
         yang membuka lightbox agar URL tetap bisa dibagikan. */
      if (target && target.closest && target.closest('.portfolio-anchor')) return;
      if (target && target.closest && target.closest('.portfolio-open')) {
        event.preventDefault();
      }

      openLightbox(item);
    });
  });

  if (lightbox) {
    window.addEventListener('hashchange', openFromGalleryHash);
    openFromGalleryHash();

    $$('[data-close]', lightbox).forEach(function (element) {
      element.addEventListener('click', function () {
        closeLightbox();
      });
    });

    if (lightboxPrev) {
      lightboxPrev.addEventListener('click', function () {
        stepLightbox(-1);
      });
    }

    if (lightboxNext) {
      lightboxNext.addEventListener('click', function () {
        stepLightbox(1);
      });
    }

    document.addEventListener('keydown', function (event) {
      if (lightbox.hidden) return;

      if (event.key === 'Escape') {
        closeLightbox();
        return;
      }

      if (event.key === 'ArrowRight') {
        stepLightbox(1);
        return;
      }

      if (event.key === 'ArrowLeft') {
        stepLightbox(-1);
        return;
      }

      if (event.key === 'Tab') {
        const focusable = [lightboxClose, lightboxPrev, lightboxNext].filter(Boolean);
        if (!focusable.length) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });
  }

  /* ---------------------------------------------------------
     Slider testimoni
     --------------------------------------------------------- */
  const testimonialSlider = $('#testimonialSlider');
  const testimonialTrack = $('#testimonialTrack');
  const slides = testimonialTrack ? $$('.slide', testimonialTrack) : [];
  const sliderDotsWrap = $('#sliderDots');

  let slideIndex = 0;
  let slideTimer = null;
  let touchStartX = 0;

  function goToSlide(index) {
    if (!testimonialTrack || !slides.length) return;

    slideIndex = (index + slides.length) % slides.length;
    testimonialTrack.style.transform = 'translateX(-' + slideIndex * 100 + '%)';

    $$('.slider-dot', sliderDotsWrap || document).forEach(function (dot, dotIndex) {
      const isActive = dotIndex === slideIndex;
      dot.classList.toggle('is-active', isActive);
      dot.setAttribute('aria-current', isActive ? 'true' : 'false');
    });
  }

  function stopAutoSlide() {
    if (slideTimer) {
      clearInterval(slideTimer);
      slideTimer = null;
    }
  }

  function startAutoSlide() {
    stopAutoSlide();
    if (prefersReducedMotion || slides.length < 2) return;
    slideTimer = setInterval(function () {
      goToSlide(slideIndex + 1);
    }, 6500);
  }

  if (testimonialTrack && sliderDotsWrap) {
    slides.forEach(function (_, index) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'slider-dot';
      dot.setAttribute('aria-label', 'Testimoni ' + (index + 1));
      dot.addEventListener('click', function () {
        goToSlide(index);
        startAutoSlide();
      });
      sliderDotsWrap.appendChild(dot);
    });

    $$('[data-slide]', testimonialSlider).forEach(function (button) {
      button.addEventListener('click', function () {
        goToSlide(button.dataset.slide === 'next' ? slideIndex + 1 : slideIndex - 1);
        startAutoSlide();
      });
    });

    testimonialSlider.addEventListener('mouseenter', stopAutoSlide);
    testimonialSlider.addEventListener('mouseleave', startAutoSlide);
    testimonialSlider.addEventListener('focusin', stopAutoSlide);
    testimonialSlider.addEventListener('focusout', function (event) {
      if (!testimonialSlider.contains(event.relatedTarget)) startAutoSlide();
    });

    testimonialSlider.addEventListener(
      'touchstart',
      function (event) {
        touchStartX = event.touches[0].clientX;
        stopAutoSlide();
      },
      { passive: true }
    );

    testimonialSlider.addEventListener(
      'touchend',
      function (event) {
        const distance = event.changedTouches[0].clientX - touchStartX;
        if (Math.abs(distance) > 45) {
          goToSlide(distance < 0 ? slideIndex + 1 : slideIndex - 1);
        }
        startAutoSlide();
      },
      { passive: true }
    );

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stopAutoSlide();
      else startAutoSlide();
    });

    goToSlide(0);
    startAutoSlide();
  }

  /* ---------------------------------------------------------
     Accordion FAQ
     --------------------------------------------------------- */
  const accordionItems = $$('.acc-item');

  accordionItems.forEach(function (item) {
    const trigger = $('.acc-trigger', item);
    const panel = $('.acc-panel', item);
    if (!trigger || !panel) return;

    trigger.addEventListener('click', function () {
      const willOpen = !item.classList.contains('is-open');

      accordionItems.forEach(function (otherItem) {
        if (otherItem === item) return;
        otherItem.classList.remove('is-open');
        const otherTrigger = $('.acc-trigger', otherItem);
        const otherPanel = $('.acc-panel', otherItem);
        if (otherTrigger) otherTrigger.setAttribute('aria-expanded', 'false');
        if (otherPanel) otherPanel.style.maxHeight = null;
      });

      item.classList.toggle('is-open', willOpen);
      trigger.setAttribute('aria-expanded', String(willOpen));
      panel.style.maxHeight = willOpen ? panel.scrollHeight + 'px' : null;
    });
  });

  window.addEventListener('resize', function () {
    const openItem = $('.acc-item.is-open');
    if (!openItem) return;
    const openPanel = $('.acc-panel', openItem);
    if (openPanel) openPanel.style.maxHeight = openPanel.scrollHeight + 'px';
  });

  /* ---------------------------------------------------------
     Form booking
     --------------------------------------------------------- */
  const bookingForm = $('#bookingForm');
  const dateInput = $('#date');
  const serviceSelect = $('#service');
  const packageSelect = $('#package');

  if (dateInput) {
    const now = new Date();
    const localToday = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 10);
    dateInput.min = localToday;
  }

  /* Preselect layanan / paket dari tautan antarhalaman, mis. kontak.html?layanan=wedding
     Pilihan dicocokkan dengan opsi yang dirender dari js/site-data.js agar item
     yang ditambahkan lewat panel admin juga bisa ditautkan. */
  const urlParams = new URLSearchParams(window.location.search);

  function optionSlug(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function selectOptionBySlug(select, value) {
    if (!select || !value) return false;
    const target = optionSlug(value);
    if (!target) return false;

    const match = Array.from(select.options).find(function (option) {
      return option.value && (optionSlug(option.value) === target || optionSlug(option.textContent) === target);
    });

    if (!match) return false;
    select.value = match.value;
    return true;
  }

  if (serviceSelect) {
    selectOptionBySlug(serviceSelect, urlParams.get('layanan'));
  }

  if (packageSelect) {
    selectOptionBySlug(packageSelect, urlParams.get('paket'));
  }

  function getFieldError(input) {
    const value = input.value.trim();

    switch (input.id) {
      case 'name':
        if (value.length < 2) return 'Nama minimal 2 karakter.';
        break;
      case 'phone': {
        const digits = value.replace(/\D/g, '');
        if (digits.length < 9 || digits.length > 15) {
          return 'Masukkan nomor WhatsApp yang valid (9–15 digit).';
        }
        break;
      }
      case 'email':
        if (!EMAIL_PATTERN.test(value)) return 'Masukkan alamat email yang valid.';
        break;
      case 'service':
        if (!value) return 'Pilih jenis sesi.';
        break;
      case 'date':
        if (!value) return 'Pilih rencana tanggal.';
        if (dateInput && dateInput.min && value < dateInput.min) {
          return 'Tanggal tidak boleh di masa lalu.';
        }
        break;
      default:
        break;
    }

    return '';
  }

  function setFieldError(input, message) {
    const field = input.closest('.field');
    const errorElement = $('[data-error-for="' + input.id + '"]', bookingForm || document);

    if (!field) return;

    if (message) {
      field.classList.add('has-error');
      input.setAttribute('aria-invalid', 'true');
      if (errorElement) errorElement.textContent = message;
    } else {
      field.classList.remove('has-error');
      input.removeAttribute('aria-invalid');
      if (errorElement) errorElement.textContent = '';
    }
  }

  if (bookingForm) {
    const submitButton = $('button[type="submit"]', bookingForm);
    const successMessage = $('#formSuccess');
    const requiredFields = $$('input[required], select[required], textarea[required]', bookingForm);
    let successTimer = null;

    requiredFields.forEach(function (input) {
      const eventName = input.tagName === 'SELECT' ? 'change' : 'input';
      input.addEventListener(eventName, function () {
        if (input.closest('.field').classList.contains('has-error')) {
          setFieldError(input, getFieldError(input));
        }
      });
    });

    bookingForm.addEventListener('submit', function (event) {
      event.preventDefault();

      let firstInvalid = null;

      requiredFields.forEach(function (input) {
        const message = getFieldError(input);
        setFieldError(input, message);
        if (message && !firstInvalid) firstInvalid = input;
      });

      if (firstInvalid) {
        firstInvalid.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'center' });
        firstInvalid.focus({ preventScroll: true });
        return;
      }

      const originalMarkup = submitButton.innerHTML;
      submitButton.disabled = true;
      submitButton.style.opacity = '0.72';
      submitButton.textContent = 'Mengirim...';

      /* Simulasi pengiriman — ganti dengan fetch() ke endpoint saat backend tersedia */
      setTimeout(function () {
        bookingForm.reset();
        $$('.field', bookingForm).forEach(function (field) {
          field.classList.remove('has-error');
        });

        submitButton.disabled = false;
        submitButton.style.opacity = '';
        submitButton.innerHTML = originalMarkup;

        if (successMessage) {
          clearTimeout(successTimer);
          successMessage.hidden = false;
          successMessage.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'center' });
          successTimer = setTimeout(function () {
            successMessage.hidden = true;
          }, 8000);
        }
      }, 900);
    });
  }

  /* ---------------------------------------------------------
     Instagram Highlight: foto tampil 5 detik
     --------------------------------------------------------- */
  const hlItems = $$('.hl-item');
  const hlViewer = $('#hlViewer');
  const hlViewerImg = $('#hlViewerImg');
  const hlViewerCat = $('#hlViewerCat');
  const hlViewerTitle = $('#hlViewerTitle');
  const hlViewerCaption = $('#hlViewerCaption');
  const hlViewerClose = $('#hlViewerClose');
  const HIGHLIGHT_DURATION = 5000;

  let hlCloseTimer = null;
  let hlLastFocused = null;

  function closeHighlight() {
    if (!hlViewer || hlViewer.hidden) return;

    clearTimeout(hlCloseTimer);
    hlViewer.classList.remove('is-open');
    hlViewer.hidden = true;
    document.body.classList.remove('no-scroll');

    if (hlLastFocused && typeof hlLastFocused.focus === 'function') {
      hlLastFocused.focus();
    }
  }

  function openHighlight(item) {
    if (!hlViewer || !hlViewerImg) return;

    hlViewerImg.src = item.dataset.hlImg;
    hlViewerImg.alt = item.dataset.hlCat + ' — ' + item.dataset.hlTitle;
    hlViewerCat.textContent = item.dataset.hlCat;
    hlViewerTitle.textContent = item.dataset.hlTitle;
    hlViewerCaption.textContent = item.dataset.hlCaption;

    hlLastFocused = item;
    hlViewer.hidden = false;
    document.body.classList.add('no-scroll');

    /* Paksa reflow agar animasi progress dan dialog dimulai dari awal. */
    void hlViewer.offsetWidth;
    hlViewer.classList.add('is-open');

    if (hlViewerClose) hlViewerClose.focus();

    clearTimeout(hlCloseTimer);
    hlCloseTimer = window.setTimeout(closeHighlight, HIGHLIGHT_DURATION);
  }

  hlItems.forEach(function (item) {
    item.addEventListener('click', function () {
      openHighlight(item);
    });
  });

  if (hlViewer) {
    $$('[data-hl-close]', hlViewer).forEach(function (element) {
      element.addEventListener('click', closeHighlight);
    });

    if (hlViewerClose) {
      hlViewerClose.addEventListener('click', closeHighlight);
    }

    document.addEventListener('keydown', function (event) {
      if (hlViewer.hidden) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        closeHighlight();
        return;
      }

      /* Dialog hanya punya satu kontrol, jadi fokus ditahan di tombol tutup. */
      if (event.key === 'Tab') {
        event.preventDefault();
        if (hlViewerClose) hlViewerClose.focus();
      }
    });
  }

  /* ---------------------------------------------------------
     Process explorer halaman proses
     --------------------------------------------------------- */
  const processRoot = $('[data-process]');

  if (processRoot) {
    const processTabs = $$('[role="tab"]', processRoot);
    const processPanels = $$('[role="tabpanel"]', processRoot);
    const processNav = $('.process-nav', processRoot);
    const processPrev = $('[data-process-prev]', processRoot);
    const processNext = $('[data-process-next]', processRoot);
    const processCurrent = $('[data-process-current]', processRoot);
    const processStatus = $('[data-process-status]', processRoot);
    let processIndex = 0;

    const formatProcessNumber = (number) => String(number).padStart(2, '0');

    function syncProcessOrientation() {
      if (!processNav) return;
      const isVertical = getComputedStyle(processNav).flexDirection === 'column';
      processNav.setAttribute('aria-orientation', isVertical ? 'vertical' : 'horizontal');
    }

    function showProcessStage(nextIndex, moveFocus) {
      if (!processTabs.length) return;

      processIndex = (nextIndex + processTabs.length) % processTabs.length;

      processTabs.forEach(function (tab, index) {
        const active = index === processIndex;
        tab.classList.toggle('is-active', active);
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
      });

      processPanels.forEach(function (panel, index) {
        const active = index === processIndex;
        panel.classList.toggle('is-active', active);

        if (active) {
          panel.removeAttribute('aria-hidden');
          panel.removeAttribute('inert');
        } else {
          panel.setAttribute('aria-hidden', 'true');
          panel.setAttribute('inert', '');
        }
      });

      if (processCurrent) {
        processCurrent.textContent = formatProcessNumber(processIndex + 1);
      }

      if (processStatus) {
        const activeTab = processTabs[processIndex];
        const activeLabel = activeTab ? $('.process-tab-copy strong', activeTab) : null;
        processStatus.textContent =
          'Tahap ' + (processIndex + 1) + ' dari ' + processTabs.length + ': ' +
          (activeLabel ? activeLabel.textContent : '');
      }

      const activeTab = processTabs[processIndex];
      if (processNav && activeTab && processNav.scrollWidth > processNav.clientWidth + 1) {
        const navRect = processNav.getBoundingClientRect();
        const tabRect = activeTab.getBoundingClientRect();

        if (tabRect.left < navRect.left || tabRect.right > navRect.right) {
          processNav.scrollTo({
            left: Math.max(0, processNav.scrollLeft + tabRect.left - navRect.left - 8),
            behavior: prefersReducedMotion ? 'auto' : 'smooth'
          });
        }
      }

      if (moveFocus && activeTab) activeTab.focus();
    }

    processTabs.forEach(function (tab, index) {
      tab.addEventListener('click', function () {
        showProcessStage(index, false);
      });

      tab.addEventListener('keydown', function (event) {
        let targetIndex = null;

        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
          targetIndex = index + 1;
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
          targetIndex = index - 1;
        } else if (event.key === 'Home') {
          targetIndex = 0;
        } else if (event.key === 'End') {
          targetIndex = processTabs.length - 1;
        }

        if (targetIndex === null) return;

        event.preventDefault();
        showProcessStage(targetIndex, true);
      });
    });

    if (processPrev) {
      processPrev.addEventListener('click', function () {
        showProcessStage(processIndex - 1, false);
      });
    }

    if (processNext) {
      processNext.addEventListener('click', function () {
        showProcessStage(processIndex + 1, false);
      });
    }

    syncProcessOrientation();
    window.addEventListener('resize', syncProcessOrientation);
    showProcessStage(0, false);
  }

  /* ---------------------------------------------------------
     Checklist persiapan halaman proses
     --------------------------------------------------------- */
  const prepRoot = $('[data-prep]');

  if (prepRoot) {
    const prepItems = $$('[data-prep-item]', prepRoot);
    const prepCount = $('[data-prep-count]', prepRoot);
    const prepBar = $('[data-prep-bar]', prepRoot);
    const prepProgress = $('[data-prep-progress]', prepRoot);
    const prepMessage = $('[data-prep-message]', prepRoot);
    const prepReset = $('[data-prep-reset]', prepRoot);
    const PREP_STORAGE_KEY = 'bb-prep-checklist';

    function readPrepState() {
      try {
        const raw = localStorage.getItem(PREP_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        return [];
      }
    }

    function savePrepState() {
      const state = prepItems.map(function (item) {
        return Boolean(item.checked);
      });

      try {
        localStorage.setItem(PREP_STORAGE_KEY, JSON.stringify(state));
      } catch (error) {
        /* localStorage bisa diblokir — checklist tetap berfungsi di sesi ini */
      }
    }

    function updatePrepUI() {
      const total = prepItems.length;
      const checked = prepItems.filter(function (item) {
        return item.checked;
      }).length;
      const percent = total ? (checked / total) * 100 : 0;

      if (prepCount) prepCount.textContent = String(checked);
      if (prepBar) prepBar.style.width = percent + '%';
      if (prepProgress) prepProgress.setAttribute('aria-valuenow', String(checked));

      if (prepMessage) {
        if (total && checked === total) {
          prepMessage.textContent = 'Semua siap. Sampai jumpa di hari-H.';
        } else if (checked === 0) {
          prepMessage.textContent = 'Progres tersimpan di browser ini.';
        } else {
          prepMessage.textContent = 'Sedikit lagi. Progres tersimpan di browser ini.';
        }
      }

      prepRoot.classList.toggle('is-complete', total > 0 && checked === total);
    }

    const savedPrepState = readPrepState();

    prepItems.forEach(function (item, index) {
      item.checked = Boolean(savedPrepState[index]);
      item.addEventListener('change', function () {
        savePrepState();
        updatePrepUI();
      });
    });

    if (prepReset) {
      prepReset.addEventListener('click', function () {
        prepItems.forEach(function (item) {
          item.checked = false;
        });

        try {
          localStorage.removeItem(PREP_STORAGE_KEY);
        } catch (error) {
          /* abaikan jika localStorage tidak tersedia */
        }

        updatePrepUI();
      });
    }

    updatePrepUI();
  }

  /* ---------------------------------------------------------
     Newsletter footer
     --------------------------------------------------------- */
  const newsletterForm = $('#newsletterForm');
  const newsletterMsg = $('#newsletterMsg');

  if (newsletterForm && newsletterMsg) {
    newsletterForm.addEventListener('submit', function (event) {
      event.preventDefault();

      const input = $('#newsletterEmail');
      const value = input ? input.value.trim() : '';
      const isValid = EMAIL_PATTERN.test(value);

      newsletterMsg.hidden = false;
      newsletterMsg.classList.toggle('is-error', !isValid);
      newsletterMsg.textContent = isValid
        ? 'Terima kasih! Cek inbox kamu untuk konfirmasi.'
        : 'Masukkan email yang valid, ya.';

      if (isValid) {
        newsletterForm.reset();
        setTimeout(function () {
          newsletterMsg.hidden = true;
        }, 7000);
      }
    });
  }
})();
