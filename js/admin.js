/* =========================================================
   INS FRAME Photography — admin.js
   Panel studio tanpa login. Semua data disimpan di localStorage
   browser ini (mode lokal), dengan cadangan ekspor/impor JSON.
   ========================================================= */
(function () {
  'use strict';

  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));

  const STORAGE_KEYS = {
    gallery: 'insframe.admin.gallery.v1',
    bookings: 'insframe.admin.bookings.v1',
    settings: 'insframe.admin.settings.v1'
  };

  const VIEW_TITLES = {
    dashboard: 'Dashboard',
    galeri: 'Kelola Karya',
    pesanan: 'Pesanan',
    pengaturan: 'Pengaturan'
  };

  const STATUS_LABELS = {
    baru: 'Baru',
    dikonfirmasi: 'Dikonfirmasi',
    selesai: 'Selesai',
    batal: 'Batal'
  };

  const PACKAGE_PRICES = {
    Silver: 3500000,
    Gold: 6500000,
    Platinum: 12000000,
    Custom: 8500000
  };

  const CATEGORIES = [
    'Wedding', 'Prewedding', 'Engagement', 'Portrait', 'Event',
    'Graduation', 'Personal Branding', 'Couple', 'Family', 'Lainnya'
  ];

  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

  const FALLBACK_IMAGE = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">' +
    '<rect width="400" height="300" fill="#16161a"/>' +
    '<g fill="none" stroke="#d4af37" stroke-width="6" stroke-linejoin="round">' +
    '<path d="M126 112h27l13-20h68l13 20h27a10 10 0 0 1 10 10v66a10 10 0 0 1-10 10H126a10 10 0 0 1-10-10v-66a10 10 0 0 1 10-10Z"/>' +
    '<circle cx="200" cy="160" r="27"/></g></svg>'
  );

  const memoryStore = Object.create(null);

  const state = {
    gallery: [],
    bookings: [],
    settings: {},
    filters: {
      galleryQuery: '',
      galleryCategory: 'all',
      galleryStatus: 'all',
      orderQuery: '',
      orderStatus: 'all'
    },
    currentView: 'dashboard',
    editingId: null,
    confirmResolve: null,
    workLastFocus: null,
    confirmLastFocus: null,
    toastTimer: null
  };

  /* ---------------------------------------------------------
     Util
     --------------------------------------------------------- */
  function pad(value) {
    return String(value).padStart(2, '0');
  }

  function localISO(date) {
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
  }

  function offsetISO(days) {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + days);
    return localISO(date);
  }

  function todayISO() {
    return localISO(new Date());
  }

  function parseDate(iso) {
    return new Date(iso + 'T12:00:00');
  }

  function formatDate(iso) {
    if (!iso || !DATE_PATTERN.test(iso)) return 'Tanggal belum diatur';
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(parseDate(iso));
  }

  function longToday() {
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date());
  }

  function shortRupiah(value) {
    if (!value) return 'Rp 0';
    if (value >= 1000000000) {
      return 'Rp ' + (value / 1000000000).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + ' M';
    }
    if (value >= 1000000) {
      return 'Rp ' + (value / 1000000).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + ' jt';
    }
    return 'Rp ' + value.toLocaleString('id-ID');
  }

  function escapeHTML(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (character) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[character];
    });
  }

  function initials(name) {
    const words = String(name || '')
      .replace(/[^\p{L}\s]/gu, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (!words.length) return '?';
    return (words[0].charAt(0) + (words[1] ? words[1].charAt(0) : '')).toUpperCase();
  }

  function makeId(prefix) {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return prefix + '-' + window.crypto.randomUUID().slice(0, 8);
    }
    return prefix + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function whatsappHref(phone) {
    let digits = String(phone || '').replace(/[^\d]/g, '');
    if (!digits) return '';
    if (digits.charAt(0) === '0') digits = '62' + digits.slice(1);
    if (digits.charAt(0) === '8') digits = '62' + digits;
    return 'https://wa.me/' + digits;
  }

  /* ---------------------------------------------------------
     Penyimpanan lokal
     --------------------------------------------------------- */
  function readStore(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) return JSON.parse(raw);
    } catch (error) {
      /* localStorage bisa diblokir - gunakan salinan memori */
    }

    if (Object.prototype.hasOwnProperty.call(memoryStore, key)) {
      return JSON.parse(JSON.stringify(memoryStore[key]));
    }

    return fallback;
  }

  function writeStore(key, value) {
    memoryStore[key] = value;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      /* Data tetap hidup selama tab ini terbuka */
    }
  }

  function removeStore(key) {
    delete memoryStore[key];
    try {
      localStorage.removeItem(key);
    } catch (error) {
      /* abaikan */
    }
  }

  /* ---------------------------------------------------------
     Data awal
     --------------------------------------------------------- */
  function seedGallery() {
    return [
      {
        id: 'work-golden-vows', title: 'Golden Vows', category: 'Wedding',
        date: offsetISO(-4), visible: true,
        image: 'https://images.unsplash.com/photo-1529636798458-92182e662485?auto=format&fit=crop&w=800&q=80',
        alt: 'Pasangan pengantin di tepi pantai saat golden hour'
      },
      {
        id: 'work-soft-light', title: 'Soft Light', category: 'Portrait',
        date: offsetISO(-12), visible: true,
        image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
        alt: 'Potret perempuan dengan cahaya jendela yang lembut'
      },
      {
        id: 'work-afterglow', title: 'Afterglow', category: 'Event',
        date: offsetISO(-20), visible: true,
        image: 'https://images.unsplash.com/photo-1505236858219-8359eb29e329?auto=format&fit=crop&w=800&q=80',
        alt: 'Suasana pesta dengan pencahayaan hangat'
      },
      {
        id: 'work-sunset-embrace', title: 'Sunset Embrace', category: 'Prewedding',
        date: offsetISO(-28), visible: true,
        image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
        alt: 'Pasangan pengantin berpelukan saat matahari terbenam'
      },
      {
        id: 'work-the-details', title: 'The Details', category: 'Wedding',
        date: offsetISO(-38), visible: true,
        image: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=800&q=80',
        alt: 'Detail cincin pernikahan di atas kain'
      },
      {
        id: 'work-garden-walk', title: 'Garden Walk', category: 'Prewedding',
        date: offsetISO(-50), visible: true,
        image: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=800&q=80',
        alt: 'Pengantin berjalan bergandengan di taman'
      },
      {
        id: 'work-unfiltered', title: 'Unfiltered', category: 'Portrait',
        date: offsetISO(-62), visible: true,
        image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80',
        alt: 'Potret close up dengan ekspresi natural'
      },
      {
        id: 'work-langkah-awal', title: 'Langkah Awal', category: 'Engagement',
        date: offsetISO(-76), visible: false,
        image: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=800&q=80',
        alt: 'Pasangan berjalan bersama di tepi pantai'
      }
    ];
  }

  function seedBookings() {
    return [
      {
        id: 'book-rania-arga', name: 'Rania & Arga', service: 'Wedding',
        date: offsetISO(18), package: 'Platinum', status: 'dikonfirmasi',
        phone: '6281234567891', email: 'rania@example.com',
        note: 'Akad pagi di Uluwatu, resepsi sore. Minta dokumentasi drone.'
      },
      {
        id: 'book-della', name: 'Della Puspita', service: 'Graduation',
        date: offsetISO(6), package: 'Silver', status: 'baru',
        phone: '6281234567892', email: 'della@example.com',
        note: 'Sesi foto wisuda di kampus, minta 2 lokasi.'
      },
      {
        id: 'book-kevin-sinta', name: 'Kevin & Sinta', service: 'Prewedding',
        date: offsetISO(31), package: 'Gold', status: 'baru',
        phone: '6281234567893', email: 'kevin@example.com',
        note: 'Konsep pantai saat sunset, butuh make-up artist.'
      },
      {
        id: 'book-nara', name: 'PT Nara Kreatif', service: 'Personal Branding',
        date: offsetISO(12), package: 'Custom', status: 'dikonfirmasi',
        phone: '6281234567894', email: 'halo@nara.example',
        note: 'Foto profil tim untuk website perusahaan.'
      },
      {
        id: 'book-bagas-nia', name: 'Bagas & Nia', service: 'Wedding',
        date: offsetISO(-9), package: 'Gold', status: 'selesai',
        phone: '6281234567895', email: 'bagas@example.com',
        note: 'Sudah selesai, album dikirim minggu lalu.'
      },
      {
        id: 'book-andre', name: 'Andre Wijaya', service: 'Couple',
        date: offsetISO(-2), package: 'Silver', status: 'batal',
        phone: '6281234567896', email: 'andre@example.com',
        note: 'Menunda karena jadwal kerja.'
      }
    ];
  }

  function seedSettings() {
    return {
      studioName: 'INS FRAME Photography',
      owner: 'Bagus Batra',
      email: 'hello@insframe.studio',
      phone: '+62 812 3456 7890',
      instagram: '@insframe'
    };
  }

  function normalizeGallery(item) {
    const source = item && typeof item === 'object' ? item : {};
    return {
      id: source.id ? String(source.id) : makeId('work'),
      title: String(source.title || 'Tanpa judul').slice(0, 80),
      category: CATEGORIES.indexOf(source.category) !== -1 ? source.category : 'Lainnya',
      date: DATE_PATTERN.test(source.date || '') ? source.date : todayISO(),
      image: String(source.image || ''),
      alt: String(source.alt || ''),
      visible: source.visible !== false && source.visible !== 'draft'
    };
  }

  function normalizeBooking(item) {
    const source = item && typeof item === 'object' ? item : {};
    return {
      id: source.id ? String(source.id) : makeId('book'),
      name: String(source.name || 'Tanpa nama').slice(0, 80),
      service: String(source.service || 'Lainnya').slice(0, 60),
      date: DATE_PATTERN.test(source.date || '') ? source.date : todayISO(),
      package: Object.prototype.hasOwnProperty.call(PACKAGE_PRICES, source.package) ? source.package : 'Custom',
      status: Object.prototype.hasOwnProperty.call(STATUS_LABELS, source.status) ? source.status : 'baru',
      phone: String(source.phone || ''),
      email: String(source.email || ''),
      note: String(source.note || '')
    };
  }

  function normalizeSettings(item) {
    const source = item && typeof item === 'object' ? item : {};
    const base = seedSettings();
    return {
      studioName: String(source.studioName || base.studioName),
      owner: String(source.owner || base.owner),
      email: String(source.email || base.email),
      phone: String(source.phone || base.phone),
      instagram: String(source.instagram || '')
    };
  }

  /* ---------------------------------------------------------
     Cache DOM
     --------------------------------------------------------- */
  const el = {
    sidebar: $('#adminSidebar'),
    backdrop: $('#adminBackdrop'),
    menuBtn: $('#adminMenuBtn'),
    sidebarClose: $('#adminSidebarClose'),
    navLinks: $$('[data-view-link]'),
    views: $$('.adm-view'),
    pageTitle: $('#adminPageTitle'),
    main: $('#adminMain'),
    themeToggle: $('#adminThemeToggle'),
    toast: $('#adminToast'),
    toastMessage: $('#toastMessage'),
    navGalleryCount: $('#navGalleryCount'),
    navOrderCount: $('#navOrderCount'),
    quickOrderText: $('#quickOrderText'),
    todayLabel: $('#todayLabel'),
    statGallery: $('#statGallery'),
    statGalleryMeta: $('#statGalleryMeta'),
    statNewOrders: $('#statNewOrders'),
    statNewOrdersMeta: $('#statNewOrdersMeta'),
    statUpcoming: $('#statUpcoming'),
    statUpcomingMeta: $('#statUpcomingMeta'),
    statPipeline: $('#statPipeline'),
    statPipelineMeta: $('#statPipelineMeta'),
    recentWorks: $('#recentWorks'),
    recentOrders: $('#recentOrders'),
    categoryBars: $('#categoryBars'),
    galleryGrid: $('#galleryGrid'),
    galleryEmpty: $('#galleryEmpty'),
    galleryCount: $('#galleryCount'),
    gallerySearch: $('#gallerySearch'),
    galleryCategory: $('#galleryCategoryFilter'),
    galleryStatus: $('#galleryStatusFilter'),
    ordersBody: $('#ordersBody'),
    ordersTable: $('.adm-table'),
    ordersEmpty: $('#ordersEmpty'),
    orderSearch: $('#orderSearch'),
    orderFilters: $('#orderFilters'),
    settingsForm: $('#settingsForm'),
    settingsGalleryCount: $('#settingsGalleryCount'),
    settingsOrderCount: $('#settingsOrderCount'),
    importInput: $('#importInput'),
    workModal: $('#workModal'),
    workForm: $('#workForm'),
    workModalTitle: $('#workModalTitle'),
    workSubmit: $('#workSubmit'),
    workTitle: $('#workTitle'),
    workCategory: $('#workCategory'),
    workDate: $('#workDate'),
    workImage: $('#workImage'),
    workAlt: $('#workAlt'),
    workVisible: $('#workVisible'),
    previewImg: $('#workPreviewImg'),
    previewEmpty: $('#workPreviewEmpty'),
    previewEmptyText: $('#workPreviewEmpty span'),
    confirmModal: $('#confirmModal'),
    confirmTitle: $('#confirmTitle'),
    confirmMessage: $('#confirmMessage'),
    confirmAction: $('#confirmAction'),
    confirmCancel: $('[data-confirm-cancel]', $('#confirmModal'))
  };

  /* ---------------------------------------------------------
     Tema
     --------------------------------------------------------- */
  function currentTheme() {
    return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
  }

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('bb-theme', theme);
    } catch (error) {
      /* abaikan */
    }

    const isLight = theme === 'light';
    if (el.themeToggle) {
      el.themeToggle.setAttribute('aria-label', isLight ? 'Ganti ke mode gelap' : 'Ganti ke mode terang');
      el.themeToggle.setAttribute('aria-pressed', String(isLight));
    }
  }

  /* ---------------------------------------------------------
     Navigasi
     --------------------------------------------------------- */
  function showView(view) {
    const next = VIEW_TITLES[view] ? view : 'dashboard';
    state.currentView = next;

    el.views.forEach(function (section) {
      section.hidden = section.dataset.view !== next;
    });

    el.navLinks.forEach(function (link) {
      const isActive = link.dataset.viewLink === next;
      link.classList.toggle('is-active', isActive);
      if (isActive) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });

    el.pageTitle.textContent = VIEW_TITLES[next];
    document.title = VIEW_TITLES[next] + ' | Studio Admin INS FRAME';

    closeSidebar(false);

    if (next === 'dashboard') renderDashboard();
    if (next === 'galeri') renderGallery();
    if (next === 'pesanan') renderOrders();
    if (next === 'pengaturan') renderSettings();
  }

  function handleRoute() {
    const view = (window.location.hash || '#dashboard').replace('#', '');
    showView(view);
  }

  /* ---------------------------------------------------------
     Sidebar mobile
     --------------------------------------------------------- */
  function syncBodyLock() {
    const locked = !el.workModal.hidden ||
      !el.confirmModal.hidden ||
      el.sidebar.classList.contains('is-open');
    document.body.classList.toggle('adm-no-scroll', locked);
  }

  function openSidebar() {
    if (window.innerWidth > 1024) return;
    el.sidebar.classList.add('is-open');
    el.backdrop.hidden = false;
    el.menuBtn.setAttribute('aria-expanded', 'true');
    syncBodyLock();
    if (el.sidebarClose) el.sidebarClose.focus();
  }

  function closeSidebar(restoreFocus) {
    if (!el.sidebar.classList.contains('is-open')) return;
    el.sidebar.classList.remove('is-open');
    el.backdrop.hidden = true;
    el.menuBtn.setAttribute('aria-expanded', 'false');
    syncBodyLock();
    if (restoreFocus !== false) el.menuBtn.focus();
  }

  /* ---------------------------------------------------------
     Statistik & dashboard
     --------------------------------------------------------- */
  function activeBookings() {
    return state.bookings.filter(function (booking) {
      return booking.status === 'baru' || booking.status === 'dikonfirmasi';
    });
  }

  function upcomingBookings() {
    const today = todayISO();
    return state.bookings.filter(function (booking) {
      return booking.status !== 'batal' && booking.date >= today;
    });
  }

  function renderDashboard() {
    const visibleWorks = state.gallery.filter(function (item) { return item.visible; });
    const newOrders = state.bookings.filter(function (booking) { return booking.status === 'baru'; });
    const upcoming = upcomingBookings().sort(function (a, b) { return a.date.localeCompare(b.date); });
    const active = activeBookings();
    const pipeline = active.reduce(function (total, booking) {
      return total + (PACKAGE_PRICES[booking.package] || 0);
    }, 0);

    el.todayLabel.textContent = 'Hari ini, ' + longToday() + '.';

    el.statGallery.textContent = String(state.gallery.length);
    el.statGalleryMeta.textContent = visibleWorks.length + ' karya tayang · ' +
      (state.gallery.length - visibleWorks.length) + ' draf';

    el.statNewOrders.textContent = String(newOrders.length);
    el.statNewOrdersMeta.textContent = newOrders.length
      ? 'Perlu ditindaklanjuti hari ini'
      : 'Semua permintaan sudah ditangani';

    el.statUpcoming.textContent = String(upcoming.length);
    el.statUpcomingMeta.textContent = upcoming.length
      ? 'Terdekat ' + formatDate(upcoming[0].date)
      : 'Belum ada jadwal terdekat';

    el.statPipeline.textContent = shortRupiah(pipeline);
    el.statPipelineMeta.textContent = active.length + ' pesanan aktif';

    el.quickOrderText.textContent = newOrders.length
      ? newOrders.length + ' pesanan baru'
      : 'Tidak ada pesanan baru';

    renderRecentWorks();
    renderRecentOrders();
    renderCategoryBars();
  }

  function renderRecentWorks() {
    const recent = state.gallery.slice().sort(function (a, b) {
      return b.date.localeCompare(a.date);
    }).slice(0, 4);

    if (!recent.length) {
      el.recentWorks.innerHTML = '<p class="adm-panel-empty">Belum ada karya. Tambahkan foto pertama untuk memulai galeri.</p>';
      return;
    }

    el.recentWorks.innerHTML = recent.map(function (item) {
      return '<a href="#galeri" class="adm-recent-work">' +
        '<span class="adm-recent-media">' +
        '<img class="adm-thumb" src="' + escapeHTML(item.image) + '" alt="' + escapeHTML(item.alt || item.title) + '" loading="lazy">' +
        '</span>' +
        '<span class="adm-recent-info">' +
        '<strong>' + escapeHTML(item.title) + '</strong>' +
        '<small>' + escapeHTML(item.category) + '</small>' +
        '</span>' +
        '</a>';
    }).join('');
  }

  function renderRecentOrders() {
    const recent = state.bookings.slice(0, 4);

    if (!recent.length) {
      el.recentOrders.innerHTML = '<li class="adm-panel-empty">Belum ada pesanan masuk.</li>';
      return;
    }

    el.recentOrders.innerHTML = recent.map(function (booking) {
      return '<li>' +
        '<a href="#pesanan" class="adm-mini-order">' +
        '<span class="adm-client-avatar" aria-hidden="true">' + escapeHTML(initials(booking.name)) + '</span>' +
        '<span class="adm-mini-order-info">' +
        '<strong>' + escapeHTML(booking.name) + '</strong>' +
        '<small>' + escapeHTML(booking.service) + ' · ' + escapeHTML(formatDate(booking.date)) + '</small>' +
        '</span>' +
        '<span class="adm-status is-' + escapeHTML(booking.status) + '">' + escapeHTML(STATUS_LABELS[booking.status]) + '</span>' +
        '</a>' +
        '</li>';
    }).join('');
  }

  function renderCategoryBars() {
    if (!state.gallery.length) {
      el.categoryBars.innerHTML = '<p class="adm-panel-empty">Kategori akan muncul setelah ada karya.</p>';
      return;
    }

    const counts = {};
    state.gallery.forEach(function (item) {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });

    const total = state.gallery.length;
    const entries = Object.keys(counts).map(function (category) {
      return { category: category, count: counts[category] };
    }).sort(function (a, b) {
      return b.count - a.count;
    }).slice(0, 5);

    el.categoryBars.innerHTML = entries.map(function (entry) {
      const percentage = Math.max(6, Math.round((entry.count / total) * 100));
      return '<div class="adm-bar">' +
        '<div class="adm-bar-head"><span>' + escapeHTML(entry.category) + '</span><strong>' +
        entry.count + ' karya</strong></div>' +
        '<div class="adm-bar-track"><span style="width:' + percentage + '%"></span></div>' +
        '</div>';
    }).join('');
  }

  function updateCounts() {
    const counts = { all: state.bookings.length, baru: 0, dikonfirmasi: 0, selesai: 0, batal: 0 };

    state.bookings.forEach(function (booking) {
      if (Object.prototype.hasOwnProperty.call(counts, booking.status)) {
        counts[booking.status] += 1;
      }
    });

    $$('[data-count]').forEach(function (node) {
      const key = node.dataset.count;
      node.textContent = String(counts[key] == null ? 0 : counts[key]);
    });

    if (el.navGalleryCount) el.navGalleryCount.textContent = String(state.gallery.length);
    if (el.navOrderCount) el.navOrderCount.textContent = String(counts.baru);
  }

  /* ---------------------------------------------------------
     Galeri
     --------------------------------------------------------- */
  function filteredGallery() {
    const query = state.filters.galleryQuery.trim().toLowerCase();

    return state.gallery.filter(function (item) {
      const matchesQuery = !query ||
        item.title.toLowerCase().indexOf(query) !== -1 ||
        item.category.toLowerCase().indexOf(query) !== -1;
      const matchesCategory = state.filters.galleryCategory === 'all' ||
        item.category === state.filters.galleryCategory;
      const matchesStatus = state.filters.galleryStatus === 'all' ||
        (state.filters.galleryStatus === 'live' ? item.visible : !item.visible);

      return matchesQuery && matchesCategory && matchesStatus;
    }).sort(function (a, b) {
      return b.date.localeCompare(a.date);
    });
  }

  function renderGallery() {
    const items = filteredGallery();

    el.galleryCount.textContent = items.length + ' dari ' + state.gallery.length + ' karya';
    el.galleryEmpty.hidden = items.length > 0;

    el.galleryGrid.innerHTML = items.map(function (item) {
      return '<article class="adm-work" data-id="' + escapeHTML(item.id) + '">' +
        '<div class="adm-work-media">' +
        '<img class="adm-thumb" src="' + escapeHTML(item.image) + '" alt="' + escapeHTML(item.alt || item.title) + '" loading="lazy">' +
        '<span class="adm-badge ' + (item.visible ? 'is-live' : 'is-draft') + '">' +
        (item.visible ? 'Tayang' : 'Draf') + '</span>' +
        '<div class="adm-work-actions">' +
        '<button type="button" class="adm-icon-btn" data-action="edit-work" data-id="' + escapeHTML(item.id) + '" aria-label="Edit ' + escapeHTML(item.title) + '">' +
        '<svg aria-hidden="true"><use href="#i-edit"></use></svg></button>' +
        '<button type="button" class="adm-icon-btn is-danger" data-action="delete-work" data-id="' + escapeHTML(item.id) + '" aria-label="Hapus ' + escapeHTML(item.title) + '">' +
        '<svg aria-hidden="true"><use href="#i-trash"></use></svg></button>' +
        '</div>' +
        '</div>' +
        '<div class="adm-work-body">' +
        '<span class="adm-work-cat">' + escapeHTML(item.category) + '</span>' +
        '<h3>' + escapeHTML(item.title) + '</h3>' +
        '<p>' + escapeHTML(formatDate(item.date)) + '</p>' +
        '</div>' +
        '</article>';
    }).join('');
  }

  /* ---------------------------------------------------------
     Pesanan
     --------------------------------------------------------- */
  function filteredBookings() {
    const query = state.filters.orderQuery.trim().toLowerCase();

    return state.bookings.filter(function (booking) {
      const matchesStatus = state.filters.orderStatus === 'all' ||
        booking.status === state.filters.orderStatus;
      const haystack = [booking.name, booking.service, booking.package, booking.email, booking.note]
        .join(' ')
        .toLowerCase();
      return matchesStatus && (!query || haystack.indexOf(query) !== -1);
    });
  }

  function statusOptions(selected) {
    return Object.keys(STATUS_LABELS).map(function (status) {
      return '<option value="' + status + '"' + (status === selected ? ' selected' : '') + '>' +
        escapeHTML(STATUS_LABELS[status]) + '</option>';
    }).join('');
  }

  function renderOrders() {
    updateCounts();

    const bookings = filteredBookings();
    const hasRows = bookings.length > 0;

    el.ordersTable.hidden = !hasRows;
    el.ordersEmpty.hidden = hasRows;

    el.ordersBody.innerHTML = bookings.map(function (booking) {
      const wa = whatsappHref(booking.phone);
      return '<tr data-id="' + escapeHTML(booking.id) + '">' +
        '<td data-label="Klien">' +
        '<div class="adm-client">' +
        '<span class="adm-client-avatar" aria-hidden="true">' + escapeHTML(initials(booking.name)) + '</span>' +
        '<span class="adm-client-info"><strong>' + escapeHTML(booking.name) + '</strong>' +
        '<span>' + escapeHTML(booking.email || booking.phone) + '</span></span>' +
        '</div>' +
        '</td>' +
        '<td data-label="Layanan">' + escapeHTML(booking.service) + '</td>' +
        '<td data-label="Tanggal sesi">' + escapeHTML(formatDate(booking.date)) + '</td>' +
        '<td data-label="Paket">' + escapeHTML(booking.package) + '</td>' +
        '<td data-label="Status">' +
        '<select class="adm-status-select is-' + escapeHTML(booking.status) + '" data-order-status="' + escapeHTML(booking.id) + '" aria-label="Status pesanan ' + escapeHTML(booking.name) + '">' +
        statusOptions(booking.status) +
        '</select>' +
        '</td>' +
        '<td data-label="Aksi">' +
        '<div class="adm-order-actions">' +
        (wa ? '<a class="adm-icon-btn is-wa" href="' + escapeHTML(wa) + '" target="_blank" rel="noopener" aria-label="Hubungi ' + escapeHTML(booking.name) + ' via WhatsApp">' +
          '<svg aria-hidden="true"><use href="#i-whatsapp"></use></svg></a>' : '') +
        '<button type="button" class="adm-icon-btn is-danger" data-action="delete-order" data-id="' + escapeHTML(booking.id) + '" aria-label="Hapus pesanan ' + escapeHTML(booking.name) + '">' +
        '<svg aria-hidden="true"><use href="#i-trash"></use></svg></button>' +
        '</div>' +
        '</td>' +
        '</tr>';
    }).join('');
  }

  /* ---------------------------------------------------------
     Pengaturan
     --------------------------------------------------------- */
  function renderSettings() {
    populateSettingsForm();
    el.settingsGalleryCount.textContent = String(state.gallery.length);
    el.settingsOrderCount.textContent = String(state.bookings.length);
  }

  function populateSettingsForm() {
    $('#studioName').value = state.settings.studioName || '';
    $('#studioOwner').value = state.settings.owner || '';
    $('#studioEmail').value = state.settings.email || '';
    $('#studioPhone').value = state.settings.phone || '';
    $('#studioInstagram').value = state.settings.instagram || '';
  }

  /* ---------------------------------------------------------
     Form errors
     --------------------------------------------------------- */
  function setFieldError(input, message) {
    if (!input) return;
    const field = input.closest('.adm-field');
    if (!field) return;

    field.classList.toggle('has-error', Boolean(message));
    if (message) {
      input.setAttribute('aria-invalid', 'true');
    } else {
      input.removeAttribute('aria-invalid');
    }

    const errorNode = $('[data-error-for="' + input.id + '"]', field);
    if (errorNode) errorNode.textContent = message || '';
  }

  function clearFormErrors(form) {
    $$('.adm-field.has-error', form).forEach(function (field) {
      field.classList.remove('has-error');
    });
    $$('[aria-invalid]', form).forEach(function (input) {
      input.removeAttribute('aria-invalid');
    });
    $$('.adm-error', form).forEach(function (node) {
      node.textContent = '';
    });
  }

  /* ---------------------------------------------------------
     Modal karya
     --------------------------------------------------------- */
  function resetPreview() {
    el.previewImg.hidden = true;
    el.previewImg.removeAttribute('src');
    el.previewImg.dataset.src = '';
    el.previewEmpty.hidden = false;
    el.previewEmptyText.textContent = 'Masukkan URL foto untuk melihat pratinjau.';
  }

  function updatePreview() {
    const url = el.workImage.value.trim();

    if (!url) {
      resetPreview();
      return;
    }

    // Hanya coba muat sumber gambar yang masuk akal, agar skema lain tidak
    // memicu permintaan jaringan yang gagal.
    if (!/^(https?:\/\/|data:image\/|assets\/|\.{0,2}\/)/i.test(url)) {
      resetPreview();
      el.previewEmptyText.textContent = 'Gunakan URL http(s) atau path gambar lokal.';
      return;
    }

    if (el.previewImg.dataset.src === url) return;

    el.previewImg.dataset.src = url;
    el.previewImg.hidden = false;
    el.previewEmpty.hidden = true;
    el.previewImg.alt = el.workAlt.value.trim() || 'Pratinjau karya';

    el.previewImg.onload = function () {
      el.previewImg.hidden = false;
      el.previewEmpty.hidden = true;
    };

    el.previewImg.onerror = function () {
      el.previewImg.hidden = true;
      el.previewEmpty.hidden = false;
      el.previewEmptyText.textContent = 'Foto tidak dapat dimuat. Periksa kembali URL-nya.';
    };

    el.previewImg.src = url;
  }

  function openWorkModal(id) {
    const item = id ? state.gallery.find(function (entry) { return entry.id === id; }) : null;
    state.editingId = item ? item.id : null;
    state.workLastFocus = document.activeElement;

    el.workForm.reset();
    clearFormErrors(el.workForm);

    el.workTitle.value = item ? item.title : '';
    el.workCategory.value = item ? item.category : 'Wedding';
    el.workDate.value = item ? item.date : todayISO();
    el.workImage.value = item ? item.image : '';
    el.workAlt.value = item ? item.alt : '';
    el.workVisible.value = item && !item.visible ? 'draft' : 'live';

    el.workModalTitle.textContent = item ? 'Edit karya' : 'Tambah karya';
    el.workSubmit.innerHTML = '<svg aria-hidden="true"><use href="#i-check"></use></svg>' +
      (item ? 'Simpan perubahan' : 'Simpan karya');

    resetPreview();
    updatePreview();

    el.workModal.hidden = false;
    syncBodyLock();

    window.setTimeout(function () {
      el.workTitle.focus();
    }, 40);
  }

  function closeWorkModal() {
    if (el.workModal.hidden) return;

    el.workModal.hidden = true;
    state.editingId = null;
    resetPreview();
    syncBodyLock();

    if (state.workLastFocus && document.contains(state.workLastFocus)) {
      state.workLastFocus.focus();
    }
  }

  function handleWorkSubmit(event) {
    event.preventDefault();
    clearFormErrors(el.workForm);

    const title = el.workTitle.value.trim();
    const category = el.workCategory.value;
    const date = el.workDate.value;
    const image = el.workImage.value.trim();
    const alt = el.workAlt.value.trim();
    const visible = el.workVisible.value === 'live';

    let firstInvalid = null;

    if (title.length < 2) {
      setFieldError(el.workTitle, 'Judul minimal 2 karakter.');
      firstInvalid = firstInvalid || el.workTitle;
    }

    if (CATEGORIES.indexOf(category) === -1) {
      setFieldError(el.workCategory, 'Pilih kategori yang tersedia.');
      firstInvalid = firstInvalid || el.workCategory;
    }

    if (!DATE_PATTERN.test(date)) {
      setFieldError(el.workDate, 'Pilih tanggal karya.');
      firstInvalid = firstInvalid || el.workDate;
    }

    if (!image) {
      setFieldError(el.workImage, 'URL foto wajib diisi.');
      firstInvalid = firstInvalid || el.workImage;
    } else if (!/^(https?:\/\/|data:image\/|assets\/|\.{0,2}\/)/i.test(image)) {
      setFieldError(el.workImage, 'Gunakan URL http(s) atau path gambar lokal.');
      firstInvalid = firstInvalid || el.workImage;
    }

    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    if (state.editingId) {
      const index = state.gallery.findIndex(function (entry) { return entry.id === state.editingId; });
      if (index !== -1) {
        state.gallery[index] = normalizeGallery({
          id: state.gallery[index].id,
          title: title,
          category: category,
          date: date,
          image: image,
          alt: alt,
          visible: visible
        });
      }
      showToast('Perubahan karya disimpan.');
    } else {
      state.gallery.unshift(normalizeGallery({
        id: makeId('work'),
        title: title,
        category: category,
        date: date,
        image: image,
        alt: alt,
        visible: visible
      }));
      showToast('Karya baru ditambahkan ke galeri.');
    }

    writeStore(STORAGE_KEYS.gallery, state.gallery);
    updateCounts();
    renderGallery();
    renderDashboard();
    closeWorkModal();
  }

  async function deleteWork(id) {
    const item = state.gallery.find(function (entry) { return entry.id === id; });
    if (!item) return;

    const confirmed = await askConfirm({
      title: 'Hapus karya?',
      message: '"' + item.title + '" akan dihapus dari galeri. Tindakan ini tidak bisa dibatalkan.',
      confirmText: 'Hapus karya'
    });

    if (!confirmed) return;

    state.gallery = state.gallery.filter(function (entry) { return entry.id !== id; });
    writeStore(STORAGE_KEYS.gallery, state.gallery);
    updateCounts();
    renderGallery();
    renderDashboard();
    showToast('Karya "' + item.title + '" dihapus.');
  }

  /* ---------------------------------------------------------
     Konfirmasi
     --------------------------------------------------------- */
  function askConfirm(options) {
    if (state.confirmResolve) {
      state.confirmResolve(false);
      state.confirmResolve = null;
    }

    state.confirmLastFocus = document.activeElement;
    el.confirmTitle.textContent = options.title || 'Konfirmasi';
    el.confirmMessage.textContent = options.message || 'Tindakan ini tidak bisa dibatalkan.';
    el.confirmAction.textContent = options.confirmText || 'Lanjutkan';
    el.confirmAction.classList.toggle('adm-btn-danger', options.danger !== false);
    el.confirmAction.classList.toggle('adm-btn-primary', options.danger === false);

    el.confirmModal.hidden = false;
    syncBodyLock();

    window.setTimeout(function () {
      if (el.confirmCancel) el.confirmCancel.focus();
    }, 30);

    return new Promise(function (resolve) {
      state.confirmResolve = resolve;
    });
  }

  function closeConfirm(result) {
    if (el.confirmModal.hidden) return;

    el.confirmModal.hidden = true;
    const resolve = state.confirmResolve;
    state.confirmResolve = null;
    syncBodyLock();

    if (state.confirmLastFocus && document.contains(state.confirmLastFocus)) {
      state.confirmLastFocus.focus();
    }

    if (resolve) resolve(result);
  }

  /* ---------------------------------------------------------
     Pesanan: hapus & ubah status
     --------------------------------------------------------- */
  async function deleteOrder(id) {
    const booking = state.bookings.find(function (entry) { return entry.id === id; });
    if (!booking) return;

    const confirmed = await askConfirm({
      title: 'Hapus pesanan?',
      message: 'Pesanan dari "' + booking.name + '" akan dihapus dari daftar.',
      confirmText: 'Hapus pesanan'
    });

    if (!confirmed) return;

    state.bookings = state.bookings.filter(function (entry) { return entry.id !== id; });
    writeStore(STORAGE_KEYS.bookings, state.bookings);
    renderOrders();
    renderDashboard();
    showToast('Pesanan dari "' + booking.name + '" dihapus.');
  }

  function updateOrderStatus(select) {
    const id = select.dataset.orderStatus;
    const value = select.value;
    const booking = state.bookings.find(function (entry) { return entry.id === id; });

    if (!booking || !Object.prototype.hasOwnProperty.call(STATUS_LABELS, value)) return;

    booking.status = value;
    select.className = 'adm-status-select is-' + value;
    writeStore(STORAGE_KEYS.bookings, state.bookings);
    updateCounts();
    renderDashboard();
    showToast('Status ' + booking.name + ' diubah menjadi ' + STATUS_LABELS[value].toLowerCase() + '.');
  }

  /* ---------------------------------------------------------
     Pengaturan: simpan
     --------------------------------------------------------- */
  function handleSettingsSubmit(event) {
    event.preventDefault();
    clearFormErrors(el.settingsForm);

    const studioName = $('#studioName');
    const owner = $('#studioOwner');
    const email = $('#studioEmail');
    const phone = $('#studioPhone');
    const instagram = $('#studioInstagram');
    let firstInvalid = null;

    if (studioName.value.trim().length < 2) {
      setFieldError(studioName, 'Nama studio minimal 2 karakter.');
      firstInvalid = firstInvalid || studioName;
    }

    if (owner.value.trim().length < 2) {
      setFieldError(owner, 'Nama pemilik minimal 2 karakter.');
      firstInvalid = firstInvalid || owner;
    }

    if (!EMAIL_PATTERN.test(email.value.trim())) {
      setFieldError(email, 'Masukkan email yang valid.');
      firstInvalid = firstInvalid || email;
    }

    const phoneDigits = phone.value.replace(/[^\d]/g, '');
    if (phoneDigits.length < 8 || phoneDigits.length > 15) {
      setFieldError(phone, 'Masukkan nomor WhatsApp yang valid.');
      firstInvalid = firstInvalid || phone;
    }

    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    state.settings = {
      studioName: studioName.value.trim(),
      owner: owner.value.trim(),
      email: email.value.trim(),
      phone: phone.value.trim(),
      instagram: instagram.value.trim()
    };

    writeStore(STORAGE_KEYS.settings, state.settings);
    showToast('Profil studio berhasil disimpan.');
  }

  /* ---------------------------------------------------------
     Ekspor / impor / reset
     --------------------------------------------------------- */
  function exportData() {
    const payload = {
      app: 'INS FRAME Studio Admin',
      version: 1,
      exportedAt: new Date().toISOString(),
      gallery: state.gallery,
      bookings: state.bookings,
      settings: state.settings
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'insframe-admin-' + todayISO() + '.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    showToast('Cadangan JSON berhasil diunduh.');
  }

  async function importDataFromFile(file) {
    let data;

    try {
      data = JSON.parse(await file.text());
    } catch (error) {
      showToast('File tidak valid. Pilih file JSON cadangan.', 'error');
      return;
    }

    const hasGallery = Array.isArray(data.gallery);
    const hasBookings = Array.isArray(data.bookings);

    if (!hasGallery && !hasBookings) {
      showToast('Struktur file tidak dikenali.', 'error');
      return;
    }

    const confirmed = await askConfirm({
      title: 'Impor data?',
      message: 'Galeri dan pesanan saat ini akan diganti dengan isi file cadangan.',
      confirmText: 'Impor data',
      danger: false
    });

    if (!confirmed) return;

    if (hasGallery) state.gallery = data.gallery.map(normalizeGallery);
    if (hasBookings) state.bookings = data.bookings.map(normalizeBooking);
    if (data.settings && typeof data.settings === 'object') {
      state.settings = normalizeSettings(data.settings);
    }

    writeStore(STORAGE_KEYS.gallery, state.gallery);
    writeStore(STORAGE_KEYS.bookings, state.bookings);
    writeStore(STORAGE_KEYS.settings, state.settings);

    updateCounts();
    renderDashboard();
    renderGallery();
    renderOrders();
    renderSettings();
    showToast('Data berhasil diimpor.');
  }

  async function resetData() {
    const confirmed = await askConfirm({
      title: 'Reset data demo?',
      message: 'Semua perubahan lokal akan dihapus dan diganti dengan data contoh awal.',
      confirmText: 'Reset data'
    });

    if (!confirmed) return;

    state.gallery = seedGallery().map(normalizeGallery);
    state.bookings = seedBookings().map(normalizeBooking);
    state.settings = seedSettings();

    writeStore(STORAGE_KEYS.gallery, state.gallery);
    writeStore(STORAGE_KEYS.bookings, state.bookings);
    writeStore(STORAGE_KEYS.settings, state.settings);

    updateCounts();
    renderDashboard();
    renderGallery();
    renderOrders();
    renderSettings();
    showToast('Data demo berhasil dipulihkan.');
  }

  /* ---------------------------------------------------------
     Toast
     --------------------------------------------------------- */
  function showToast(message, type) {
    window.clearTimeout(state.toastTimer);

    el.toastMessage.textContent = message;
    el.toast.classList.toggle('is-error', type === 'error');

    const iconUse = el.toast.querySelector('use');
    if (iconUse) iconUse.setAttribute('href', type === 'error' ? '#i-close' : '#i-check');

    el.toast.hidden = false;

    state.toastTimer = window.setTimeout(function () {
      el.toast.hidden = true;
    }, 3400);
  }

  /* ---------------------------------------------------------
     Fokus modal
     --------------------------------------------------------- */
  function trapFocus(event, dialog) {
    const focusable = $$('a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])', dialog)
      .filter(function (node) { return node.offsetParent !== null; });

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

  /* ---------------------------------------------------------
     Event binding
     --------------------------------------------------------- */
  function bindEvents() {
    window.addEventListener('hashchange', handleRoute);

    el.menuBtn.addEventListener('click', openSidebar);
    el.sidebarClose.addEventListener('click', function () { closeSidebar(true); });
    el.backdrop.addEventListener('click', function () { closeSidebar(true); });

    el.navLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        closeSidebar(false);
        if (window.location.hash === '#' + link.dataset.viewLink) {
          showView(link.dataset.viewLink);
        }
      });
    });

    el.themeToggle.addEventListener('click', function () {
      applyTheme(currentTheme() === 'dark' ? 'light' : 'dark');
    });

    document.addEventListener('click', function (event) {
      const closeWork = event.target.closest('[data-close-work]');
      if (closeWork) {
        closeWorkModal();
        return;
      }

      const cancelConfirm = event.target.closest('[data-confirm-cancel]');
      if (cancelConfirm) {
        closeConfirm(false);
        return;
      }

      if (event.target.closest('#confirmAction')) {
        closeConfirm(true);
        return;
      }

      if (event.target.closest('[data-open-work]')) {
        openWorkModal();
        return;
      }

      const actionElement = event.target.closest('[data-action]');
      if (!actionElement) return;

      const action = actionElement.dataset.action;
      const id = actionElement.dataset.id;

      if (action === 'export') exportData();
      if (action === 'import') el.importInput.click();
      if (action === 'reset') resetData();
      if (action === 'edit-work') openWorkModal(id);
      if (action === 'delete-work') deleteWork(id);
      if (action === 'delete-order') deleteOrder(id);
    });

    document.addEventListener('change', function (event) {
      if (event.target.matches('[data-order-status]')) {
        updateOrderStatus(event.target);
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        if (!el.confirmModal.hidden) {
          event.preventDefault();
          closeConfirm(false);
          return;
        }
        if (!el.workModal.hidden) {
          event.preventDefault();
          closeWorkModal();
          return;
        }
        if (el.sidebar.classList.contains('is-open')) {
          event.preventDefault();
          closeSidebar(true);
        }
        return;
      }

      if (event.key === 'Tab') {
        if (!el.confirmModal.hidden) {
          trapFocus(event, el.confirmModal.querySelector('[role="dialog"]'));
        } else if (!el.workModal.hidden) {
          trapFocus(event, el.workModal.querySelector('[role="dialog"]'));
        }
      }
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 1024 && el.sidebar.classList.contains('is-open')) {
        closeSidebar(false);
      }
    });

    el.workForm.addEventListener('submit', handleWorkSubmit);
    el.settingsForm.addEventListener('submit', handleSettingsSubmit);

    el.workImage.addEventListener('input', updatePreview);
    el.workAlt.addEventListener('input', function () {
      if (!el.previewImg.hidden) {
        el.previewImg.alt = el.workAlt.value.trim() || 'Pratinjau karya';
      }
    });

    el.workForm.addEventListener('input', function (event) {
      if (event.target.closest('.adm-field') && event.target.closest('.adm-field').classList.contains('has-error')) {
        setFieldError(event.target, '');
      }
    });

    el.settingsForm.addEventListener('input', function (event) {
      if (event.target.closest('.adm-field') && event.target.closest('.adm-field').classList.contains('has-error')) {
        setFieldError(event.target, '');
      }
    });

    el.gallerySearch.addEventListener('input', function () {
      state.filters.galleryQuery = el.gallerySearch.value;
      renderGallery();
    });

    el.galleryCategory.addEventListener('change', function () {
      state.filters.galleryCategory = el.galleryCategory.value;
      renderGallery();
    });

    el.galleryStatus.addEventListener('change', function () {
      state.filters.galleryStatus = el.galleryStatus.value;
      renderGallery();
    });

    el.orderSearch.addEventListener('input', function () {
      state.filters.orderQuery = el.orderSearch.value;
      renderOrders();
    });

    el.orderFilters.addEventListener('click', function (event) {
      const chip = event.target.closest('[data-order-filter]');
      if (!chip) return;

      state.filters.orderStatus = chip.dataset.orderFilter;
      $$('.adm-chip', el.orderFilters).forEach(function (button) {
        button.classList.toggle('is-active', button === chip);
      });
      renderOrders();
    });

    el.importInput.addEventListener('change', function () {
      const file = el.importInput.files && el.importInput.files[0];
      el.importInput.value = '';
      if (file) importDataFromFile(file);
    });

    document.addEventListener('error', function (event) {
      const img = event.target;
      if (img && img.tagName === 'IMG' && img.classList.contains('adm-thumb') && !img.dataset.hasFallback) {
        img.dataset.hasFallback = 'true';
        img.src = FALLBACK_IMAGE;
      }
    }, true);
  }

  /* ---------------------------------------------------------
     Init
     --------------------------------------------------------- */
  function init() {
    const storedGallery = readStore(STORAGE_KEYS.gallery, null);
    const storedBookings = readStore(STORAGE_KEYS.bookings, null);
    const storedSettings = readStore(STORAGE_KEYS.settings, null);

    state.gallery = (Array.isArray(storedGallery) ? storedGallery : seedGallery()).map(normalizeGallery);
    state.bookings = (Array.isArray(storedBookings) ? storedBookings : seedBookings()).map(normalizeBooking);
    state.settings = normalizeSettings(storedSettings);

    if (!Array.isArray(storedGallery)) writeStore(STORAGE_KEYS.gallery, state.gallery);
    if (!Array.isArray(storedBookings)) writeStore(STORAGE_KEYS.bookings, state.bookings);
    if (!storedSettings) writeStore(STORAGE_KEYS.settings, state.settings);

    applyTheme(currentTheme());
    bindEvents();

    $('#adminYear').textContent = String(new Date().getFullYear());
    updateCounts();
    renderDashboard();
    renderGallery();
    renderOrders();
    renderSettings();

    handleRoute();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
