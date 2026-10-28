/* =========================================================
   INS FRAME Photography — gallery-render.js
   Menampilkan karya dari js/gallery-data.js ke halaman publik:
   - portofolio.html  → grid + filter + lightbox
   - index.html       → marquee dua baris
   - tentang.html     → papan polaroid "Karya Terbaru"

   Mode pratinjau: tambahkan ?preview=1 pada URL halaman. Renderer
   akan membaca data lokal panel admin di browser yang sama, sehingga
   perubahan bisa dicek sebelum file gallery-data.js diganti.
   ========================================================= */
(function () {
  'use strict';

  var STORAGE_KEY = 'insframe.admin.gallery.v1';
  var DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
  var POLAROID_SLOTS = [
    { x: '1%', y: '8%', rot: '-7deg' },
    { x: '25%', y: '0%', rot: '5deg' },
    { x: '49%', y: '11%', rot: '-3deg' },
    { x: '73%', y: '3%', rot: '7deg' },
    { x: '12%', y: '47%', rot: '6deg' },
    { x: '36%', y: '39%', rot: '-6deg' },
    { x: '58%', y: '49%', rot: '4deg' },
    { x: '79%', y: '41%', rot: '-8deg' }
  ];
  var NUMBER_WORDS = ['Nol', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan'];

  var FALLBACK_CATEGORIES = [
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
      .replace(/^-+|-+$/g, '') || 'other';
  }

  function thumbFrom(url) {
    var value = String(url || '');
    if (!/^https?:\/\/images\.unsplash\.com\//i.test(value)) return value;
    return value
      .replace(/([?&])w=\d+/, '$1w=700')
      .replace(/([?&])q=\d+/, '$1q=80');
  }

  function formatLongDate(iso) {
    if (!DATE_PATTERN.test(iso || '')) return '';
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date(iso + 'T12:00:00'));
  }

  function categoryDefs() {
    var source = Array.isArray(window.INSFRAME_CATEGORIES) ? window.INSFRAME_CATEGORIES : null;
    if (!source || !source.length) return FALLBACK_CATEGORIES;
    return source.map(function (entry) {
      var item = entry && typeof entry === 'object' ? entry : {};
      var label = String(item.label || item.display || 'Lainnya');
      return {
        label: label,
        slug: String(item.slug || slugify(label)),
        display: String(item.display || label)
      };
    });
  }

  function categoryMeta(label) {
    var defs = categoryDefs();
    var value = String(label || 'Lainnya');
    for (var i = 0; i < defs.length; i += 1) {
      if (defs[i].label.toLowerCase() === value.toLowerCase()) return defs[i];
    }
    return {
      label: value,
      slug: slugify(value),
      display: value === 'Event' ? 'Acara' : value
    };
  }

  function isPreview() {
    try {
      return new URLSearchParams(window.location.search).get('preview') === '1';
    } catch (error) {
      return /[?&]preview=1(?:&|$)/.test(window.location.search);
    }
  }

  function readAdminGallery() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : null;
    } catch (error) {
      return null;
    }
  }

  function publishedWorks() {
    var gallery = window.INSFRAME_GALLERY;
    return gallery && Array.isArray(gallery.works) ? gallery.works : [];
  }

  function normalizeWork(item) {
    var source = item && typeof item === 'object' ? item : {};
    var meta = categoryMeta(source.category);
    var image = String(source.image || source.thumb || '');
    var date = DATE_PATTERN.test(source.date || '') ? source.date : '';
    var title = String(source.title || 'Tanpa judul');

    return {
      id: String(source.id || title),
      title: title,
      category: meta.display,
      slug: meta.slug,
      location: String(source.location || '').trim(),
      date: date,
      image: image,
      thumb: String(source.thumb || thumbFrom(image)),
      alt: String(source.alt || title)
    };
  }

  function sortWorks(works) {
    return works.slice().sort(function (a, b) {
      if (a.date === b.date) return a.title.localeCompare(b.title);
      if (!a.date) return 1;
      if (!b.date) return -1;
      return b.date.localeCompare(a.date);
    });
  }

  /* Anchor stabil per karya. Algoritme ini juga dipakai
     scripts/prerender-gallery.js agar URL statis dan hasil JS sama. */
  function assignAnchors(works) {
    var used = Object.create(null);

    works.forEach(function (work) {
      var base = slugify(work.title);
      if (!base || base === 'other') base = 'karya';
      var anchor = 'karya-' + base;
      var index = 2;

      while (used[anchor]) {
        anchor = 'karya-' + base + '-' + index;
        index += 1;
      }

      used[anchor] = true;
      work.anchor = anchor;
    });

    return works;
  }

  /* Filter + normalisasi + urut + anchor. Dipakai renderer dan
     scripts/prerender-gallery.js supaya keduanya selalu identik. */
  function prepareWorks(source) {
    var list = Array.isArray(source) ? source : [];
    return assignAnchors(sortWorks(list.filter(function (item) {
      return item && item.visible !== false;
    }).map(normalizeWork).filter(function (work) {
      return Boolean(work.image);
    })));
  }

  function metaLine(work) {
    return work.category + (work.location ? ' · ' + work.location : '');
  }

  function emptyNote(message) {
    return '<p class="gallery-empty-note">' +
      '<strong>Belum ada karya yang tayang.</strong>' +
      '<span>' + escapeHTML(message) + '</span>' +
      '</p>';
  }

  function previewHref() {
    try {
      var url = new URL(window.location.href);
      return url.pathname.split('/').pop() || 'index.html';
    } catch (error) {
      return 'index.html';
    }
  }

  /* Halaman pratinjau (?preview=1) tidak boleh masuk indeks mesin pencari. */
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
    var flag = document.createElement('div');
    flag.className = 'gallery-preview-flag';
    flag.innerHTML =
      '<span class="gallery-preview-dot" aria-hidden="true"></span>' +
      '<span class="gallery-preview-text">Pratinjau admin · ' +
      (hasLocalData ? 'data lokal' : 'data publik') + '</span>' +
      '<a class="gallery-preview-close" href="' + escapeHTML(previewHref()) + '">Tutup</a>';
    document.body.appendChild(flag);
  }

  /* ---------------------------------------------------------
     Portofolio: filter + grid
     --------------------------------------------------------- */
  function filterChips(works) {
    var order = categoryDefs().map(function (entry) { return entry.slug; });
    var seen = {};
    var chips = [];

    works.forEach(function (work) {
      if (seen[work.slug]) return;
      seen[work.slug] = true;
      chips.push(work);
    });

    chips.sort(function (a, b) {
      var indexA = order.indexOf(a.slug);
      var indexB = order.indexOf(b.slug);
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });

    return '<button class="filter-btn is-active" type="button" data-filter="all" aria-pressed="true">Semua</button>' +
      chips.map(function (work) {
        return '<button class="filter-btn" type="button" data-filter="' + escapeHTML(work.slug) + '" aria-pressed="false">' +
          escapeHTML(work.category) + '</button>';
      }).join('');
  }

  function portfolioCard(work) {
    var title = escapeHTML(work.title);
    var anchor = escapeHTML(work.anchor || ('karya-' + slugify(work.title)));

    return '<article class="portfolio-item reveal" id="' + anchor + '"' +
      ' data-category="' + escapeHTML(work.slug) + '"' +
      ' data-img="' + escapeHTML(work.image) + '"' +
      ' data-title="' + title + '"' +
      ' data-meta="' + escapeHTML(metaLine(work)) + '">' +
      '<button class="portfolio-open" type="button" aria-label="Buka ' + title + ' di tampilan penuh">' +
      '<img src="' + escapeHTML(work.thumb) + '" alt="' + escapeHTML(work.alt) + '"' +
      ' loading="lazy" width="600" height="750" decoding="async">' +
      '<span class="portfolio-overlay">' +
      '<span class="portfolio-cat">' + escapeHTML(work.category) + '</span>' +
      '<span class="portfolio-title">' + title + '</span>' +
      '<span class="portfolio-zoom" aria-hidden="true"><svg><use href="#icon-arrow-up-right"></use></svg></span>' +
      '</span>' +
      '</button>' +
      '<a class="portfolio-anchor" href="#' + anchor + '" aria-label="Tautan permanen ke ' + title + '">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L11 5"></path>' +
      '<path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 0 0 7.07 7.07L13 19"></path>' +
      '</svg>' +
      '</a>' +
      '</article>';
  }

  function renderPortfolio(root, works, preview) {
    var filterBar = document.querySelector('[data-gallery-filters]');

    if (!works.length) {
      if (filterBar) {
        filterBar.innerHTML = '';
        filterBar.hidden = true;
      }
      root.classList.add('is-empty');
      root.innerHTML = emptyNote(preview
        ? 'Pratinjau ini kosong. Tayangkan minimal satu karya di panel admin.'
        : 'Tambahkan karya lewat panel admin, lalu publikasikan galeri.');
      return;
    }

    if (filterBar) {
      filterBar.hidden = false;
      filterBar.innerHTML = filterChips(works);
    }

    root.innerHTML = works.map(portfolioCard).join('');
  }

  /* ---------------------------------------------------------
     Marquee beranda: dua baris, masing-masing punya salinan
     --------------------------------------------------------- */
  function marqueeCard(work, preview) {
    var href = preview ? 'portofolio.html?preview=1' : 'portofolio.html';
    return '<a href="' + href + '" class="pf-card">' +
      '<img src="' + escapeHTML(work.thumb) + '" alt="' + escapeHTML(work.alt) + '"' +
      ' loading="lazy" width="600" height="800" decoding="async">' +
      '<span class="pf-caption">' +
      '<span class="pf-cat">' + escapeHTML(work.category) + '</span>' +
      '<span class="pf-title">' + escapeHTML(work.title) + '</span>' +
      '</span>' +
      '<span class="pf-zoom" aria-hidden="true"><svg><use href="#icon-arrow-up-right"></use></svg></span>' +
      '</a>';
  }

  function marqueeRow(workList, direction, preview) {
    return '<div class="pf-row" data-dir="' + direction + '">' +
      '<div class="pf-track">' +
      '<div class="pf-set">' + workList.map(function (work) {
        return marqueeCard(work, preview);
      }).join('') + '</div>' +
      '<div class="pf-set pf-set--dup" aria-hidden="true"></div>' +
      '</div>' +
      '</div>';
  }

  function renderMarquee(root, works, preview) {
    var latest = works.slice(0, 12);

    if (!latest.length) {
      root.classList.add('is-empty');
      root.innerHTML = emptyNote(preview
        ? 'Pratinjau ini kosong. Tayangkan minimal satu karya di panel admin.'
        : 'Tambahkan karya lewat panel admin, lalu publikasikan galeri.');
      return;
    }

    var half = Math.ceil(latest.length / 2);
    var left = latest.slice(0, half);
    var right = latest.slice(half);

    if (!right.length) right = left.slice();

    root.innerHTML = marqueeRow(left, 'left', preview) + marqueeRow(right, 'right', preview);
  }

  /* ---------------------------------------------------------
     Papan polaroid di halaman Tentang
     --------------------------------------------------------- */
  function polaroidCard(work, index) {
    var slot = POLAROID_SLOTS[index] || POLAROID_SLOTS[POLAROID_SLOTS.length - 1];
    return '<figure class="polaroid-card" style="--x: ' + slot.x + '; --y: ' + slot.y + '; --rot: ' + slot.rot + '">' +
      '<span class="polaroid-tape" aria-hidden="true"></span>' +
      '<div class="polaroid-photo">' +
      '<img src="' + escapeHTML(work.thumb) + '" alt="' + escapeHTML(work.alt) + '"' +
      ' width="800" height="1000" loading="lazy" decoding="async">' +
      '</div>' +
      '<figcaption class="polaroid-caption">' +
      '<span class="polaroid-cat">' + escapeHTML(work.category) + '</span>' +
      '<span class="polaroid-title">' + escapeHTML(work.title) + '</span>' +
      '<span class="polaroid-date">' + escapeHTML(formatLongDate(work.date) || 'Tanpa tanggal') + '</span>' +
      '</figcaption>' +
      '</figure>';
  }

  function renderPolaroid(root, works, preview) {
    var latest = works.slice(0, POLAROID_SLOTS.length);

    if (!latest.length) {
      root.classList.add('is-empty');
      root.innerHTML = emptyNote(preview
        ? 'Pratinjau ini kosong. Tayangkan minimal satu karya di panel admin.'
        : 'Tambahkan karya lewat panel admin, lalu publikasikan galeri.');
    } else {
      root.innerHTML = latest.map(polaroidCard).join('');
    }

    var countNode = document.querySelector('[data-gallery-count-word]');
    if (countNode) {
      countNode.textContent = latest.length
        ? (NUMBER_WORDS[latest.length] || String(latest.length))
        : 'Belum ada';
    }
  }

  /* ---------------------------------------------------------
     API build
     scripts/prerender-gallery.js memakai fungsi yang sama, jadi
     markup statis dan hasil JavaScript tidak mungkin berbeda.
     --------------------------------------------------------- */
  window.INSFRAME_GALLERY_RENDER = {
    prepareWorks: prepareWorks,
    portfolioCard: portfolioCard,
    filterChips: filterChips,
    categoryDefs: categoryDefs
  };

  /* ---------------------------------------------------------
     Init
     --------------------------------------------------------- */
  function init() {
    var preview = isPreview();
    var localWorks = preview ? readAdminGallery() : null;
    var hasLocalData = Array.isArray(localWorks);
    var source = hasLocalData ? localWorks : publishedWorks();

    var works = prepareWorks(source);

    var portfolioRoot = document.querySelector('[data-gallery="portfolio"]');
    var marqueeRoot = document.querySelector('[data-gallery="marquee"]');
    var polaroidRoot = document.querySelector('[data-gallery="polaroid"]');

    if (portfolioRoot) renderPortfolio(portfolioRoot, works, preview);
    if (marqueeRoot) renderMarquee(marqueeRoot, works, preview);
    if (polaroidRoot) renderPolaroid(polaroidRoot, works, preview);

    if (preview) {
      addPreviewNoindex();
      if (document.body) addPreviewFlag(hasLocalData);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
