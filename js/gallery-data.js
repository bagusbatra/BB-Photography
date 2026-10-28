/* =========================================================
   INS FRAME Photography — gallery-data.js
   Sumber data galeri untuk halaman publik.

   File ini dihasilkan oleh panel admin (Galeri → Publikasikan).
   Jangan mengedit daftar karya secara manual: ubah lewat admin,
   lalu ganti file ini dengan hasil unduhan "gallery-data.js".

   Kategori dipakai bersama oleh admin dan halaman publik:
   - label   : nilai yang disimpan di data admin
   - display : teks yang tampil di halaman publik
   - slug    : nilai filter di portofolio

   Setelah file ini diganti, jalankan `npm run build` agar kartu
   statis dan JSON-LD portofolio.html ikut diperbarui.
   ========================================================= */
window.INSFRAME_CATEGORIES = [
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

window.INSFRAME_GALLERY = {
  "version": 1,
  "updatedAt": "2026-10-27T02:00:00.000Z",
  "works": [
    {
      "id": "work-golden-vows",
      "title": "Golden Vows",
      "category": "Wedding",
      "location": "Bali",
      "date": "2026-10-23",
      "image": "https://images.unsplash.com/photo-1529636798458-92182e662485?auto=format&fit=crop&w=1400&q=85",
      "thumb": "https://images.unsplash.com/photo-1529636798458-92182e662485?auto=format&fit=crop&w=700&q=80",
      "alt": "Pasangan pengantin di tepi pantai saat golden hour"
    },
    {
      "id": "work-soft-light",
      "title": "Soft Light",
      "category": "Portrait",
      "location": "Studio",
      "date": "2026-10-15",
      "image": "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1400&q=85",
      "thumb": "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=700&q=80",
      "alt": "Potret perempuan dengan cahaya jendela yang lembut"
    },
    {
      "id": "work-afterglow",
      "title": "Afterglow",
      "category": "Event",
      "location": "Jakarta",
      "date": "2026-10-07",
      "image": "https://images.unsplash.com/photo-1505236858219-8359eb29e329?auto=format&fit=crop&w=1400&q=85",
      "thumb": "https://images.unsplash.com/photo-1505236858219-8359eb29e329?auto=format&fit=crop&w=700&q=80",
      "alt": "Suasana pesta dengan pencahayaan hangat"
    },
    {
      "id": "work-sunset-embrace",
      "title": "Sunset Embrace",
      "category": "Prewedding",
      "location": "Uluwatu",
      "date": "2026-09-29",
      "image": "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1400&q=85",
      "thumb": "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=700&q=80",
      "alt": "Pasangan pengantin berpelukan saat matahari terbenam"
    },
    {
      "id": "work-the-details",
      "title": "The Details",
      "category": "Wedding",
      "location": "Bali",
      "date": "2026-09-19",
      "image": "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1400&q=85",
      "thumb": "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=700&q=80",
      "alt": "Detail cincin pernikahan di atas kain"
    },
    {
      "id": "work-garden-walk",
      "title": "Garden Walk",
      "category": "Prewedding",
      "location": "Ubud",
      "date": "2026-09-07",
      "image": "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1400&q=85",
      "thumb": "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=700&q=80",
      "alt": "Pengantin berjalan bergandengan di taman"
    },
    {
      "id": "work-unfiltered",
      "title": "Unfiltered",
      "category": "Portrait",
      "location": "Outdoor",
      "date": "2026-08-26",
      "image": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1400&q=85",
      "thumb": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=700&q=80",
      "alt": "Potret close up dengan ekspresi natural"
    },
    {
      "id": "work-langkah-awal",
      "title": "Langkah Awal",
      "category": "Engagement",
      "location": "Sanur",
      "date": "2026-08-12",
      "image": "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1400&q=85",
      "thumb": "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=700&q=80",
      "alt": "Pasangan berjalan bersama di tepi pantai"
    },
    {
      "id": "work-sumpah-senja",
      "title": "Sumpah di Bawah Senja",
      "category": "Wedding",
      "location": "Uluwatu",
      "date": "2026-08-02",
      "image": "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1400&q=85",
      "thumb": "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=700&q=80",
      "alt": "Pengantin baru berfoto di bawah cahaya senja"
    },
    {
      "id": "work-tenang-cahaya",
      "title": "Tenang dalam Cahaya",
      "category": "Portrait",
      "location": "Studio",
      "date": "2026-07-21",
      "image": "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=1400&q=85",
      "thumb": "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=700&q=80",
      "alt": "Portrait perempuan dengan cahaya lembut"
    },
    {
      "id": "work-botani-series",
      "title": "Botani Series",
      "category": "Produk",
      "location": "Beauty",
      "date": "2026-07-09",
      "image": "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=1400&q=85",
      "thumb": "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=700&q=80",
      "alt": "Foto produk parfum dengan latar minimalis"
    },
    {
      "id": "work-first-dance",
      "title": "The First Dance",
      "category": "Wedding",
      "location": "Ubud",
      "date": "2026-06-27",
      "image": "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1400&q=85",
      "thumb": "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=700&q=80",
      "alt": "Pasangan menari di pesta pernikahan"
    },
    {
      "id": "work-gather-grow",
      "title": "Gather & Grow",
      "category": "Event",
      "location": "Jakarta",
      "date": "2026-06-14",
      "image": "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1400&q=85",
      "thumb": "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=700&q=80",
      "alt": "Suasana acara komunitas dengan lampu hangat"
    },
    {
      "id": "work-monochrome-mood",
      "title": "Monochrome Mood",
      "category": "Portrait",
      "location": "Outdoor",
      "date": "2026-06-02",
      "image": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1400&q=85",
      "thumb": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=700&q=80",
      "alt": "Portrait pria dengan ekspresi tenang"
    },
    {
      "id": "work-time-reframed",
      "title": "Time, Reframed",
      "category": "Produk",
      "location": "Lifestyle",
      "date": "2026-05-20",
      "image": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1400&q=85",
      "thumb": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=700&q=80",
      "alt": "Foto produk jam tangan di atas permukaan kayu"
    },
    {
      "id": "work-neon-nights",
      "title": "Neon Nights",
      "category": "Event",
      "location": "Concert",
      "date": "2026-05-08",
      "image": "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1400&q=85",
      "thumb": "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=700&q=80",
      "alt": "Konser dengan cahaya panggung berwarna"
    },
    {
      "id": "work-quiet-vows",
      "title": "Quiet Vows",
      "category": "Wedding",
      "location": "Nusa Dua",
      "date": "2026-04-26",
      "image": "https://images.unsplash.com/photo-1591604466107-ec97de577aff?auto=format&fit=crop&w=1400&q=85",
      "thumb": "https://images.unsplash.com/photo-1591604466107-ec97de577aff?auto=format&fit=crop&w=700&q=80",
      "alt": "Pasangan pengantin berpegangan tangan"
    },
    {
      "id": "work-neon-muse",
      "title": "Neon Muse",
      "category": "Portrait",
      "location": "Kuta",
      "date": "2026-04-12",
      "image": "https://images.unsplash.com/photo-1500917293891-ef795e70e1f6?auto=format&fit=crop&w=1400&q=85",
      "thumb": "https://images.unsplash.com/photo-1500917293891-ef795e70e1f6?auto=format&fit=crop&w=700&q=80",
      "alt": "Potret wanita dengan jaket di jalanan malam"
    }
  ]
};
