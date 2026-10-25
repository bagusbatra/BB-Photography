/* =========================================================
   BB Photography — main.js
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
      metaTheme.setAttribute('content', isDark ? '#0b0b0d' : '#f7f4ee');
    }
  }

  syncThemeUI();

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      const nextTheme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
      document.documentElement.dataset.theme = nextTheme;
      try {
        localStorage.setItem('bb-theme', nextTheme);
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

  function openLightbox(item) {
    if (!lightbox) return;

    visiblePortfolio = portfolioItems.filter(function (portfolioItem) {
      return !portfolioItem.classList.contains('is-hidden');
    });

    lightboxIndex = Math.max(0, visiblePortfolio.indexOf(item));
    lastFocusedElement = document.activeElement;

    renderLightbox();
    lightbox.hidden = false;
    document.body.classList.add('no-scroll');

    if (lightboxClose) lightboxClose.focus();
  }

  function closeLightbox() {
    if (!lightbox || lightbox.hidden) return;

    lightbox.hidden = true;
    document.body.classList.remove('no-scroll');

    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
      lastFocusedElement.focus();
    }
  }

  function stepLightbox(direction) {
    if (!visiblePortfolio.length) return;
    lightboxIndex = (lightboxIndex + direction + visiblePortfolio.length) % visiblePortfolio.length;
    renderLightbox();
  }

  portfolioItems.forEach(function (item) {
    item.addEventListener('click', function () {
      openLightbox(item);
    });
  });

  if (lightbox) {
    $$('[data-close]', lightbox).forEach(function (element) {
      element.addEventListener('click', closeLightbox);
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

  /* Preselect layanan / paket dari tautan antarhalaman, mis. kontak.html?layanan=wedding */
  const serviceMap = {
    graduation: 'Graduation',
    couple: 'Couple',
    'personal-branding': 'Personal Branding',
    beauty: 'Beauty',
    prewedding: 'Prewedding',
    wedding: 'Wedding',
    engagement: 'Engagement',
    event: 'Event',
    street: 'Street',
    architecture: 'Architecture',
    travel: 'Travel',
    night: 'Night'
  };
  const urlParams = new URLSearchParams(window.location.search);

  if (serviceSelect) {
    const serviceSlug = urlParams.get('layanan');
    if (serviceSlug && serviceMap[serviceSlug]) {
      serviceSelect.value = serviceMap[serviceSlug];
    }
  }

  if (packageSelect) {
    const selectedPackage = urlParams.get('paket');
    const validPackages = ['Silver', 'Gold', 'Platinum', 'Custom'];
    if (selectedPackage && validPackages.indexOf(selectedPackage) !== -1) {
      packageSelect.value = selectedPackage;
    }
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
