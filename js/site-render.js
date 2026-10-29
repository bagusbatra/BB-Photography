/* =========================================================
   INS FRAME Photography — site-render.js
   Menampilkan konten dari js/site-data.js ke halaman publik:
   layanan, paket harga, testimoni, FAQ, teks Tentang, kontak,
   pilihan form booking, dan tautan sosial.

   Mode pratinjau: tambahkan ?preview=1 pada URL halaman. Renderer
   membaca data lokal panel admin di browser yang sama, sehingga
   perubahan bisa dicek sebelum js/site-data.js diganti.

   Semua fungsi markup diekspos lewat window.INSFRAME_SITE_RENDER
   agar scripts/prerender-site.js menghasilkan HTML statis yang sama.
   ========================================================= */
(function () {
  'use strict';

  var STORAGE_KEY = 'insframe.admin.site.v1';
  var ICON_NAMES = [
    'camera', 'heart', 'user', 'box', 'calendar', 'film', 'graduation',
    'sparkle', 'rings', 'diamond', 'road', 'building', 'mountain', 'moon',
    'pin', 'mail', 'phone', 'clock'
  ];
  var FALLBACK_SITE = {
    version: 1,
    updatedAt: '',
    contact: {
      phone: '',
      phoneDisplay: '',
      email: '',
      address: [],
      hours: []
    },
    socials: { instagram: '', facebook: '', youtube: '' },
    services: [],
    packages: [],
    testimonials: [],
    faq: [],
    about: { paragraphs: [], points: [], stats: [] }
  };

  /* ---------------------------------------------------------
     Util
     --------------------------------------------------------- */
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

  function slugify(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function text(value, fallback) {
    var result = String(value == null ? '' : value).trim();
    return result || (fallback == null ? '' : fallback);
  }

  function asArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function lines(value) {
    if (Array.isArray(value)) {
      return value.map(function (item) { return text(item); }).filter(Boolean);
    }
    return String(value == null ? '' : value)
      .split(/\r?\n/)
      .map(function (line) { return line.trim(); })
      .filter(Boolean);
  }

  function isVisible(item) {
    return item && item.visible !== false;
  }

  function visibleItems(list) {
    return asArray(list).filter(isVisible);
  }

  function number(value, fallback) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : (fallback || 0);
  }

  function pad2(value) {
    return String(value).padStart(2, '0');
  }

  function initials(name) {
    var words = String(name || '')
      .replace(/[^\p{L}\s]/gu, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (!words.length) return 'IF';
    return (words[0].charAt(0) + (words[1] ? words[1].charAt(0) : '')).toUpperCase();
  }

  function phoneDigits(value) {
    var digits = String(value || '').replace(/[^\d]/g, '');
    if (digits.charAt(0) === '0') digits = '62' + digits.slice(1);
    if (digits.charAt(0) === '8') digits = '62' + digits;
    return digits;
  }

  function waHref(site) {
    var digits = phoneDigits(site.contact && site.contact.phone);
    return digits ? 'https://wa.me/' + digits : '';
  }

  function socialUrl(value) {
    var raw = text(value);
    if (!raw) return '';
    if (/^https?:\/\//i.test(raw)) return raw;
    if (raw.charAt(0) === '@') return 'https://instagram.com/' + raw.slice(1);
    if (raw.indexOf('instagram.com') !== -1) return 'https://' + raw.replace(/^\/+/, '');
    return 'https://' + raw.replace(/^\/+/, '');
  }

  function formatPriceParts(value) {
    var price = number(value);
    if (price >= 1000000) {
      return {
        amount: (price / 1000000).toLocaleString('id-ID', { maximumFractionDigits: 1 }),
        suffix: 'jt / sesi'
      };
    }
    if (price >= 1000) {
      return {
        amount: (price / 1000).toLocaleString('id-ID', { maximumFractionDigits: 0 }),
        suffix: 'rb / sesi'
      };
    }
    return { amount: price ? price.toLocaleString('id-ID') : '—', suffix: price ? '/ sesi' : 'konsultasi' };
  }

  function priceCompact(value) {
    var parts = formatPriceParts(value);
    if (parts.amount === '—') return '';
    var unit = parts.suffix.indexOf('jt') !== -1 ? 'jt' : (parts.suffix.indexOf('rb') !== -1 ? 'rb' : '');
    return 'Rp ' + parts.amount + unit;
  }

  /* ---------------------------------------------------------
     Normalisasi data
     --------------------------------------------------------- */
  function normalizeSocials(value, fallback) {
    var source = value && typeof value === 'object' ? value : {};
    var base = fallback && typeof fallback === 'object' ? fallback : {};
    return {
      instagram: socialUrl(source.instagram != null ? source.instagram : base.instagram),
      facebook: socialUrl(source.facebook != null ? source.facebook : base.facebook),
      youtube: socialUrl(source.youtube != null ? source.youtube : base.youtube)
    };
  }

  function normalizeContact(value, fallback) {
    var source = value && typeof value === 'object' ? value : {};
    var base = fallback && typeof fallback === 'object' ? fallback : {};
    var phone = text(source.phone != null ? source.phone : base.phone);
    var digits = phoneDigits(phone);
    var display = text(source.phoneDisplay != null ? source.phoneDisplay : base.phoneDisplay);

    if (!display && digits) {
      display = '+' + digits.replace(/^62/, '62 ');
    }
    if (!phone && display) phone = digits;

    return {
      phone: digits || phone,
      phoneDisplay: display,
      email: text(source.email != null ? source.email : base.email),
      address: lines(source.address != null ? source.address : base.address),
      hours: lines(source.hours != null ? source.hours : base.hours)
    };
  }

  function normalizeServices(value, fallback) {
    var source = Array.isArray(value) ? value : (Array.isArray(fallback) ? fallback : []);
    var used = Object.create(null);

    return source.map(function (entry, index) {
      var item = entry && typeof entry === 'object' ? entry : {};
      var name = text(item.name);
      if (!name) return null;

      var id = text(item.id) || 'service-' + (slugify(name) || index);
      var base = id;
      var suffix = 2;
      while (used[id]) {
        id = base + '-' + suffix;
        suffix += 1;
      }
      used[id] = true;

      var icon = text(item.icon);
      return {
        id: id,
        name: name,
        icon: ICON_NAMES.indexOf(icon) === -1 ? 'camera' : icon,
        description: text(item.description),
        image: text(item.image),
        visible: item.visible !== false
      };
    }).filter(Boolean);
  }

  function normalizePackages(value, fallback) {
    var source = Array.isArray(value) ? value : (Array.isArray(fallback) ? fallback : []);
    var used = Object.create(null);

    return source.map(function (entry, index) {
      var item = entry && typeof entry === 'object' ? entry : {};
      var name = text(item.name);
      if (!name) return null;

      var id = text(item.id) || 'package-' + (slugify(name) || index);
      var base = id;
      var suffix = 2;
      while (used[id]) {
        id = base + '-' + suffix;
        suffix += 1;
      }
      used[id] = true;

      return {
        id: id,
        name: name,
        price: Math.max(0, Math.round(number(item.price))),
        tagline: text(item.tagline),
        features: lines(item.features),
        popular: item.popular === true,
        visible: item.visible !== false
      };
    }).filter(Boolean);
  }

  function normalizeTestimonials(value, fallback) {
    var source = Array.isArray(value) ? value : (Array.isArray(fallback) ? fallback : []);
    var used = Object.create(null);

    return source.map(function (entry, index) {
      var item = entry && typeof entry === 'object' ? entry : {};
      var name = text(item.name);
      var quote = text(item.quote);
      if (!name || !quote) return null;

      var id = text(item.id) || 'testimonial-' + (slugify(name) || index);
      var base = id;
      var suffix = 2;
      while (used[id]) {
        id = base + '-' + suffix;
        suffix += 1;
      }
      used[id] = true;

      return {
        id: id,
        name: name,
        role: text(item.role),
        quote: quote,
        rating: Math.min(5, Math.max(1, Math.round(number(item.rating, 5)))),
        visible: item.visible !== false
      };
    }).filter(Boolean);
  }

  function normalizeFaq(value, fallback) {
    var source = Array.isArray(value) ? value : (Array.isArray(fallback) ? fallback : []);
    var used = Object.create(null);

    return source.map(function (entry, index) {
      var item = entry && typeof entry === 'object' ? entry : {};
      var question = text(item.question);
      var answer = text(item.answer);
      if (!question || !answer) return null;

      var id = text(item.id) || 'faq-' + (slugify(question) || index);
      var base = id;
      var suffix = 2;
      while (used[id]) {
        id = base + '-' + suffix;
        suffix += 1;
      }
      used[id] = true;

      return {
        id: id,
        question: question,
        answer: answer,
        visible: item.visible !== false
      };
    }).filter(Boolean);
  }

  function normalizeStats(value, fallback) {
    var source = Array.isArray(value) ? value : (Array.isArray(fallback) ? fallback : []);
    return source.map(function (entry) {
      var item = entry && typeof entry === 'object' ? entry : {};
      var label = text(item.label);
      if (!label) return null;
      return {
        label: label,
        value: number(item.value),
        suffix: text(item.suffix),
        decimals: Math.max(0, Math.min(3, Math.round(number(item.decimals))))
      };
    }).filter(Boolean);
  }

  function normalizeAbout(value, fallback) {
    var source = value && typeof value === 'object' ? value : {};
    var base = fallback && typeof fallback === 'object' ? fallback : {};
    return {
      paragraphs: lines(source.paragraphs != null ? source.paragraphs : base.paragraphs),
      points: lines(source.points != null ? source.points : base.points),
      stats: normalizeStats(source.stats != null ? source.stats : base.stats, base.stats)
    };
  }

  /* API build: menerima data mentah, selalu mengembalikan bentuk
     lengkap yang sama untuk browser, admin, dan pre-render. */
  function prepareSite(source) {
    var defaults = window.INSFRAME_SITE && typeof window.INSFRAME_SITE === 'object'
      ? window.INSFRAME_SITE
      : FALLBACK_SITE;
    var data = source && typeof source === 'object' ? source : {};
    var baseContact = defaults.contact || FALLBACK_SITE.contact;

    return {
      version: number(data.version, defaults.version || 1) || 1,
      updatedAt: text(data.updatedAt, defaults.updatedAt || ''),
      contact: normalizeContact(data.contact, baseContact),
      socials: normalizeSocials(data.socials, defaults.socials),
      services: normalizeServices(data.services, defaults.services),
      packages: normalizePackages(data.packages, defaults.packages),
      testimonials: normalizeTestimonials(data.testimonials, defaults.testimonials),
      faq: normalizeFaq(data.faq, defaults.faq),
      about: normalizeAbout(data.about, defaults.about)
    };
  }

  /* ---------------------------------------------------------
     Markup: layanan
     --------------------------------------------------------- */
  function serviceCard(service, index) {
    var href = 'kontak.html?layanan=' + encodeURIComponent(slugify(service.name));
    var image = service.image
      ? '<img src="' + escapeHTML(service.image) + '" alt="" width="640" height="800" loading="lazy" decoding="async">'
      : '';

    return '<article class="service-card reveal">' +
      '<div class="service-inner">' +
      '<span class="service-photo" aria-hidden="true">' + image + '</span>' +
      '<div class="service-top">' +
      '<span class="service-icon"><svg aria-hidden="true"><use href="#icon-' + escapeHTML(service.icon) + '"></use></svg></span>' +
      '<span class="service-rule" aria-hidden="true"></span>' +
      '<span class="service-num" aria-hidden="true">' + pad2(index + 1) + '</span>' +
      '</div>' +
      '<h3>' + escapeHTML(service.name) + '</h3>' +
      '<p>' + escapeHTML(service.description) + '</p>' +
      '<a href="' + escapeHTML(href) + '" class="card-link" aria-label="Booking ' + escapeHTML(service.name) + '">' +
      'Booking sekarang <span class="card-arrow" aria-hidden="true"><svg><use href="#icon-arrow-right"></use></svg></span></a>' +
      '</div>' +
      '</article>';
  }

  /* ---------------------------------------------------------
     Markup: paket harga
     --------------------------------------------------------- */
  function packageCard(pkg) {
    var price = formatPriceParts(pkg.price);
    var features = pkg.features.length
      ? '<ul class="price-features">' + pkg.features.map(function (feature) {
        return '<li>' + escapeHTML(feature) + '</li>';
      }).join('') + '</ul>'
      : '<ul class="price-features" aria-hidden="true"></ul>';
    var href = 'kontak.html?paket=' + encodeURIComponent(pkg.name);
    var cta = pkg.name === 'Custom' ? 'Konsultasi paket' : 'Pilih paket';

    return '<article class="price-card reveal' + (pkg.popular ? ' is-popular' : '') + '">' +
      (pkg.popular ? '<span class="popular-badge">Paling dipilih</span>' : '') +
      '<h3>' + escapeHTML(pkg.name) + '</h3>' +
      '<p class="price-desc">' + escapeHTML(pkg.tagline) + '</p>' +
      '<div class="price">' +
      '<span class="currency">Rp</span>' +
      '<span class="price-amount">' + escapeHTML(price.amount) + '</span>' +
      '<small>' + escapeHTML(price.suffix) + '</small>' +
      '</div>' +
      features +
      '<a class="btn ' + (pkg.popular ? 'btn-primary' : 'btn-outline') + '" href="' + escapeHTML(href) + '">' +
      escapeHTML(cta) +
      '</a>' +
      '</article>';
  }

  /* ---------------------------------------------------------
     Markup: testimoni
     --------------------------------------------------------- */
  function stars(rating) {
    var value = Math.min(5, Math.max(1, Math.round(number(rating, 5))));
    return '★★★★★'.slice(0, value) + '☆☆☆☆☆'.slice(0, 5 - value);
  }

  function testimonialSlide(item, index, total) {
    return '<figure class="slide" role="group" aria-roledescription="slide" aria-label="' +
      (index + 1) + ' dari ' + total + '">' +
      '<span class="quote-mark" aria-hidden="true">“</span>' +
      '<span class="stars" aria-label="' + item.rating + ' dari 5 bintang">' + stars(item.rating) + '</span>' +
      '<blockquote><p>' + escapeHTML(item.quote) + '</p></blockquote>' +
      '<figcaption>' +
      '<span class="slide-avatar" aria-hidden="true">' + escapeHTML(initials(item.name)) + '</span>' +
      '<div><strong>' + escapeHTML(item.name) + '</strong>' +
      '<span>' + escapeHTML(item.role) + '</span></div>' +
      '</figcaption>' +
      '</figure>';
  }

  function testimonialSlides(items) {
    return items.map(function (item, index) {
      return testimonialSlide(item, index, items.length);
    }).join('');
  }

  /* ---------------------------------------------------------
     Markup: FAQ
     --------------------------------------------------------- */
  function faqItems(items) {
    return items.map(function (item, index) {
      var number = index + 1;
      return '<div class="acc-item reveal">' +
        '<button class="acc-trigger" type="button" aria-expanded="false" aria-controls="acc-panel-' + number + '" id="acc-trigger-' + number + '">' +
        escapeHTML(item.question) +
        '<span class="acc-icon" aria-hidden="true"></span>' +
        '</button>' +
        '<div class="acc-panel" id="acc-panel-' + number + '" role="region" aria-labelledby="acc-trigger-' + number + '">' +
        '<p>' + escapeHTML(item.answer) + '</p>' +
        '</div>' +
        '</div>';
    }).join('');
  }

  /* ---------------------------------------------------------
     Markup: Tentang
     --------------------------------------------------------- */
  function aboutParagraphs(about) {
    return about.paragraphs.map(function (paragraph) {
      return '<p>' + escapeHTML(paragraph) + '</p>';
    }).join('');
  }

  function aboutPoints(about) {
    return about.points.map(function (point) {
      return '<li>' + escapeHTML(point) + '</li>';
    }).join('');
  }

  function aboutStats(about) {
    return about.stats.map(function (stat) {
      var decimals = Number(stat.decimals) || 0;
      return '<div class="stat">' +
        '<dt>' + escapeHTML(stat.label) + '</dt>' +
        '<dd><strong class="stat-num" data-count="' + escapeHTML(stat.value) + '"' +
        (stat.suffix ? ' data-suffix="' + escapeHTML(stat.suffix) + '"' : '') +
        (decimals ? ' data-decimals="' + decimals + '"' : '') +
        '>0</strong></dd>' +
        '</div>';
    }).join('');
  }

  /* ---------------------------------------------------------
     Markup: kontak + pilihan form
     --------------------------------------------------------- */
  function contactIcon(name) {
    return '<span class="contact-icon"><svg aria-hidden="true"><use href="#icon-' + name + '"></use></svg></span>';
  }

  function contactList(site) {
    var wa = waHref(site);
    var contact = site.contact;
    var items = [];

    if (wa) {
      items.push('<li>' + contactIcon('whatsapp') +
        '<div><span>WhatsApp</span>' +
        '<a href="' + escapeHTML(wa) + '" target="_blank" rel="noopener">' + escapeHTML(contact.phoneDisplay) + '</a>' +
        '</div></li>');
    }

    if (contact.email) {
      items.push('<li>' + contactIcon('mail') +
        '<div><span>Email</span>' +
        '<a href="mailto:' + escapeHTML(contact.email) + '">' + escapeHTML(contact.email) + '</a>' +
        '</div></li>');
    }

    if (contact.address.length) {
      items.push('<li>' + contactIcon('pin') +
        '<div><span>Studio</span><p>' + contact.address.map(escapeHTML).join('<br>') + '</p></div></li>');
    }

    if (contact.hours.length) {
      items.push('<li>' + contactIcon('clock') +
        '<div><span>Jam Operasional</span><p>' + contact.hours.map(escapeHTML).join('<br>') + '</p></div></li>');
    }

    return items.join('');
  }

  function serviceOptions(items) {
    return '<option value="" selected disabled>Pilih layanan</option>' +
      items.map(function (item) {
        return '<option value="' + escapeHTML(item.name) + '">' + escapeHTML(item.name) + '</option>';
      }).join('');
  }

  function packageOptions(items) {
    return '<option value="" selected>Belum tahu / konsultasi dulu</option>' +
      items.map(function (item) {
        var price = priceCompact(item.price);
        var label = price ? item.name + ' — ' + price : item.name;
        return '<option value="' + escapeHTML(item.name) + '">' + escapeHTML(label) + '</option>';
      }).join('');
  }

  function socialLinks(site) {
    var links = [];
    var socials = site.socials || {};

    [
      { icon: 'instagram', label: 'Instagram', url: socials.instagram },
      { icon: 'facebook', label: 'Facebook', url: socials.facebook },
      { icon: 'youtube', label: 'YouTube', url: socials.youtube },
      { icon: 'whatsapp', label: 'WhatsApp', url: waHref(site) }
    ].forEach(function (entry) {
      if (!entry.url) return;
      links.push('<a href="' + escapeHTML(entry.url) + '" target="_blank" rel="noopener" aria-label="' +
        escapeHTML(entry.label) + ' INS FRAME Photography">' +
        '<svg aria-hidden="true"><use href="#icon-' + entry.icon + '"></use></svg></a>');
    });

    return links.join('');
  }

  /* ---------------------------------------------------------
     Preview
     --------------------------------------------------------- */
  function isPreview() {
    try {
      return new URLSearchParams((window.location && window.location.search) || '').get('preview') === '1';
    } catch (error) {
      return false;
    }
  }

  function readAdminSite() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch (error) {
      return null;
    }
  }

  function previewHref() {
    try {
      var url = new URL(window.location.href);
      return url.pathname.split('/').pop() || 'index.html';
    } catch (error) {
      return 'index.html';
    }
  }

  function addPreviewNoindex() {
    var existing = document.querySelector('meta[name="robots"]');
    if (existing) {
      existing.setAttribute('content', 'noindex, nofollow');
      return;
    }
    var meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
  }

  function addPreviewFlag(hasLocalData) {
    if (document.querySelector('.gallery-preview-flag')) return;
    var flag = document.createElement('div');
    flag.className = 'gallery-preview-flag';
    flag.innerHTML =
      '<span class="gallery-preview-dot" aria-hidden="true"></span>' +
      '<span class="gallery-preview-text">Pratinjau konten · ' +
      (hasLocalData ? 'data lokal' : 'data publik') + '</span>' +
      '<a class="gallery-preview-close" href="' + escapeHTML(previewHref()) + '">Tutup</a>';
    document.body.appendChild(flag);
  }

  /* ---------------------------------------------------------
     Render + sinkronisasi tautan global
     --------------------------------------------------------- */
  function emptyNote(message) {
    return '<p class="gallery-empty-note"><strong>Belum ada konten yang tayang.</strong>' +
      '<span>' + escapeHTML(message) + '</span></p>';
  }

  function applySite(site) {
    if (!document.querySelectorAll) return;

    var services = visibleItems(site.services);
    var packages = visibleItems(site.packages);
    var testimonials = visibleItems(site.testimonials);
    var faq = visibleItems(site.faq);

    Array.prototype.forEach.call(document.querySelectorAll('[data-site]'), function (root) {
      switch (root.getAttribute('data-site')) {
        case 'services':
          root.innerHTML = services.length
            ? services.map(serviceCard).join('')
            : emptyNote('Tambahkan layanan lewat panel admin, lalu publikasikan konten.');
          break;
        case 'packages':
          root.innerHTML = packages.length
            ? packages.map(packageCard).join('')
            : emptyNote('Tambahkan paket harga lewat panel admin, lalu publikasikan konten.');
          break;
        case 'testimonials':
          root.innerHTML = testimonials.length
            ? testimonialSlides(testimonials)
            : emptyNote('Tambahkan testimoni lewat panel admin, lalu publikasikan konten.');
          break;
        case 'faq':
          root.innerHTML = faq.length
            ? faqItems(faq)
            : emptyNote('Tambahkan pertanyaan lewat panel admin, lalu publikasikan konten.');
          break;
        case 'about-paragraphs':
          root.innerHTML = aboutParagraphs(site.about);
          break;
        case 'about-points':
          root.innerHTML = aboutPoints(site.about);
          break;
        case 'about-stats':
          root.innerHTML = aboutStats(site.about);
          break;
        case 'contact-list':
          root.innerHTML = contactList(site);
          break;
        case 'service-options':
          root.innerHTML = serviceOptions(services);
          break;
        case 'package-options':
          root.innerHTML = packageOptions(packages);
          break;
        case 'socials':
          root.innerHTML = socialLinks(site);
          break;
        default:
          break;
      }
    });
  }

  function syncLinks(site) {
    if (!document.querySelectorAll) return;
    var wa = waHref(site);
    var instagram = site.socials.instagram;
    var email = site.contact.email;

    Array.prototype.forEach.call(document.querySelectorAll('a[href^="https://wa.me/"]'), function (link) {
      if (wa) link.setAttribute('href', wa);
    });

    if (instagram) {
      Array.prototype.forEach.call(document.querySelectorAll('a[href^="https://instagram.com/"]'), function (link) {
        link.setAttribute('href', instagram);
      });
    }

    if (email) {
      Array.prototype.forEach.call(document.querySelectorAll('a[href^="mailto:"]'), function (link) {
        link.setAttribute('href', 'mailto:' + email);
      });
    }
  }

  function init() {
    var preview = isPreview();
    var localSite = preview ? readAdminSite() : null;
    var site = prepareSite(localSite || window.INSFRAME_SITE);

    applySite(site);
    syncLinks(site);

    if (preview) {
      addPreviewNoindex();
      if (document.body) addPreviewFlag(Boolean(localSite));
    }
  }

  /* ---------------------------------------------------------
     API build
     --------------------------------------------------------- */
  window.INSFRAME_SITE_RENDER = {
    prepareSite: prepareSite,
    visibleItems: visibleItems,
    serviceCard: serviceCard,
    packageCard: packageCard,
    testimonialSlides: testimonialSlides,
    faqItems: faqItems,
    aboutParagraphs: aboutParagraphs,
    aboutPoints: aboutPoints,
    aboutStats: aboutStats,
    contactList: contactList,
    serviceOptions: serviceOptions,
    packageOptions: packageOptions,
    socialLinks: socialLinks,
    waHref: waHref,
    formatPriceParts: formatPriceParts,
    stars: stars,
    initials: initials,
    phoneDigits: phoneDigits
  };

  /* ---------------------------------------------------------
     Init
     --------------------------------------------------------- */
  if (document.body && document.body.getAttribute('data-page') !== 'admin') {
    init();
  } else if (!document.body) {
    document.addEventListener('DOMContentLoaded', init);
  }
})();
