#!/usr/bin/env node
/* =========================================================
   INS FRAME Photography — scripts/prerender-gallery.js

   Menulis ulang grid portofolio dan JSON-LD galeri di
   portofolio.html dari js/gallery-data.js, tanpa browser dan
   tanpa dependency.

   Markup kartu dibuat oleh fungsi yang sama dengan
   js/gallery-render.js (window.INSFRAME_GALLERY_RENDER), jadi
   hasil statis dan hasil JavaScript selalu identik.

   Pemakaian:
     node scripts/prerender-gallery.js           # tulis file
     node scripts/prerender-gallery.js --check   # gagal bila basi
   ========================================================= */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const PAGE_FILE = 'portofolio.html';
const SITE_URL = 'https://bagusbatra.github.io/BB-Photography/';
const PAGE_URL = SITE_URL + PAGE_FILE;
const BUSINESS_ID = SITE_URL + '#business';
const WEBSITE_ID = SITE_URL + '#website';
const GALLERY_ID = PAGE_URL + '#galeri';
const WEBPAGE_ID = PAGE_URL + '#webpage';
const CHECK_ONLY = process.argv.includes('--check');

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function formatLongDate(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso || '')) return '';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date(iso + 'T12:00:00'));
}

/* Renderer publik memakai window/document; di Node keduanya cukup
   distub agar init() tidak berjalan dan hanya API build yang aktif. */
function loadRenderer() {
  const sandbox = {
    window: {},
    document: {
      readyState: 'loading',
      addEventListener: function () {},
      querySelector: function () { return null; }
    },
    console: console
  };

  vm.createContext(sandbox);
  vm.runInContext(read('js/gallery-data.js'), sandbox, { filename: 'js/gallery-data.js' });
  vm.runInContext(read('js/gallery-render.js'), sandbox, { filename: 'js/gallery-render.js' });

  const api = sandbox.window.INSFRAME_GALLERY_RENDER;
  const data = sandbox.window.INSFRAME_GALLERY;

  if (!api || !data || !Array.isArray(data.works)) {
    throw new Error('js/gallery-render.js tidak mengekspos INSFRAME_GALLERY_RENDER.');
  }

  return { api: api, works: api.prepareWorks(data.works) };
}

function buildSchema(works) {
  const images = works.map(function (work) {
    const id = PAGE_URL + '#' + work.anchor;
    const caption = [work.category, work.location, formatLongDate(work.date)]
      .filter(Boolean)
      .join(' · ');

    const image = {
      '@type': 'ImageObject',
      '@id': id,
      url: id,
      name: work.title,
      description: work.alt,
      contentUrl: work.image,
      thumbnailUrl: work.thumb,
      caption: caption,
      creator: { '@id': BUSINESS_ID },
      copyrightHolder: { '@id': BUSINESS_ID },
      creditText: 'INS FRAME Photography',
      isPartOf: { '@id': GALLERY_ID }
    };

    if (work.date) image.datePublished = work.date;
    if (work.location) {
      image.contentLocation = { '@type': 'Place', name: work.location };
    }

    return image;
  });

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': WEBPAGE_ID,
        url: PAGE_URL,
        name: 'Portofolio Fotografi | INS FRAME Photography',
        description: 'Karya wedding, portrait, produk, dan acara dari INS FRAME Photography.',
        isPartOf: { '@id': WEBSITE_ID },
        about: { '@id': BUSINESS_ID },
        inLanguage: 'id-ID',
        mainEntity: { '@id': GALLERY_ID }
      },
      {
        '@type': 'ImageGallery',
        '@id': GALLERY_ID,
        url: PAGE_URL,
        name: 'Galeri karya INS FRAME Photography',
        description: works.length + ' karya pilihan wedding, prewedding, engagement, portrait, ' +
          'acara, graduation, dan personal branding dari INS FRAME Photography di Sidoarjo dan sekitarnya.',
        isPartOf: { '@id': WEBPAGE_ID },
        about: { '@id': BUSINESS_ID },
        inLanguage: 'id-ID',
        numberOfItems: works.length,
        image: images.map(function (image) {
          return { '@id': image['@id'] };
        })
      }
    ].concat(images, [
      {
        '@type': 'BreadcrumbList',
        'itemListElement': [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Beranda',
            item: SITE_URL
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Portofolio',
            item: PAGE_URL
          }
        ]
      }
    ])
  };
}

function indentAt(html, offset) {
  const lineStart = html.lastIndexOf('\n', offset) + 1;
  const prefix = html.slice(lineStart, offset);
  const match = prefix.match(/^[ \t]*/);
  return match ? match[0] : '';
}

function replaceMarked(html, name, content) {
  const pattern = new RegExp(
    '<!-- gallery:' + name + ':start -->[\\s\\S]*?<!-- gallery:' + name + ':end -->'
  );

  if (!pattern.test(html)) {
    throw new Error('Marker <!-- gallery:' + name + ':start --> tidak ditemukan di ' + PAGE_FILE + '.');
  }

  return html.replace(pattern, function (match, offset) {
    const indent = indentAt(html, offset);
    const body = content.split('\n').map(function (line) {
      return line ? indent + line : line;
    }).join('\n');

    return '<!-- gallery:' + name + ':start -->\n' + body + '\n' +
      indent + '<!-- gallery:' + name + ':end -->';
  });
}

function replaceSchema(html, schema) {
  const pattern = /<script type="application\/ld\+json" data-gallery-schema>[\s\S]*?<\/script>/;

  if (!pattern.test(html)) {
    throw new Error('Script JSON-LD data-gallery-schema tidak ditemukan di ' + PAGE_FILE + '.');
  }

  const json = JSON.stringify(schema, null, 2).split('\n').map(function (line) {
    return '  ' + line;
  }).join('\n');

  return html.replace(pattern, function (match, offset) {
    const indent = indentAt(html, offset);
    return '<script type="application/ld+json" data-gallery-schema>\n' + json + '\n' +
      indent + '</script>';
  });
}

function main() {
  const renderer = loadRenderer();
  const api = renderer.api;
  const works = renderer.works;

  if (!works.length) {
    throw new Error('Tidak ada karya tayang di js/gallery-data.js — pre-render dibatalkan.');
  }

  const anchors = new Set();
  works.forEach(function (work) {
    if (anchors.has(work.anchor)) {
      throw new Error('Anchor ganda: ' + work.anchor);
    }
    anchors.add(work.anchor);
  });

  const original = read(PAGE_FILE);
  let updated = replaceMarked(original, 'filters', api.filterChips(works));
  updated = replaceMarked(updated, 'prerender', works.map(api.portfolioCard).join('\n'));
  updated = replaceSchema(updated, buildSchema(works));

  if (original === updated) {
    console.log('Galeri sudah sinkron: ' + works.length + ' karya, ' +
      anchors.size + ' anchor, ' + PAGE_FILE + '.');
    return;
  }

  if (CHECK_ONLY) {
    console.error('Galeri basi: jalankan `npm run build` untuk memperbarui ' + PAGE_FILE + '.');
    process.exitCode = 1;
    return;
  }

  fs.writeFileSync(path.join(ROOT, PAGE_FILE), updated, 'utf8');
  console.log('Galeri diperbarui: ' + works.length + ' karya, ' +
    anchors.size + ' anchor, JSON-LD ImageGallery + ImageObject, ' + PAGE_FILE + '.');
}

try {
  main();
} catch (error) {
  console.error('Pre-render galeri gagal: ' + error.message);
  process.exitCode = 1;
}
