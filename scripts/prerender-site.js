#!/usr/bin/env node
/* =========================================================
   INS FRAME Photography — scripts/prerender-site.js

   Menulis ulang konten statis (layanan, paket, testimoni, FAQ,
   teks Tentang, kontak, pilihan form) serta JSON-LD terkait dari
   js/site-data.js. Tujuannya agar crawler tetap melihat konten
   lengkap tanpa harus menjalankan JavaScript.

   Markup dibuat oleh fungsi yang sama dengan js/site-render.js
   (window.INSFRAME_SITE_RENDER), jadi hasil statis dan hasil
   JavaScript selalu identik.

   Pemakaian:
     node scripts/prerender-site.js           # tulis file
     node scripts/prerender-site.js --check   # gagal bila basi
   ========================================================= */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const SITE_URL = 'https://bagusbatra.github.io/BB-Photography/';
const PAGE_URL = SITE_URL + 'layanan.html';
const BUSINESS_ID = SITE_URL + '#business';
const CHECK_ONLY = process.argv.includes('--check');

const PAGE_FILES = [
  'index.html',
  'tentang.html',
  'layanan.html',
  'proses.html',
  'portofolio.html',
  'faq.html',
  'kontak.html',
  'galeri-custom.html'
];

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

/* Renderer publik memakai window/document; di Node keduanya cukup
   distub agar init() tidak berjalan dan hanya API build yang aktif. */
function loadRenderer() {
  const sandbox = {
    window: {},
    document: {
      readyState: 'loading',
      addEventListener: function () {},
      querySelector: function () { return null; },
      querySelectorAll: function () { return []; }
    },
    console: console
  };

  vm.createContext(sandbox);
  vm.runInContext(read('js/site-data.js'), sandbox, { filename: 'js/site-data.js' });
  vm.runInContext(read('js/site-render.js'), sandbox, { filename: 'js/site-render.js' });

  const api = sandbox.window.INSFRAME_SITE_RENDER;
  const data = sandbox.window.INSFRAME_SITE;

  if (!api || !data) {
    throw new Error('js/site-render.js tidak mengekspos INSFRAME_SITE_RENDER.');
  }

  return { api: api, site: api.prepareSite(data) };
}

function indentAt(html, offset) {
  const lineStart = html.lastIndexOf('\n', offset) + 1;
  const prefix = html.slice(lineStart, offset);
  const match = prefix.match(/^[ \t]*/);
  return match ? match[0] : '';
}

function replaceMarked(html, file, name, content) {
  const pattern = new RegExp(
    '<!-- site:' + name + ':start -->[\\s\\S]*?<!-- site:' + name + ':end -->'
  );

  if (!pattern.test(html)) {
    throw new Error('Marker <!-- site:' + name + ':start --> tidak ditemukan di ' + file + '.');
  }

  return html.replace(pattern, function (match, offset) {
    const indent = indentAt(html, offset);
    const body = content.split('\n').map(function (line) {
      return line ? indent + line : line;
    }).join('\n');

    return '<!-- site:' + name + ':start -->\n' + body + '\n' +
      indent + '<!-- site:' + name + ':end -->';
  });
}

function replaceSocials(html) {
  const pattern = /<div class="socials" data-site="socials">[\s\S]*?<\/div>/;
  if (!pattern.test(html)) {
    throw new Error('Kontainer .socials[data-site="socials"] tidak ditemukan.');
  }
  return html.replace(pattern, function (match) {
    return '<div class="socials" data-site="socials">' + CONTENT.socials + '</div>';
  });
}

function replaceLinks(html, site) {
  const wa = CONTENT.api.waHref(site);
  const instagram = site.socials.instagram;
  const email = site.contact.email;

  if (wa) html = html.replace(/https:\/\/wa\.me\/\d+/g, wa);
  if (instagram) html = html.replace(/https:\/\/instagram\.com\/[A-Za-z0-9_.]+/g, instagram);
  if (email) html = html.replace(/mailto:[^"'\s>]+/g, 'mailto:' + email);

  return html;
}

function replaceJSONScript(html, selector, schema) {
  const pattern = new RegExp(
    '<script type="application\\/ld\\+json" ' + selector + '>[\\s\\S]*?<\\/script>'
  );

  if (!pattern.test(html)) {
    throw new Error('Script JSON-LD ' + selector + ' tidak ditemukan.');
  }

  const json = JSON.stringify(schema, null, 2).split('\n').map(function (line) {
    return '  ' + line;
  }).join('\n');

  return html.replace(pattern, function (match, offset) {
    const indent = indentAt(html, offset);
    return '<script type="application/ld+json" ' + selector + '>\n' + json + '\n' +
      indent + '</script>';
  });
}

function updateBusinessSchema(html, site) {
  const pattern = /<script type="application\/ld\+json" data-business-schema>([\s\S]*?)<\/script>/;
  const match = html.match(pattern);
  if (!match) {
    throw new Error('Script JSON-LD data-business-schema tidak ditemukan di index.html.');
  }

  const schema = JSON.parse(match[1]);
  const graph = Array.isArray(schema['@graph']) ? schema['@graph'] : [];
  const business = graph.find(function (node) {
    const type = node && node['@type'];
    return type === 'PhotographyBusiness' ||
      (Array.isArray(type) && type.indexOf('PhotographyBusiness') !== -1);
  });

  if (!business) {
    throw new Error('Node PhotographyBusiness tidak ditemukan di schema index.html.');
  }

  const digits = CONTENT.api.phoneDigits(site.contact.phone);
  if (site.contact.email) business.email = site.contact.email;
  if (digits) business.telephone = '+' + digits;
  business.sameAs = [
    site.socials.instagram,
    site.socials.facebook,
    site.socials.youtube
  ].filter(Boolean);

  return replaceJSONScript(html, 'data-business-schema', schema);
}

function updateFaqSchema(html, site) {
  const api = CONTENT.api;
  const pattern = /<script type="application\/ld\+json" data-faq-schema>([\s\S]*?)<\/script>/;
  const match = html.match(pattern);
  if (!match) {
    throw new Error('Script JSON-LD data-faq-schema tidak ditemukan di faq.html.');
  }

  const schema = JSON.parse(match[1]);
  const graph = Array.isArray(schema['@graph']) ? schema['@graph'] : [];
  const faqPage = graph.find(function (node) { return node && node['@type'] === 'FAQPage'; });

  if (!faqPage) {
    throw new Error('Node FAQPage tidak ditemukan di schema faq.html.');
  }

  faqPage.mainEntity = api.visibleItems(site.faq).map(function (item) {
    return {
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer }
    };
  });

  return replaceJSONScript(html, 'data-faq-schema', schema);
}

function buildPackageSchema(site) {
  const api = CONTENT.api;
  const packages = api.visibleItems(site.packages);

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'OfferCatalog',
        '@id': PAGE_URL + '#paket',
        name: 'Paket fotografi INS FRAME Photography',
        description: 'Paket sesi fotografi wedding, prewedding, portrait, produk, dan acara di Sidoarjo dan sekitarnya.',
        url: PAGE_URL + '#paket',
        numberOfItems: packages.length,
        itemListElement: packages.map(function (pkg) {
          return {
            '@type': 'Offer',
            name: 'Paket ' + pkg.name,
            description: pkg.tagline,
            price: String(pkg.price),
            priceCurrency: 'IDR',
            availability: 'https://schema.org/InStock',
            url: PAGE_URL + '#paket',
            itemOffered: {
              '@type': 'Service',
              name: 'Sesi fotografi ' + pkg.name,
              provider: { '@id': BUSINESS_ID }
            }
          };
        })
      }
    ]
  };
}

const CONTENT = {
  api: null,
  socials: ''
};

function buildPages(site) {
  const api = CONTENT.api;
  const services = api.visibleItems(site.services);
  const packages = api.visibleItems(site.packages);
  const testimonials = api.visibleItems(site.testimonials);
  const faq = api.visibleItems(site.faq);
  const updates = Object.create(null);

  /* index.html — testimoni + schema bisnis */
  let index = read('index.html');
  index = replaceMarked(index, 'index.html', 'testimonials', api.testimonialSlides(testimonials));
  index = updateBusinessSchema(index, site);
  updates['index.html'] = index;

  /* tentang.html — teks, poin, statistik */
  let about = read('tentang.html');
  about = replaceMarked(about, 'tentang.html', 'about-paragraphs', api.aboutParagraphs(site.about));
  about = replaceMarked(about, 'tentang.html', 'about-points', api.aboutPoints(site.about));
  about = replaceMarked(about, 'tentang.html', 'about-stats', api.aboutStats(site.about));
  updates['tentang.html'] = about;

  /* layanan.html — layanan, paket, schema OfferCatalog */
  let servicesPage = read('layanan.html');
  servicesPage = replaceMarked(servicesPage, 'layanan.html', 'services',
    services.map(api.serviceCard).join('\n'));
  servicesPage = replaceMarked(servicesPage, 'layanan.html', 'packages',
    packages.map(api.packageCard).join('\n'));
  servicesPage = replaceJSONScript(servicesPage, 'data-package-schema', buildPackageSchema(site));
  updates['layanan.html'] = servicesPage;

  /* faq.html — accordion + FAQPage */
  let faqPage = read('faq.html');
  faqPage = replaceMarked(faqPage, 'faq.html', 'faq', api.faqItems(faq));
  faqPage = updateFaqSchema(faqPage, site);
  updates['faq.html'] = faqPage;

  /* kontak.html — kontak + pilihan form */
  let contact = read('kontak.html');
  contact = replaceMarked(contact, 'kontak.html', 'contact-list', api.contactList(site));
  contact = replaceMarked(contact, 'kontak.html', 'service-options', api.serviceOptions(services));
  contact = replaceMarked(contact, 'kontak.html', 'package-options', api.packageOptions(packages));
  updates['kontak.html'] = contact;

  /* Halaman lain hanya perlu tautan sosial/global yang segar. */
  PAGE_FILES.forEach(function (file) {
    if (updates[file]) return;
    updates[file] = read(file);
  });

  Object.keys(updates).forEach(function (file) {
    let html = updates[file];
    html = replaceSocials(html);
    html = replaceLinks(html, site);
    updates[file] = html;
  });

  return updates;
}

function main() {
  const renderer = loadRenderer();
  CONTENT.api = renderer.api;
  CONTENT.site = renderer.site;
  CONTENT.socials = renderer.api.socialLinks(renderer.site);

  const site = renderer.site;
  if (!renderer.api.visibleItems(site.services).length) {
    throw new Error('Tidak ada layanan tayang di js/site-data.js — pre-render dibatalkan.');
  }
  if (!site.contact.phone) {
    throw new Error('Nomor WhatsApp belum diisi di js/site-data.js — pre-render dibatalkan.');
  }

  const updates = buildPages(site);
  const changed = [];

  Object.keys(updates).forEach(function (file) {
    const original = read(file);
    if (original !== updates[file]) changed.push(file);
  });

  if (!changed.length) {
    console.log('Konten situs sudah sinkron: ' +
      renderer.api.visibleItems(site.services).length + ' layanan, ' +
      renderer.api.visibleItems(site.packages).length + ' paket, ' +
      renderer.api.visibleItems(site.testimonials).length + ' testimoni, ' +
      renderer.api.visibleItems(site.faq).length + ' FAQ.');
    return;
  }

  if (CHECK_ONLY) {
    console.error('Konten situs basi: jalankan `npm run build` untuk memperbarui ' +
      changed.join(', ') + '.');
    process.exitCode = 1;
    return;
  }

  changed.forEach(function (file) {
    fs.writeFileSync(path.join(ROOT, file), updates[file], 'utf8');
  });

  console.log('Konten situs diperbarui: ' + changed.join(', ') + '.');
}

try {
  main();
} catch (error) {
  console.error('Pre-render konten gagal: ' + error.message);
  process.exitCode = 1;
}
