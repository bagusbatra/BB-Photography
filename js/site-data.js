/* =========================================================
   INS FRAME Photography — site-data.js
   Sumber data konten situs: kontak, sosial, layanan, paket,
   testimoni, FAQ, dan teks Tentang.

   File ini dipakai oleh:
   - js/site-render.js untuk halaman publik (?preview=1 membaca
     data lokal panel admin di browser yang sama)
   - scripts/prerender-site.js untuk menulis HTML statis + JSON-LD
   - panel admin sebagai data awal saat belum ada perubahan lokal

   Setelah file ini diubah, jalankan `npm run build` agar konten
   statis di halaman publik dan schema mesin pencari ikut segar.
   ========================================================= */
window.INSFRAME_SITE = {
  version: 1,
  updatedAt: '2026-10-28T00:00:00.000Z',

  contact: {
    phone: '6281234567890',
    phoneDisplay: '+62 812 3456 7890',
    email: 'hello@insframe.studio',
    address: ['Studio by appointment', 'Sidoarjo, Jawa Timur, Indonesia'],
    hours: ['Senin – Sabtu · 09.00 – 19.00 WIB', 'Minggu dengan perjanjian']
  },

  socials: {
    instagram: 'https://instagram.com/insframe',
    facebook: '',
    youtube: ''
  },

  services: [
    {
      id: 'service-graduation',
      name: 'Graduation',
      icon: 'graduation',
      description: 'Sesi wisuda untuk merayakan pencapaianmu — dari potret toga di kampus hingga momen kebersamaan dengan keluarga.',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=640&h=800&q=60',
      visible: true
    },
    {
      id: 'service-couple',
      name: 'Couple',
      icon: 'heart',
      description: 'Potret berdua yang natural dan santai, cocok untuk anniversary atau sekadar merayakan kebersamaan.',
      image: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=640&h=800&q=60',
      visible: true
    },
    {
      id: 'service-personal-branding',
      name: 'Personal Branding',
      icon: 'user',
      description: 'Foto profesional untuk profil, website, dan media sosial yang menampilkan karaktermu secara autentik.',
      image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=640&h=800&q=60',
      visible: true
    },
    {
      id: 'service-beauty',
      name: 'Beauty',
      icon: 'sparkle',
      description: 'Beauty shoot dengan pencahayaan lembut untuk menonjolkan detail makeup, kulit, dan karakter wajah.',
      image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=640&h=800&q=60',
      visible: true
    },
    {
      id: 'service-prewedding',
      name: 'Prewedding',
      icon: 'camera',
      description: 'Sesi prewedding dengan konsep yang disesuaikan — dari pantai Bali hingga studio minimalis.',
      image: 'https://images.unsplash.com/photo-1507504031003-b417219a0fde?auto=format&fit=crop&w=640&h=800&q=60',
      visible: true
    },
    {
      id: 'service-wedding',
      name: 'Wedding',
      icon: 'rings',
      description: 'Dokumentasi penuh hari bahagiamu, dari persiapan hingga pesta, dengan pendekatan yang tenang dan personal.',
      image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=640&h=800&q=60',
      visible: true
    },
    {
      id: 'service-engagement',
      name: 'Engagement',
      icon: 'diamond',
      description: 'Abadikan momen lamaran dan pertunangan dengan foto yang hangat, intim, dan penuh cerita.',
      image: 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?auto=format&fit=crop&w=640&h=800&q=60',
      visible: true
    },
    {
      id: 'service-event',
      name: 'Event',
      icon: 'calendar',
      description: 'Liputan acara perusahaan, seminar, dan perayaan komunitas dengan dokumentasi menyeluruh dan cepat.',
      image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=640&h=800&q=60',
      visible: true
    },
    {
      id: 'service-street',
      name: 'Street',
      icon: 'road',
      description: 'Fotografi jalanan yang menangkap kehidupan kota, cahaya, dan momen spontan di antara keramaian.',
      image: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=640&h=800&q=60',
      visible: true
    },
    {
      id: 'service-architecture',
      name: 'Architecture',
      icon: 'building',
      description: 'Foto arsitektur dan interior dengan komposisi rapi, garis bersih, dan pencahayaan yang menonjolkan detail ruang.',
      image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=640&h=800&q=60',
      visible: true
    },
    {
      id: 'service-travel',
      name: 'Travel',
      icon: 'mountain',
      description: 'Dokumentasi perjalanan dan destinasi dengan warna khas INS FRAME, siap untuk konten maupun kenangan pribadi.',
      image: 'https://images.unsplash.com/photo-1500048993953-d23a436266cf?auto=format&fit=crop&w=640&h=800&q=60',
      visible: true
    },
    {
      id: 'service-night',
      name: 'Night',
      icon: 'moon',
      description: 'Sesi malam dengan permainan cahaya kota, neon, dan low light yang dramatis namun tetap natural.',
      image: 'https://images.unsplash.com/photo-1500917293891-ef795e70e1f6?auto=format&fit=crop&w=640&h=800&q=60',
      visible: true
    }
  ],

  packages: [
    {
      id: 'package-silver',
      name: 'Silver',
      price: 3500000,
      tagline: 'Untuk sesi personal, couple, atau graduation yang ingin hasil rapi tanpa ribet.',
      features: [
        'Sesi 1 jam di satu lokasi',
        '1 fotografer',
        '20 foto pilihan sudah diedit',
        'Galeri online 30 hari',
        'File JPEG resolusi tinggi'
      ],
      popular: false,
      visible: true
    },
    {
      id: 'package-gold',
      name: 'Gold',
      price: 6500000,
      tagline: 'Paling sering dipilih untuk prewedding dan wedding intim dengan cerita yang lebih lengkap.',
      features: [
        'Sesi 3 jam, maksimal 2 lokasi',
        '2 fotografer',
        '60 foto pilihan sudah diedit',
        'Preview 2–3 hari kerja',
        'Galeri online 90 hari',
        'Album cetak 20 × 20 cm'
      ],
      popular: true,
      visible: true
    },
    {
      id: 'package-platinum',
      name: 'Platinum',
      price: 12000000,
      tagline: 'Dokumentasi penuh dari persiapan sampai pesta, untuk hari yang tidak ingin terlewat sedikit pun.',
      features: [
        'Sesi 8 jam, lokasi fleksibel',
        '2 fotografer + 1 asisten',
        '150 foto pilihan sudah diedit',
        'Timeline dan konsultasi konsep',
        'Album premium 30 × 30 cm',
        'Galeri online 180 hari'
      ],
      popular: false,
      visible: true
    },
    {
      id: 'package-custom',
      name: 'Custom',
      price: 8500000,
      tagline: 'Butuh kombinasi berbeda? Susun paket sesuai kebutuhan brand, acara, atau destinasi.',
      features: [
        'Konsultasi kebutuhan dan konsep',
        'Durasi dan tim menyesuaikan',
        'Jumlah foto fleksibel',
        'Opsi foto produk dan konten video',
        'Penawaran tertulis sebelum DP'
      ],
      popular: false,
      visible: true
    }
  ],

  testimonials: [
    {
      id: 'testimonial-ayu-reza',
      name: 'Ayu & Reza',
      role: 'Wedding · Sidoarjo',
      quote: 'Kami tidak pernah merasa diarahkan untuk pose yang aneh. Tim INS FRAME lebih banyak mendengar, lalu menangkap momen saat kami benar-benar lupa sedang difoto.',
      rating: 5,
      visible: true
    },
    {
      id: 'testimonial-nadia',
      name: 'Nadia Putri',
      role: 'Graduation · Surabaya',
      quote: 'Prosesnya cepat dan santai. Hasil editnya tetap terlihat seperti aku, bukan versi yang berlebihan. Keluarga juga ikut senang dengan fotonya.',
      rating: 5,
      visible: true
    },
    {
      id: 'testimonial-kevin',
      name: 'Kevin Hartono',
      role: 'Personal Branding · Jakarta',
      quote: 'Brief-nya dipahami dengan baik. Foto profil dan konten tim sekarang terasa konsisten, dan kami tidak perlu banyak revisi.',
      rating: 5,
      visible: true
    }
  ],

  faq: [
    {
      id: 'faq-booking',
      question: 'Berapa lama sebelumnya sebaiknya booking?',
      answer: 'Untuk wedding dan prewedding, idealnya 2–4 bulan sebelumnya, terutama jika tanggal jatuh di musim ramai (Mei–September). Untuk portrait dan produk, 1–2 minggu sebelumnya biasanya sudah cukup.',
      visible: true
    },
    {
      id: 'faq-lokasi',
      question: 'Apakah bisa request lokasi di luar Sidoarjo?',
      answer: 'Tentu. Kami rutin melakukan sesi di Surabaya, Mojokerto, Bali, Jakarta, dan kota lain. Biaya transportasi dan akomodasi akan diinformasikan terpisah sesuai lokasi dan jumlah tim.',
      visible: true
    },
    {
      id: 'faq-editing',
      question: 'Berapa lama proses editing dan pengiriman hasil?',
      answer: 'Estimasi 7–14 hari kerja tergantung paket. Kami mengirim preview beberapa foto dalam 2–3 hari setelah sesi agar kamu bisa melihat arah editingnya lebih awal.',
      visible: true
    },
    {
      id: 'faq-raw',
      question: 'Apakah file original (RAW) diberikan?',
      answer: 'Yang kami serahkan adalah file JPEG resolusi tinggi yang sudah melalui kurasi dan retouch. File RAW tidak termasuk karena merupakan bagian dari proses kerja kami. File mentah pilihan dapat dibeli terpisah.',
      visible: true
    },
    {
      id: 'faq-pembatalan',
      question: 'Bagaimana kebijakan pembatalan dan reschedule?',
      answer: 'DP 30% mengunci tanggal. Reschedule gratis hingga 14 hari sebelum sesi, satu kali. Pembatalan kurang dari 7 hari membuat DP tidak dapat dikembalikan, tetapi bisa dialihkan ke sesi lain dalam 3 bulan.',
      visible: true
    }
  ],

  about: {
    paragraphs: [
      'Berawal dari satu kamera pinjaman dan kecintaan pada cerita manusia, INS FRAME Photography tumbuh menjadi tim kecil yang percaya bahwa foto terbaik lahir dari koneksi, bukan pose.',
      'Kami mendengarkan ceritamu, memahami karakter, lalu membingkainya dalam cahaya yang tepat. Hasilnya bukan hanya album — tapi kenangan yang bisa kamu rasakan kembali.'
    ],
    points: [
      'Pendekatan personal & santai, tanpa pose kaku',
      'Tim fotografer & editor berpengalaman 12 tahun',
      'Editing warna khas INS FRAME, halus dan timeless',
      'File original & cetak siap pajang'
    ],
    stats: [
      { label: 'Pengalaman', value: 12, suffix: '+', decimals: 0 },
      { label: 'Proyek selesai', value: 850, suffix: '+', decimals: 0 },
      { label: 'Pasangan bahagia', value: 320, suffix: '+', decimals: 0 },
      { label: 'Rating klien', value: 4.9, suffix: '', decimals: 1 }
    ]
  }
};
