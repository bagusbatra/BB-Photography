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
    settings: 'insframe.admin.settings.v1',
    site: 'insframe.admin.site.v1'
  };

  const VIEW_TITLES = {
    dashboard: 'Dashboard',
    galeri: 'Kelola Karya',
    pesanan: 'Pesanan',
    konten: 'Konten Situs',
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

  const SERVICE_ICONS = [
    { value: 'camera', label: 'Kamera' },
    { value: 'heart', label: 'Hati' },
    { value: 'user', label: 'Profil' },
    { value: 'box', label: 'Kotak' },
    { value: 'calendar', label: 'Kalender' },
    { value: 'film', label: 'Film' },
    { value: 'graduation', label: 'Wisuda' },
    { value: 'sparkle', label: 'Kilau' },
    { value: 'rings', label: 'Cincin' },
    { value: 'diamond', label: 'Berlian' },
    { value: 'road', label: 'Jalan' },
    { value: 'building', label: 'Bangunan' },
    { value: 'mountain', label: 'Gunung' },
    { value: 'moon', label: 'Bulan' },
    { value: 'pin', label: 'Lokasi' },
    { value: 'mail', label: 'Email' },
    { value: 'phone', label: 'Telepon' },
    { value: 'clock', label: 'Jam' }
  ];

  const CONTENT_KINDS = {
    services: {
      label: 'Layanan',
      singular: 'layanan',
      collection: 'services'
    },
    packages: {
      label: 'Paket',
      singular: 'paket',
      collection: 'packages'
    },
    testimonials: {
      label: 'Testimoni',
      singular: 'testimoni',
      collection: 'testimonials'
    },
    faq: {
      label: 'FAQ',
      singular: 'FAQ',
      collection: 'faq'
    }
  };

  const CATEGORY_FALLBACK = [
    { label: 'Wedding', slug: 'wedding', display: 'Wedding' },
    { label: 'Prewedding', slug: 'prewedding', display: 'Prewedding' },
    { label: 'Engagement', slug: 'engagement', display: 'Engagement' },
    { label: 'Portrait', slug: 'portrait', display: 'Portrait' },
    { label: 'Event', slug: 'event', display: 'Acara' },
    { label: 'Graduation', slug: 'graduation', display: 'Graduation' },
    { label: 'Personal Branding', slug: 'personal-branding', display: 'Personal Branding' },
    { label: 'Couple', slug: 'couple', display: 'Couple' },
    { label: 'Family', slug: 'family', display: 'Family' },
    { label: 'Produk', slug: 'product', display: 'Produk' },
    { label: 'Lainnya', slug: 'other', display: 'Lainnya' }
  ];

  function slugify(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'other';
  }

  const CATEGORY_DEFS = (Array.isArray(window.INSFRAME_CATEGORIES) && window.INSFRAME_CATEGORIES.length
    ? window.INSFRAME_CATEGORIES
    : CATEGORY_FALLBACK
  ).map(function (entry) {
    const item = entry && typeof entry === 'object' ? entry : {};
    const label = String(item.label || item.display || 'Lainnya');
    return {
      label: label,
      slug: String(item.slug || slugify(label)),
      display: String(item.display || label)
    };
  });

  const CATEGORIES = CATEGORY_DEFS.map(function (entry) { return entry.label; });

  const PUBLISHED_GALLERY = (window.INSFRAME_GALLERY &&
    typeof window.INSFRAME_GALLERY === 'object' &&
    Array.isArray(window.INSFRAME_GALLERY.works))
    ? window.INSFRAME_GALLERY
    : null;

  const SITE_API = window.INSFRAME_SITE_RENDER && typeof window.INSFRAME_SITE_RENDER.prepareSite === 'function'
    ? window.INSFRAME_SITE_RENDER
    : null;

  const PUBLISHED_SITE = (window.INSFRAME_SITE && typeof window.INSFRAME_SITE === 'object')
    ? window.INSFRAME_SITE
    : null;

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
    site: null,
    filters: {
      galleryQuery: '',
      galleryCategory: 'all',
      galleryStatus: 'all',
      orderQuery: '',
      orderStatus: 'all'
    },
    contentTab: 'services',
    contentKind: null,
    contentEditingId: null,
    currentView: 'dashboard',
    editingId: null,
    confirmResolve: null,
    workLastFocus: null,
    confirmLastFocus: null,
    publishLastFocus: null,
    contentLastFocus: null,
    sitePublishLastFocus: null,
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

  function thumbUrl(url) {
    const value = String(url || '');
    if (!/^https?:\/\/images\.unsplash\.com\//i.test(value)) return value;
    return value
      .replace(/([?&])w=\d+/, '$1w=700')
      .replace(/([?&])q=\d+/, '$1q=80');
  }

  function formatPublishedAt(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
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
    if (PUBLISHED_GALLERY && PUBLISHED_GALLERY.works.length) {
      return PUBLISHED_GALLERY.works.map(function (item) {
        return {
          id: item.id,
          title: item.title,
          category: item.category,
          location: item.location || '',
          date: item.date,
          visible: item.visible !== false,
          image: item.image || item.thumb || '',
          alt: item.alt || ''
        };
      });
    }

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
      location: String(source.location || '').slice(0, 40),
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
      package: String(source.package || 'Custom').slice(0, 60) || 'Custom',
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
     Data konten situs
     --------------------------------------------------------- */
  function emptySite() {
    return {
      version: 1,
      updatedAt: '',
      contact: { phone: '', phoneDisplay: '', email: '', address: [], hours: [] },
      socials: { instagram: '', facebook: '', youtube: '' },
      services: [],
      packages: [],
      testimonials: [],
      faq: [],
      about: { paragraphs: [], points: [], stats: [] }
    };
  }

  function cloneJSON(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function prepareSiteData(source) {
    if (SITE_API) return SITE_API.prepareSite(source || {});

    const data = source && typeof source === 'object' ? cloneJSON(source) : {};
    const base = emptySite();
    const contact = data.contact && typeof data.contact === 'object' ? data.contact : {};
    const socials = data.socials && typeof data.socials === 'object' ? data.socials : {};
    const about = data.about && typeof data.about === 'object' ? data.about : {};

    function list(value) {
      return Array.isArray(value) ? value.filter(function (entry) {
        return entry && typeof entry === 'object';
      }) : [];
    }

    return {
      version: Number(data.version) || 1,
      updatedAt: String(data.updatedAt || ''),
      contact: {
        phone: String(contact.phone || ''),
        phoneDisplay: String(contact.phoneDisplay || ''),
        email: String(contact.email || ''),
        address: Array.isArray(contact.address) ? contact.address.map(String) : [],
        hours: Array.isArray(contact.hours) ? contact.hours.map(String) : []
      },
      socials: {
        instagram: String(socials.instagram || ''),
        facebook: String(socials.facebook || ''),
        youtube: String(socials.youtube || '')
      },
      services: list(data.services),
      packages: list(data.packages),
      testimonials: list(data.testimonials),
      faq: list(data.faq),
      about: {
        paragraphs: Array.isArray(about.paragraphs) ? about.paragraphs.map(String) : base.about.paragraphs,
        points: Array.isArray(about.points) ? about.points.map(String) : base.about.points,
        stats: Array.isArray(about.stats) ? about.stats : base.about.stats
      }
    };
  }

  function seedSite() {
    return prepareSiteData(PUBLISHED_SITE || emptySite());
  }

  function publishedSiteData() {
    return prepareSiteData(PUBLISHED_SITE || emptySite());
  }

  function normalizeSiteData(item) {
    return prepareSiteData(item && typeof item === 'object' ? item : emptySite());
  }

  function siteItemCount(site) {
    if (!site) return 0;
    return site.services.length + site.packages.length + site.testimonials.length + site.faq.length;
  }

  function packagePrice(name) {
    const packages = state.site && Array.isArray(state.site.packages) ? state.site.packages : [];
    const match = packages.find(function (pkg) { return pkg.name === name; });
    if (match) return Number(match.price) || 0;
    return PACKAGE_PRICES[name] || 0;
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
    navContentCount: $('#navContentCount'),
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
    settingsContentCount: $('#settingsContentCount'),
    importInput: $('#importInput'),
    sitePublishStatus: $('#sitePublishStatus'),
    sitePublishModal: $('#sitePublishModal'),
    sitePublishStats: $('#sitePublishStats'),
    sitePublishDiff: $('#sitePublishDiff'),
    sitePublishDownload: $('[data-site-publish-download]'),
    sitePublishCopy: $('[data-site-publish-copy]'),
    contentTabs: $('#contentTabs'),
    contentPanels: $$('[data-content-pane]'),
    contentServices: $('#contentServices'),
    contentPackages: $('#contentPackages'),
    contentTestimonials: $('#contentTestimonials'),
    contentFaq: $('#contentFaq'),
    contentCountServices: $('#contentCountServices'),
    contentCountPackages: $('#contentCountPackages'),
    contentCountTestimonials: $('#contentCountTestimonials'),
    contentCountFaq: $('#contentCountFaq'),
    aboutForm: $('#aboutForm'),
    aboutParagraphs: $('#aboutParagraphs'),
    aboutPoints: $('#aboutPoints'),
    aboutStatsList: $('#aboutStatsList'),
    contactForm: $('#contactForm'),
    socialForm: $('#socialForm'),
    contentModal: $('#contentModal'),
    contentForm: $('#contentForm'),
    contentFields: $('#contentFields'),
    contentModalTitle: $('#contentModalTitle'),
    contentModalEyebrow: $('#contentModalEyebrow'),
    contentSubmit: $('#contentSubmit'),
    workModal: $('#workModal'),
    workForm: $('#workForm'),
    workModalTitle: $('#workModalTitle'),
    workSubmit: $('#workSubmit'),
    workTitle: $('#workTitle'),
    workCategory: $('#workCategory'),
    workDate: $('#workDate'),
    workImage: $('#workImage'),
    workLocation: $('#workLocation'),
    workAlt: $('#workAlt'),
    workVisible: $('#workVisible'),
    previewImg: $('#workPreviewImg'),
    previewEmpty: $('#workPreviewEmpty'),
    previewEmptyText: $('#workPreviewEmpty span'),
    publishStatus: $('#publishStatus'),
    publishModal: $('#publishModal'),
    publishStats: $('#publishStats'),
    publishDiff: $('#publishDiff'),
    publishDownload: $('[data-publish-download]'),
    publishCopy: $('[data-publish-copy]'),
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
      localStorage.setItem('insframe-theme', theme);
      localStorage.removeItem('bb-theme');
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
    if (next === 'konten') renderContent();
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
      !el.publishModal.hidden ||
      !el.contentModal.hidden ||
      !el.sitePublishModal.hidden ||
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
      return total + packagePrice(booking.package);
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
        '<img class="adm-thumb" src="' + escapeHTML(thumbUrl(item.image)) + '" alt="' + escapeHTML(item.alt || item.title) + '" loading="lazy">' +
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
    if (el.navContentCount) el.navContentCount.textContent = String(siteItemCount(state.site));
  }

  /* ---------------------------------------------------------
     Galeri
     --------------------------------------------------------- */
  function filteredGallery() {
    const query = state.filters.galleryQuery.trim().toLowerCase();

    return state.gallery.filter(function (item) {
      const matchesQuery = !query ||
        item.title.toLowerCase().indexOf(query) !== -1 ||
        item.category.toLowerCase().indexOf(query) !== -1 ||
        String(item.location || '').toLowerCase().indexOf(query) !== -1;
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
        '<img class="adm-thumb" src="' + escapeHTML(thumbUrl(item.image)) + '" alt="' + escapeHTML(item.alt || item.title) + '" loading="lazy">' +
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

    renderPublishState();
  }

  /* ---------------------------------------------------------
     Publikasi ke halaman publik
     --------------------------------------------------------- */
  function cleanedWork(item) {
    return {
      id: String(item.id || ''),
      title: String(item.title || ''),
      category: String(item.category || ''),
      location: String(item.location || ''),
      date: DATE_PATTERN.test(item.date || '') ? item.date : '',
      image: String(item.image || ''),
      alt: String(item.alt || '')
    };
  }

  function compareWorks(a, b) {
    if (a.date === b.date) return a.id.localeCompare(b.id);
    if (!a.date) return 1;
    if (!b.date) return -1;
    return b.date.localeCompare(a.date);
  }

  function visibleSequence() {
    return state.gallery
      .filter(function (item) { return item.visible; })
      .map(cleanedWork)
      .sort(compareWorks);
  }

  function publishedSequence() {
    if (!PUBLISHED_GALLERY) return [];
    return PUBLISHED_GALLERY.works
      .filter(function (item) { return item.visible !== false; })
      .map(cleanedWork);
  }

  function workSignature(item) {
    return [item.title, item.category, item.location, item.date, item.image, item.alt].join('\u0000');
  }

  function diffGallery() {
    const current = visibleSequence();
    const published = publishedSequence();
    const currentById = new Map();
    const publishedById = new Map();

    current.forEach(function (item) { currentById.set(item.id, item); });
    published.forEach(function (item) { publishedById.set(item.id, item); });

    let added = 0;
    let removed = 0;
    let changed = 0;

    current.forEach(function (item) {
      const match = publishedById.get(item.id);
      if (!match) {
        added += 1;
      } else if (workSignature(match) !== workSignature(item)) {
        changed += 1;
      }
    });

    published.forEach(function (item) {
      if (!currentById.has(item.id)) removed += 1;
    });

    const currentOrder = current
      .map(function (item) { return item.id; })
      .filter(function (id) { return publishedById.has(id); });
    const publishedOrder = published
      .map(function (item) { return item.id; })
      .filter(function (id) { return currentById.has(id); });
    const orderChanged = currentOrder.join('|') !== publishedOrder.join('|');

    const drafts = state.gallery.filter(function (item) { return !item.visible; }).length;
    const categories = {};

    current.forEach(function (item) { categories[item.category] = true; });

    return {
      added: added,
      removed: removed,
      changed: changed,
      orderChanged: orderChanged,
      total: added + removed + changed + (orderChanged ? 1 : 0),
      currentCount: current.length,
      publishedCount: published.length,
      draftCount: drafts,
      categoryCount: Object.keys(categories).length
    };
  }

  function renderPublishState() {
    const diff = diffGallery();
    const dots = $$('[data-publish-dot]');
    const parts = [];

    if (diff.added) parts.push(diff.added + ' karya baru');
    if (diff.changed) parts.push(diff.changed + ' karya diubah');
    if (diff.removed) parts.push(diff.removed + ' karya dihapus');
    if (diff.orderChanged) parts.push('urutan berubah');

    dots.forEach(function (dot) { dot.hidden = diff.total === 0; });

    if (!el.publishStatus) return diff;

    if (!diff.total) {
      el.publishStatus.textContent = 'Halaman publik sudah sinkron · ' +
        diff.currentCount + ' karya tayang.';
      el.publishStatus.classList.remove('is-dirty');
    } else {
      el.publishStatus.textContent = parts.join(' · ') + ' belum dipublikasikan.';
      el.publishStatus.classList.add('is-dirty');
    }

    return diff;
  }

  function publishableWorks() {
    return visibleSequence().map(function (item) {
      return {
        id: item.id,
        title: item.title,
        category: item.category,
        location: item.location,
        date: item.date,
        image: item.image,
        thumb: thumbUrl(item.image),
        alt: item.alt || item.title
      };
    });
  }

  function buildGalleryFile() {
    const currentVersion = PUBLISHED_GALLERY && Number(PUBLISHED_GALLERY.version)
      ? Number(PUBLISHED_GALLERY.version)
      : 0;
    const payload = {
      version: currentVersion + 1,
      updatedAt: new Date().toISOString(),
      works: publishableWorks()
    };
    const categories = CATEGORY_DEFS.map(function (entry) {
      return { label: entry.label, slug: entry.slug, display: entry.display };
    });

    return '/* =========================================================\n' +
      '   INS FRAME Photography — gallery-data.js\n' +
      '   Sumber data galeri untuk halaman publik.\n\n' +
      '   File ini dihasilkan oleh panel admin (Galeri → Publikasikan).\n' +
      '   Jangan mengedit daftar karya secara manual: ubah lewat admin,\n' +
      '   lalu ganti file ini dengan hasil unduhan "gallery-data.js".\n' +
      '   Setelah diganti, jalankan `npm run build` agar kartu statis\n' +
      '   dan JSON-LD portofolio.html ikut diperbarui.\n' +
      '   ========================================================= */\n' +
      'window.INSFRAME_CATEGORIES = ' + JSON.stringify(categories, null, 2) + ';\n\n' +
      'window.INSFRAME_GALLERY = ' + JSON.stringify(payload, null, 2) + ';\n';
  }

  function publishStat(value, label) {
    return '<div class="adm-publish-stat"><strong>' + escapeHTML(value) + '</strong>' +
      '<span>' + escapeHTML(label) + '</span></div>';
  }

  function renderPublishModal(diff) {
    const stats = diff || diffGallery();
    const updatedAt = PUBLISHED_GALLERY && PUBLISHED_GALLERY.updatedAt
      ? formatPublishedAt(PUBLISHED_GALLERY.updatedAt)
      : '';

    el.publishStats.innerHTML =
      publishStat(stats.currentCount, 'karya tayang') +
      publishStat(stats.categoryCount, 'kategori') +
      publishStat(stats.draftCount, 'draf disembunyikan');

    let diffHTML = '';

    if (!stats.total) {
      diffHTML = '<div class="adm-publish-sync is-clean">' +
        '<span class="adm-publish-sync-icon" aria-hidden="true"><svg><use href="#i-check"></use></svg></span>' +
        '<div><strong>Sudah sinkron</strong>' +
        '<span>Halaman publik memakai data yang sama dengan panel admin.</span></div>' +
        '</div>';
    } else {
      const rows = [];
      if (stats.added) rows.push(['+', stats.added + ' karya baru akan ditambahkan']);
      if (stats.changed) rows.push(['~', stats.changed + ' karya berubah']);
      if (stats.removed) rows.push(['−', stats.removed + ' karya akan dihapus dari publik']);
      if (stats.orderChanged) rows.push(['↕', 'Urutan karya berubah']);

      diffHTML = '<div class="adm-publish-sync is-dirty">' +
        '<span class="adm-publish-sync-icon" aria-hidden="true"><svg><use href="#i-upload"></use></svg></span>' +
        '<div><strong>' + stats.total + ' perubahan menunggu publikasi</strong>' +
        '<span>File baru belum menggantikan data yang dipakai pengunjung.</span></div>' +
        '</div>' +
        '<ul class="adm-publish-diff-list">' +
        rows.map(function (row) {
          return '<li><span aria-hidden="true">' + row[0] + '</span>' + escapeHTML(row[1]) + '</li>';
        }).join('') +
        '</ul>';
    }

    if (updatedAt) {
      diffHTML += '<p class="adm-publish-updated">Terakhir dipublikasikan: ' + escapeHTML(updatedAt) + '.</p>';
    } else {
      diffHTML += '<p class="adm-publish-updated">Belum ada file publik yang terbaca.</p>';
    }

    el.publishDiff.innerHTML = diffHTML;
  }

  function openPublishModal() {
    const diff = renderPublishState();

    renderPublishModal(diff);
    state.publishLastFocus = document.activeElement;
    el.publishModal.hidden = false;
    syncBodyLock();

    window.setTimeout(function () {
      if (el.publishDownload) el.publishDownload.focus();
    }, 40);
  }

  function closePublishModal() {
    if (el.publishModal.hidden) return;

    el.publishModal.hidden = true;
    syncBodyLock();

    if (state.publishLastFocus && document.contains(state.publishLastFocus)) {
      state.publishLastFocus.focus();
    }
  }

  function downloadGalleryFile() {
    const blob = new Blob([buildGalleryFile()], { type: 'text/javascript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'gallery-data.js';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    showToast('gallery-data.js diunduh. Ganti file lama di folder situs.');
  }

  function legacyCopy(text) {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.top = '-1000px';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const copied = document.execCommand('copy');
    area.remove();
    if (!copied) throw new Error('copy-failed');
  }

  async function copyGalleryFile() {
    const content = buildGalleryFile();

    try {
      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(content);
        } catch (error) {
          /* Clipboard API bisa ditolak browser (izin/fokus). Coba cara lama. */
          legacyCopy(content);
        }
      } else {
        legacyCopy(content);
      }
      showToast('Isi gallery-data.js disalin ke clipboard.');
    } catch (error) {
      showToast('Tidak bisa menyalin. Gunakan tombol Unduh.', 'error');
    }
  }

  function populateCategoryOptions() {
    if (el.galleryCategory) {
      el.galleryCategory.innerHTML = '<option value="all">Semua kategori</option>' +
        CATEGORIES.map(function (category) {
          return '<option value="' + escapeHTML(category) + '">' + escapeHTML(category) + '</option>';
        }).join('');
    }

    if (el.workCategory) {
      el.workCategory.innerHTML = CATEGORIES.map(function (category) {
        return '<option value="' + escapeHTML(category) + '">' + escapeHTML(category) + '</option>';
      }).join('');
    }
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
    if (el.settingsContentCount) el.settingsContentCount.textContent = siteItemCount(state.site) + ' item';
  }

  function populateSettingsForm() {
    $('#studioName').value = state.settings.studioName || '';
    $('#studioOwner').value = state.settings.owner || '';
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
    el.workLocation.value = item ? (item.location || '') : '';
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
    const location = el.workLocation.value.trim();
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
          location: location,
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
        location: location,
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
    let firstInvalid = null;

    if (studioName.value.trim().length < 2) {
      setFieldError(studioName, 'Nama studio minimal 2 karakter.');
      firstInvalid = firstInvalid || studioName;
    }

    if (owner.value.trim().length < 2) {
      setFieldError(owner, 'Nama pemilik minimal 2 karakter.');
      firstInvalid = firstInvalid || owner;
    }

    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    state.settings.studioName = studioName.value.trim();
    state.settings.owner = owner.value.trim();

    writeStore(STORAGE_KEYS.settings, state.settings);
    showToast('Profil studio berhasil disimpan.');
  }

  /* ---------------------------------------------------------
     Konten situs: tab & daftar
     --------------------------------------------------------- */
  function textLines(value) {
    return String(value == null ? '' : value)
      .split(/\r?\n/)
      .map(function (line) { return line.trim(); })
      .filter(Boolean);
  }

  function truncate(value, length) {
    const text = String(value == null ? '' : value).trim();
    if (text.length <= length) return text;
    return text.slice(0, length - 1).trim() + '…';
  }

  function contentTabIsValid(tab) {
    return Boolean(CONTENT_KINDS[tab]) || tab === 'about' || tab === 'contact';
  }

  function setContentTab(tab, focus) {
    const next = contentTabIsValid(tab) ? tab : 'services';
    state.contentTab = next;

    $$('[data-content-tab]', el.contentTabs).forEach(function (button) {
      const active = button.dataset.contentTab === next;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', String(active));
      if (active && focus) button.focus();
    });

    el.contentPanels.forEach(function (pane) {
      pane.hidden = pane.dataset.contentPane !== next;
    });

    if (next === 'about') populateAboutForm();
    if (next === 'contact') populateContactForm();
  }

  function renderContent() {
    if (!state.site) return;

    renderContentCounts();
    if (el.contentServices) el.contentServices.innerHTML = contentListHTML('services');
    if (el.contentPackages) el.contentPackages.innerHTML = contentListHTML('packages');
    if (el.contentTestimonials) el.contentTestimonials.innerHTML = contentListHTML('testimonials');
    if (el.contentFaq) el.contentFaq.innerHTML = contentListHTML('faq');

    renderSitePublishState();
    setContentTab(state.contentTab, false);
  }

  function renderContentCounts() {
    const counts = {
      services: state.site.services.length,
      packages: state.site.packages.length,
      testimonials: state.site.testimonials.length,
      faq: state.site.faq.length
    };

    if (el.contentCountServices) el.contentCountServices.textContent = String(counts.services);
    if (el.contentCountPackages) el.contentCountPackages.textContent = String(counts.packages);
    if (el.contentCountTestimonials) el.contentCountTestimonials.textContent = String(counts.testimonials);
    if (el.contentCountFaq) el.contentCountFaq.textContent = String(counts.faq);
    if (el.navContentCount) el.navContentCount.textContent = String(siteItemCount(state.site));
  }

  function contentAvatar(kind, item, index) {
    if (kind === 'packages') {
      return '<span class="adm-content-avatar is-gold"><svg aria-hidden="true"><use href="#i-wallet"></use></svg></span>';
    }
    if (kind === 'faq') {
      return '<span class="adm-content-avatar">' + pad(index + 1) + '</span>';
    }
    return '<span class="adm-content-avatar">' + escapeHTML(initials(item.name)) + '</span>';
  }

  function contentMeta(kind, item) {
    if (kind === 'services') {
      return escapeHTML(truncate(item.description || 'Tanpa deskripsi', 110));
    }
    if (kind === 'packages') {
      const features = item.features.length ? item.features.length + ' fitur' : 'Belum ada fitur';
      return escapeHTML(shortRupiah(item.price) + ' · ' + features);
    }
    if (kind === 'testimonials') {
      const rating = '★★★★★'.slice(0, item.rating) + '☆☆☆☆☆'.slice(0, 5 - item.rating);
      return '<span class="adm-content-stars" aria-hidden="true">' + rating + '</span> ' +
        escapeHTML(item.role || 'Tanpa keterangan');
    }
    return escapeHTML(truncate(item.answer || 'Belum ada jawaban', 120));
  }

  function contentListHTML(kind) {
    const items = state.site[CONTENT_KINDS[kind].collection];
    const singular = CONTENT_KINDS[kind].singular;

    if (!items.length) {
      return '<p class="adm-panel-empty">Belum ada ' + escapeHTML(singular) +
        '. Gunakan tombol tambah di atas untuk membuat yang pertama.</p>';
    }

    return items.map(function (item, index) {
      return '<article class="adm-content-item" data-kind="' + kind + '" data-id="' + escapeHTML(item.id) + '">' +
        contentAvatar(kind, item, index) +
        '<div class="adm-content-info">' +
        '<div class="adm-content-title">' +
        '<strong>' + escapeHTML(item.name || item.question || 'Tanpa judul') + '</strong>' +
        '<span class="adm-badge ' + (item.visible !== false ? 'is-live' : 'is-draft') + '">' +
        (item.visible !== false ? 'Tayang' : 'Draf') + '</span>' +
        (kind === 'packages' && item.popular ? '<span class="adm-badge is-popular">Populer</span>' : '') +
        '</div>' +
        '<p class="adm-content-meta">' + contentMeta(kind, item) + '</p>' +
        '</div>' +
        '<div class="adm-content-actions">' +
        '<button type="button" class="adm-icon-btn" data-action="edit-content" data-kind="' + kind + '" data-id="' + escapeHTML(item.id) + '" aria-label="Edit ' + escapeHTML(item.name || item.question || singular) + '">' +
        '<svg aria-hidden="true"><use href="#i-edit"></use></svg></button>' +
        '<button type="button" class="adm-icon-btn is-danger" data-action="delete-content" data-kind="' + kind + '" data-id="' + escapeHTML(item.id) + '" aria-label="Hapus ' + escapeHTML(item.name || item.question || singular) + '">' +
        '<svg aria-hidden="true"><use href="#i-trash"></use></svg></button>' +
        '</div>' +
        '</article>';
    }).join('');
  }

  /* ---------------------------------------------------------
     Konten situs: modal item
     --------------------------------------------------------- */
  function iconOptions(selected) {
    return SERVICE_ICONS.map(function (entry) {
      return '<option value="' + entry.value + '"' + (entry.value === selected ? ' selected' : '') + '>' +
        escapeHTML(entry.label) + '</option>';
    }).join('');
  }

  function visibleOptions(selected) {
    return '<option value="live"' + (selected ? ' selected' : '') + '>Tayang di halaman publik</option>' +
      '<option value="draft"' + (selected ? '' : ' selected') + '>Simpan sebagai draf</option>';
  }

  function contentFieldsHTML(kind, item) {
    const source = item || {};

    if (kind === 'services') {
      return '<div class="adm-field">' +
        '<label for="contentName">Nama layanan</label>' +
        '<input type="text" id="contentName" name="name" maxlength="60" value="' + escapeHTML(source.name || '') + '" required>' +
        '<span class="adm-error" data-error-for="contentName"></span>' +
        '</div>' +
        '<div class="adm-field-row">' +
        '<div class="adm-field"><label for="contentIcon">Ikon</label>' +
        '<select id="contentIcon" name="icon">' + iconOptions(source.icon || 'camera') + '</select></div>' +
        '<div class="adm-field"><label for="contentVisible">Status</label>' +
        '<select id="contentVisible" name="visible">' + visibleOptions(source.visible !== false) + '</select></div>' +
        '</div>' +
        '<div class="adm-field">' +
        '<label for="contentDescription">Deskripsi</label>' +
        '<textarea id="contentDescription" name="description" rows="4" maxlength="240">' + escapeHTML(source.description || '') + '</textarea>' +
        '<span class="adm-hint">Kalimat singkat yang tampil di kartu layanan.</span>' +
        '<span class="adm-error" data-error-for="contentDescription"></span>' +
        '</div>' +
        '<div class="adm-field">' +
        '<label for="contentImage">URL foto <span>(opsional)</span></label>' +
        '<input type="url" id="contentImage" name="image" value="' + escapeHTML(source.image || '') + '" placeholder="https://... atau assets/foto.jpg">' +
        '<span class="adm-hint">Kosongkan untuk kartu tanpa foto.</span>' +
        '</div>';
    }

    if (kind === 'packages') {
      return '<div class="adm-field">' +
        '<label for="contentName">Nama paket</label>' +
        '<input type="text" id="contentName" name="name" maxlength="40" value="' + escapeHTML(source.name || '') + '" required>' +
        '<span class="adm-error" data-error-for="contentName"></span>' +
        '</div>' +
        '<div class="adm-field-row">' +
        '<div class="adm-field"><label for="contentPrice">Harga (Rp)</label>' +
        '<input type="number" id="contentPrice" name="price" min="0" step="50000" value="' + escapeHTML(source.price || '') + '" required>' +
        '<span class="adm-error" data-error-for="contentPrice"></span></div>' +
        '<div class="adm-field"><label for="contentPopular">Penanda</label>' +
        '<select id="contentPopular" name="popular">' +
        '<option value="no"' + (source.popular ? '' : ' selected') + '>Paket biasa</option>' +
        '<option value="yes"' + (source.popular ? ' selected' : '') + '>Tandai paling populer</option>' +
        '</select></div>' +
        '</div>' +
        '<div class="adm-field">' +
        '<label for="contentTagline">Ringkasan</label>' +
        '<textarea id="contentTagline" name="tagline" rows="3" maxlength="200">' + escapeHTML(source.tagline || '') + '</textarea>' +
        '<span class="adm-error" data-error-for="contentTagline"></span>' +
        '</div>' +
        '<div class="adm-field">' +
        '<label for="contentFeatures">Fitur <span>(satu per baris)</span></label>' +
        '<textarea id="contentFeatures" name="features" rows="6">' + escapeHTML((source.features || []).join('\n')) + '</textarea>' +
        '<span class="adm-hint">Setiap baris menjadi satu poin centang di kartu harga.</span>' +
        '</div>' +
        '<div class="adm-field"><label for="contentVisible">Status</label>' +
        '<select id="contentVisible" name="visible">' + visibleOptions(source.visible !== false) + '</select></div>';
    }

    if (kind === 'testimonials') {
      return '<div class="adm-field-row">' +
        '<div class="adm-field"><label for="contentName">Nama klien</label>' +
        '<input type="text" id="contentName" name="name" maxlength="60" value="' + escapeHTML(source.name || '') + '" required>' +
        '<span class="adm-error" data-error-for="contentName"></span></div>' +
        '<div class="adm-field"><label for="contentRating">Rating</label>' +
        '<select id="contentRating" name="rating">' +
        [5, 4, 3, 2, 1].map(function (value) {
          return '<option value="' + value + '"' + (Number(source.rating || 5) === value ? ' selected' : '') + '>' +
            value + ' bintang</option>';
        }).join('') +
        '</select></div>' +
        '</div>' +
        '<div class="adm-field">' +
        '<label for="contentRole">Keterangan <span>(jenis sesi · kota)</span></label>' +
        '<input type="text" id="contentRole" name="role" maxlength="60" value="' + escapeHTML(source.role || '') + '">' +
        '</div>' +
        '<div class="adm-field">' +
        '<label for="contentQuote">Kutipan</label>' +
        '<textarea id="contentQuote" name="quote" rows="5" maxlength="400" required>' + escapeHTML(source.quote || '') + '</textarea>' +
        '<span class="adm-error" data-error-for="contentQuote"></span>' +
        '</div>' +
        '<div class="adm-field"><label for="contentVisible">Status</label>' +
        '<select id="contentVisible" name="visible">' + visibleOptions(source.visible !== false) + '</select></div>';
    }

    return '<div class="adm-field">' +
      '<label for="contentQuestion">Pertanyaan</label>' +
      '<input type="text" id="contentQuestion" name="question" maxlength="160" value="' + escapeHTML(source.question || '') + '" required>' +
      '<span class="adm-error" data-error-for="contentQuestion"></span>' +
      '</div>' +
      '<div class="adm-field">' +
      '<label for="contentAnswer">Jawaban</label>' +
      '<textarea id="contentAnswer" name="answer" rows="6" maxlength="600" required>' + escapeHTML(source.answer || '') + '</textarea>' +
      '<span class="adm-error" data-error-for="contentAnswer"></span>' +
      '</div>' +
      '<div class="adm-field"><label for="contentVisible">Status</label>' +
      '<select id="contentVisible" name="visible">' + visibleOptions(source.visible !== false) + '</select></div>';
  }

  function openContentModal(kind, id) {
    const def = CONTENT_KINDS[kind];
    if (!def) return;

    const collection = state.site[def.collection];
    const item = id ? collection.find(function (entry) { return entry.id === id; }) : null;

    state.contentKind = kind;
    state.contentEditingId = item ? item.id : null;
    state.contentLastFocus = document.activeElement;

    clearFormErrors(el.contentForm);
    el.contentFields.innerHTML = contentFieldsHTML(kind, item);
    el.contentModalEyebrow.textContent = def.label;
    el.contentModalTitle.textContent = (item ? 'Edit ' : 'Tambah ') + def.singular;
    el.contentSubmit.innerHTML = '<svg aria-hidden="true"><use href="#i-check"></use></svg>' +
      (item ? 'Simpan perubahan' : 'Simpan ' + def.singular);

    el.contentModal.hidden = false;
    syncBodyLock();

    window.setTimeout(function () {
      const first = $('#contentName', el.contentModal) || $('#contentQuestion', el.contentModal);
      if (first) first.focus();
    }, 40);
  }

  function closeContentModal() {
    if (el.contentModal.hidden) return;

    el.contentModal.hidden = true;
    state.contentKind = null;
    state.contentEditingId = null;
    el.contentFields.innerHTML = '';
    syncBodyLock();

    if (state.contentLastFocus && document.contains(state.contentLastFocus)) {
      state.contentLastFocus.focus();
    }
  }

  function handleContentSubmit(event) {
    event.preventDefault();
    clearFormErrors(el.contentForm);

    const kind = state.contentKind;
    const def = CONTENT_KINDS[kind];
    if (!def) return;

    const visible = $('#contentVisible', el.contentForm).value === 'live';
    let firstInvalid = null;
    let record = null;

    if (kind === 'services') {
      const name = $('#contentName', el.contentForm);
      const description = $('#contentDescription', el.contentForm);
      const image = $('#contentImage', el.contentForm);

      if (name.value.trim().length < 2) {
        setFieldError(name, 'Nama layanan minimal 2 karakter.');
        firstInvalid = firstInvalid || name;
      }
      if (description.value.trim().length < 10) {
        setFieldError(description, 'Tulis deskripsi minimal 10 karakter.');
        firstInvalid = firstInvalid || description;
      }
      if (image.value.trim() && !/^(https?:\/\/|assets\/|\.{0,2}\/)/i.test(image.value.trim())) {
        setFieldError(image, 'Gunakan URL http(s) atau path gambar lokal.');
        firstInvalid = firstInvalid || image;
      }
      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

      record = {
        id: state.contentEditingId || makeId('service'),
        name: name.value.trim(),
        icon: $('#contentIcon', el.contentForm).value,
        description: description.value.trim(),
        image: image.value.trim(),
        visible: visible
      };
    }

    if (kind === 'packages') {
      const name = $('#contentName', el.contentForm);
      const price = $('#contentPrice', el.contentForm);
      const tagline = $('#contentTagline', el.contentForm);
      const priceValue = Number(price.value);

      if (name.value.trim().length < 2) {
        setFieldError(name, 'Nama paket minimal 2 karakter.');
        firstInvalid = firstInvalid || name;
      }
      if (!Number.isFinite(priceValue) || priceValue < 0) {
        setFieldError(price, 'Masukkan harga dalam rupiah.');
        firstInvalid = firstInvalid || price;
      }
      if (tagline.value.trim().length < 10) {
        setFieldError(tagline, 'Tulis ringkasan minimal 10 karakter.');
        firstInvalid = firstInvalid || tagline;
      }
      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

      record = {
        id: state.contentEditingId || makeId('package'),
        name: name.value.trim(),
        price: Math.round(priceValue),
        tagline: tagline.value.trim(),
        features: textLines($('#contentFeatures', el.contentForm).value),
        popular: $('#contentPopular', el.contentForm).value === 'yes',
        visible: visible
      };
    }

    if (kind === 'testimonials') {
      const name = $('#contentName', el.contentForm);
      const quote = $('#contentQuote', el.contentForm);

      if (name.value.trim().length < 2) {
        setFieldError(name, 'Nama klien minimal 2 karakter.');
        firstInvalid = firstInvalid || name;
      }
      if (quote.value.trim().length < 10) {
        setFieldError(quote, 'Tulis kutipan minimal 10 karakter.');
        firstInvalid = firstInvalid || quote;
      }
      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

      record = {
        id: state.contentEditingId || makeId('testimonial'),
        name: name.value.trim(),
        role: $('#contentRole', el.contentForm).value.trim(),
        quote: quote.value.trim(),
        rating: Number($('#contentRating', el.contentForm).value) || 5,
        visible: visible
      };
    }

    if (kind === 'faq') {
      const question = $('#contentQuestion', el.contentForm);
      const answer = $('#contentAnswer', el.contentForm);

      if (question.value.trim().length < 5) {
        setFieldError(question, 'Pertanyaan minimal 5 karakter.');
        firstInvalid = firstInvalid || question;
      }
      if (answer.value.trim().length < 10) {
        setFieldError(answer, 'Jawaban minimal 10 karakter.');
        firstInvalid = firstInvalid || answer;
      }
      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

      record = {
        id: state.contentEditingId || makeId('faq'),
        question: question.value.trim(),
        answer: answer.value.trim(),
        visible: visible
      };
    }

    if (!record) return;

    const collection = state.site[def.collection];
    const index = collection.findIndex(function (entry) { return entry.id === record.id; });

    if (index !== -1) {
      collection[index] = record;
      showToast('Perubahan ' + def.singular + ' disimpan.');
    } else {
      collection.push(record);
      showToast(def.singular.charAt(0).toUpperCase() + def.singular.slice(1) + ' baru ditambahkan.');
    }

    persistSite();
    closeContentModal();
  }

  async function deleteContent(kind, id) {
    const def = CONTENT_KINDS[kind];
    if (!def) return;

    const collection = state.site[def.collection];
    const item = collection.find(function (entry) { return entry.id === id; });
    if (!item) return;

    const label = item.name || item.question || def.singular;
    const confirmed = await askConfirm({
      title: 'Hapus ' + def.singular + '?',
      message: '"' + label + '" akan dihapus dari konten situs. Tindakan ini tidak bisa dibatalkan.',
      confirmText: 'Hapus ' + def.singular
    });

    if (!confirmed) return;

    state.site[def.collection] = collection.filter(function (entry) { return entry.id !== id; });
    persistSite();
    showToast(def.label + ' "' + label + '" dihapus.');
  }

  function persistSite(message) {
    state.site = normalizeSiteData(state.site);
    writeStore(STORAGE_KEYS.site, state.site);
    renderContent();
    renderDashboard();
    if (message) showToast(message);
  }

  /* ---------------------------------------------------------
     Konten situs: Tentang
     --------------------------------------------------------- */
  function renderStatsEditor(stats) {
    el.aboutStatsList.innerHTML = stats.map(function (stat, index) {
      return '<div class="adm-stat-row" data-stat-row>' +
        '<input type="text" data-stat="label" value="' + escapeHTML(stat.label || '') + '" placeholder="Label" aria-label="Label statistik ' + (index + 1) + '">' +
        '<input type="number" data-stat="value" value="' + escapeHTML(stat.value == null ? '' : stat.value) + '" step="any" placeholder="Angka" aria-label="Nilai statistik ' + (index + 1) + '">' +
        '<input type="text" data-stat="suffix" value="' + escapeHTML(stat.suffix || '') + '" placeholder="+" maxlength="6" aria-label="Akhiran statistik ' + (index + 1) + '">' +
        '<select data-stat="decimals" aria-label="Desimal statistik ' + (index + 1) + '">' +
        [0, 1, 2, 3].map(function (value) {
          return '<option value="' + value + '"' + (Number(stat.decimals || 0) === value ? ' selected' : '') + '>' +
            value + ' desimal</option>';
        }).join('') +
        '</select>' +
        '<button type="button" class="adm-icon-btn is-danger" data-remove-stat aria-label="Hapus statistik ' + (index + 1) + '">' +
        '<svg aria-hidden="true"><use href="#i-trash"></use></svg></button>' +
        '</div>';
    }).join('');
  }

  function addStatRow() {
    const row = document.createElement('div');
    row.className = 'adm-stat-row';
    row.setAttribute('data-stat-row', '');
    row.innerHTML =
      '<input type="text" data-stat="label" value="" placeholder="Label" aria-label="Label statistik baru">' +
      '<input type="number" data-stat="value" value="" step="any" placeholder="Angka" aria-label="Nilai statistik baru">' +
      '<input type="text" data-stat="suffix" value="" placeholder="+" maxlength="6" aria-label="Akhiran statistik baru">' +
      '<select data-stat="decimals" aria-label="Desimal statistik baru">' +
      '<option value="0">0 desimal</option><option value="1">1 desimal</option>' +
      '<option value="2">2 desimal</option><option value="3">3 desimal</option></select>' +
      '<button type="button" class="adm-icon-btn is-danger" data-remove-stat aria-label="Hapus statistik">' +
      '<svg aria-hidden="true"><use href="#i-trash"></use></svg></button>';
    el.aboutStatsList.appendChild(row);
    const input = $('[data-stat="label"]', row);
    if (input) input.focus();
  }

  function collectStats() {
    return $$('[data-stat-row]', el.aboutStatsList).map(function (row) {
      const label = $('[data-stat="label"]', row).value.trim();
      if (!label) return null;
      return {
        label: label,
        value: Number($('[data-stat="value"]', row).value) || 0,
        suffix: $('[data-stat="suffix"]', row).value.trim(),
        decimals: Number($('[data-stat="decimals"]', row).value) || 0
      };
    }).filter(Boolean);
  }

  function populateAboutForm() {
    if (!el.aboutForm || !state.site) return;
    el.aboutParagraphs.value = state.site.about.paragraphs.join('\n');
    el.aboutPoints.value = state.site.about.points.join('\n');
    renderStatsEditor(state.site.about.stats);
  }

  function handleAboutSubmit(event) {
    event.preventDefault();

    state.site.about.paragraphs = textLines(el.aboutParagraphs.value);
    state.site.about.points = textLines(el.aboutPoints.value);
    state.site.about.stats = collectStats();

    persistSite('Teks Tentang disimpan.');
  }

  /* ---------------------------------------------------------
     Konten situs: kontak & sosial
     --------------------------------------------------------- */
  function populateContactForm() {
    if (!state.site || !el.contactForm) return;

    $('#contactPhone').value = state.site.contact.phone || '';
    $('#contactPhoneDisplay').value = state.site.contact.phoneDisplay || '';
    $('#contactEmail').value = state.site.contact.email || '';
    $('#contactAddress').value = state.site.contact.address.join('\n');
    $('#contactHours').value = state.site.contact.hours.join('\n');

    $('#socialInstagram').value = state.site.socials.instagram || '';
    $('#socialFacebook').value = state.site.socials.facebook || '';
    $('#socialYoutube').value = state.site.socials.youtube || '';
  }

  function handleContactSubmit(event) {
    event.preventDefault();
    clearFormErrors(el.contactForm);

    const phone = $('#contactPhone');
    const phoneDisplay = $('#contactPhoneDisplay');
    const email = $('#contactEmail');
    let firstInvalid = null;
    const digits = phone.value.replace(/[^\d]/g, '');

    if (digits.length < 8 || digits.length > 15) {
      setFieldError(phone, 'Masukkan nomor WhatsApp yang valid.');
      firstInvalid = firstInvalid || phone;
    }

    if (!EMAIL_PATTERN.test(email.value.trim())) {
      setFieldError(email, 'Masukkan email yang valid.');
      firstInvalid = firstInvalid || email;
    }

    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    state.site.contact.phone = phone.value.trim();
    state.site.contact.phoneDisplay = phoneDisplay.value.trim();
    state.site.contact.email = email.value.trim();
    state.site.contact.address = textLines($('#contactAddress').value);
    state.site.contact.hours = textLines($('#contactHours').value);

    persistSite('Kontak situs disimpan.');
  }

  function handleSocialSubmit(event) {
    event.preventDefault();
    clearFormErrors(el.socialForm);

    state.site.socials.instagram = $('#socialInstagram').value.trim();
    state.site.socials.facebook = $('#socialFacebook').value.trim();
    state.site.socials.youtube = $('#socialYoutube').value.trim();

    persistSite('Tautan sosial disimpan.');
  }

  /* ---------------------------------------------------------
     Konten situs: publikasi
     --------------------------------------------------------- */
  function sitePayload(site) {
    return {
      contact: site.contact,
      socials: site.socials,
      services: site.services,
      packages: site.packages,
      testimonials: site.testimonials,
      faq: site.faq,
      about: site.about
    };
  }

  function diffSite() {
    const current = state.site || seedSite();
    const published = publishedSiteData();
    const groups = [
      { key: 'services', label: 'layanan' },
      { key: 'packages', label: 'paket' },
      { key: 'testimonials', label: 'testimoni' },
      { key: 'faq', label: 'FAQ' },
      { key: 'about', label: 'teks Tentang' },
      { key: 'contact', label: 'kontak' },
      { key: 'socials', label: 'tautan sosial' }
    ];

    const changed = groups.filter(function (group) {
      return JSON.stringify(current[group.key]) !== JSON.stringify(published[group.key]);
    }).map(function (group) { return group.label; });

    return {
      changed: changed,
      total: changed.length,
      services: current.services.length,
      packages: current.packages.length,
      testimonials: current.testimonials.length,
      faq: current.faq.length,
      contentCount: siteItemCount(current)
    };
  }

  function renderSitePublishState() {
    const diff = diffSite();
    const dots = $$('[data-site-publish-dot]');

    dots.forEach(function (dot) { dot.hidden = diff.total === 0; });

    if (!el.sitePublishStatus) return diff;

    if (!diff.total) {
      el.sitePublishStatus.textContent = 'Konten publik sudah sinkron · ' +
        diff.services + ' layanan, ' + diff.packages + ' paket, ' +
        diff.testimonials + ' testimoni, ' + diff.faq + ' FAQ.';
      el.sitePublishStatus.classList.remove('is-dirty');
    } else {
      el.sitePublishStatus.textContent = diff.changed.join(', ') + ' belum dipublikasikan.';
      el.sitePublishStatus.classList.add('is-dirty');
    }

    return diff;
  }

  function buildSiteFile() {
    const currentVersion = PUBLISHED_SITE && Number(PUBLISHED_SITE.version)
      ? Number(PUBLISHED_SITE.version)
      : 0;
    const payload = Object.assign({
      version: currentVersion + 1,
      updatedAt: new Date().toISOString()
    }, sitePayload(state.site));

    return '/* =========================================================\n' +
      '   INS FRAME Photography — site-data.js\n' +
      '   Sumber data konten situs: kontak, sosial, layanan, paket,\n' +
      '   testimoni, FAQ, dan teks Tentang.\n\n' +
      '   File ini dihasilkan oleh panel admin (Konten → Publikasikan).\n' +
      '   Jangan mengedit daftar konten secara manual: ubah lewat admin,\n' +
      '   lalu ganti file ini dengan hasil unduhan "site-data.js".\n' +
      '   Setelah diganti, jalankan `npm run build` agar halaman publik\n' +
      '   dan JSON-LD ikut diperbarui.\n' +
      '   ========================================================= */\n' +
      'window.INSFRAME_SITE = ' + JSON.stringify(payload, null, 2) + ';\n';
  }

  function renderSitePublishModal(diff) {
    const stats = diff || diffSite();
    const updatedAt = PUBLISHED_SITE && PUBLISHED_SITE.updatedAt
      ? formatPublishedAt(PUBLISHED_SITE.updatedAt)
      : '';

    el.sitePublishStats.innerHTML =
      publishStat(stats.services, 'layanan') +
      publishStat(stats.packages, 'paket') +
      publishStat(stats.testimonials, 'testimoni') +
      publishStat(stats.faq, 'FAQ');

    let diffHTML = '';

    if (!stats.total) {
      diffHTML = '<div class="adm-publish-sync is-clean">' +
        '<span class="adm-publish-sync-icon" aria-hidden="true"><svg><use href="#i-check"></use></svg></span>' +
        '<div><strong>Sudah sinkron</strong>' +
        '<span>Halaman publik memakai data konten yang sama dengan panel admin.</span></div>' +
        '</div>';
    } else {
      diffHTML = '<div class="adm-publish-sync is-dirty">' +
        '<span class="adm-publish-sync-icon" aria-hidden="true"><svg><use href="#i-upload"></use></svg></span>' +
        '<div><strong>' + stats.total + ' bagian konten menunggu publikasi</strong>' +
        '<span>File baru belum menggantikan data yang dipakai pengunjung.</span></div>' +
        '</div>' +
        '<ul class="adm-publish-diff-list">' +
        stats.changed.map(function (label) {
          return '<li><span aria-hidden="true">~</span>' + escapeHTML(label) + ' berubah</li>';
        }).join('') +
        '</ul>';
    }

    diffHTML += updatedAt
      ? '<p class="adm-publish-updated">Terakhir dipublikasikan: ' + escapeHTML(updatedAt) + '.</p>'
      : '<p class="adm-publish-updated">Belum ada file publik yang terbaca.</p>';

    el.sitePublishDiff.innerHTML = diffHTML;
  }

  function openSitePublishModal() {
    const diff = renderSitePublishState();

    renderSitePublishModal(diff);
    state.sitePublishLastFocus = document.activeElement;
    el.sitePublishModal.hidden = false;
    syncBodyLock();

    window.setTimeout(function () {
      if (el.sitePublishDownload) el.sitePublishDownload.focus();
    }, 40);
  }

  function closeSitePublishModal() {
    if (el.sitePublishModal.hidden) return;

    el.sitePublishModal.hidden = true;
    syncBodyLock();

    if (state.sitePublishLastFocus && document.contains(state.sitePublishLastFocus)) {
      state.sitePublishLastFocus.focus();
    }
  }

  function downloadSiteFile() {
    const blob = new Blob([buildSiteFile()], { type: 'text/javascript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'site-data.js';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    showToast('site-data.js diunduh. Ganti file lama di folder situs.');
  }

  async function copySiteFile() {
    const content = buildSiteFile();

    try {
      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(content);
        } catch (error) {
          legacyCopy(content);
        }
      } else {
        legacyCopy(content);
      }
      showToast('Isi site-data.js disalin ke clipboard.');
    } catch (error) {
      showToast('Tidak bisa menyalin. Gunakan tombol Unduh.', 'error');
    }
  }

  /* ---------------------------------------------------------
     Ekspor / impor / reset
     --------------------------------------------------------- */
  function exportData() {
    const payload = {
      app: 'INS FRAME Studio Admin',
      version: 2,
      exportedAt: new Date().toISOString(),
      gallery: state.gallery,
      bookings: state.bookings,
      settings: state.settings,
      site: state.site
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
    const hasSite = data.site && typeof data.site === 'object';

    if (!hasGallery && !hasBookings && !hasSite) {
      showToast('Struktur file tidak dikenali.', 'error');
      return;
    }

    const confirmed = await askConfirm({
      title: 'Impor data?',
      message: 'Galeri, pesanan, dan konten situs saat ini akan diganti dengan isi file cadangan.',
      confirmText: 'Impor data',
      danger: false
    });

    if (!confirmed) return;

    if (hasGallery) state.gallery = data.gallery.map(normalizeGallery);
    if (hasBookings) state.bookings = data.bookings.map(normalizeBooking);
    if (data.settings && typeof data.settings === 'object') {
      state.settings = normalizeSettings(data.settings);
    }
    if (hasSite) state.site = normalizeSiteData(data.site);

    writeStore(STORAGE_KEYS.gallery, state.gallery);
    writeStore(STORAGE_KEYS.bookings, state.bookings);
    writeStore(STORAGE_KEYS.settings, state.settings);
    if (hasSite) writeStore(STORAGE_KEYS.site, state.site);

    updateCounts();
    renderDashboard();
    renderGallery();
    renderOrders();
    renderContent();
    renderSettings();
    showToast('Data berhasil diimpor.');
  }

  async function resetData() {
    const confirmed = await askConfirm({
      title: 'Reset data lokal?',
      message: 'Semua perubahan lokal akan dihapus. Galeri dan konten dikembalikan ke data publik terakhir, sedangkan pesanan dan profil ke contoh awal.',
      confirmText: 'Reset data'
    });

    if (!confirmed) return;

    state.gallery = seedGallery().map(normalizeGallery);
    state.bookings = seedBookings().map(normalizeBooking);
    state.settings = seedSettings();
    state.site = seedSite();

    writeStore(STORAGE_KEYS.gallery, state.gallery);
    writeStore(STORAGE_KEYS.bookings, state.bookings);
    writeStore(STORAGE_KEYS.settings, state.settings);
    writeStore(STORAGE_KEYS.site, state.site);

    updateCounts();
    renderDashboard();
    renderGallery();
    renderOrders();
    renderContent();
    renderSettings();
    showToast('Data lokal direset ke data publik terakhir.');
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

      if (event.target.closest('[data-close-publish]')) {
        closePublishModal();
        return;
      }

      if (event.target.closest('[data-publish-download]')) {
        downloadGalleryFile();
        return;
      }

      if (event.target.closest('[data-publish-copy]')) {
        copyGalleryFile();
        return;
      }

      if (event.target.closest('[data-close-content]')) {
        closeContentModal();
        return;
      }

      if (event.target.closest('[data-close-site-publish]')) {
        closeSitePublishModal();
        return;
      }

      if (event.target.closest('[data-site-publish-download]')) {
        downloadSiteFile();
        return;
      }

      if (event.target.closest('[data-site-publish-copy]')) {
        copySiteFile();
        return;
      }

      if (event.target.closest('[data-add-stat]')) {
        addStatRow();
        return;
      }

      const removeStatButton = event.target.closest('[data-remove-stat]');
      if (removeStatButton) {
        const row = removeStatButton.closest('[data-stat-row]');
        if (row) row.remove();
        return;
      }

      const addContentButton = event.target.closest('[data-content-add]');
      if (addContentButton) {
        openContentModal(addContentButton.dataset.contentAdd);
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
      if (action === 'publish') openPublishModal();
      if (action === 'publish-site') openSitePublishModal();
      if (action === 'import') el.importInput.click();
      if (action === 'reset') resetData();
      if (action === 'edit-work') openWorkModal(id);
      if (action === 'delete-work') deleteWork(id);
      if (action === 'delete-order') deleteOrder(id);
      if (action === 'edit-content') openContentModal(actionElement.dataset.kind, id);
      if (action === 'delete-content') deleteContent(actionElement.dataset.kind, id);
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
        if (!el.publishModal.hidden) {
          event.preventDefault();
          closePublishModal();
          return;
        }
        if (!el.sitePublishModal.hidden) {
          event.preventDefault();
          closeSitePublishModal();
          return;
        }
        if (!el.contentModal.hidden) {
          event.preventDefault();
          closeContentModal();
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
        } else if (!el.publishModal.hidden) {
          trapFocus(event, el.publishModal.querySelector('[role="dialog"]'));
        } else if (!el.sitePublishModal.hidden) {
          trapFocus(event, el.sitePublishModal.querySelector('[role="dialog"]'));
        } else if (!el.contentModal.hidden) {
          trapFocus(event, el.contentModal.querySelector('[role="dialog"]'));
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
    el.contentForm.addEventListener('submit', handleContentSubmit);
    el.aboutForm.addEventListener('submit', handleAboutSubmit);
    el.contactForm.addEventListener('submit', handleContactSubmit);
    el.socialForm.addEventListener('submit', handleSocialSubmit);

    el.contentTabs.addEventListener('click', function (event) {
      const tab = event.target.closest('[data-content-tab]');
      if (!tab) return;
      setContentTab(tab.dataset.contentTab, false);
    });

    el.contentForm.addEventListener('input', function (event) {
      if (event.target.closest('.adm-field') && event.target.closest('.adm-field').classList.contains('has-error')) {
        setFieldError(event.target, '');
      }
    });

    el.contactForm.addEventListener('input', function (event) {
      if (event.target.closest('.adm-field') && event.target.closest('.adm-field').classList.contains('has-error')) {
        setFieldError(event.target, '');
      }
    });

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
    const storedSite = readStore(STORAGE_KEYS.site, null);

    state.gallery = (Array.isArray(storedGallery) ? storedGallery : seedGallery()).map(normalizeGallery);
    state.bookings = (Array.isArray(storedBookings) ? storedBookings : seedBookings()).map(normalizeBooking);
    state.settings = normalizeSettings(storedSettings);
    state.site = storedSite && typeof storedSite === 'object'
      ? normalizeSiteData(storedSite)
      : seedSite();

    if (!Array.isArray(storedGallery)) writeStore(STORAGE_KEYS.gallery, state.gallery);
    if (!Array.isArray(storedBookings)) writeStore(STORAGE_KEYS.bookings, state.bookings);
    if (!storedSettings) writeStore(STORAGE_KEYS.settings, state.settings);
    if (!storedSite) writeStore(STORAGE_KEYS.site, state.site);

    populateCategoryOptions();
    applyTheme(currentTheme());
    bindEvents();

    $('#adminYear').textContent = String(new Date().getFullYear());
    updateCounts();
    renderDashboard();
    renderGallery();
    renderOrders();
    renderContent();
    renderSettings();

    handleRoute();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
