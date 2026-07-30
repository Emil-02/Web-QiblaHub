/* ═══════════════════════════════════════════════════
   QiblaHub — Static / Mock Data
   Semua data aplikasi disimpan di sini (folder Aplikasi_AIK)
   ═══════════════════════════════════════════════════ */

/* ---------- Konstanta lokasi ---------- */
const KAABA = { lat: 21.422487, lon: 39.826206 };

/* ---------- Model magnet bumi (WMM2020, derajat ≤ 6) ----------
   Koefisien Gauss g/h (nT) + variasi sekuler per tahun. Dipakai untuk
   menghitung DEKLINASI MAGNETIK — selisih utara magnetik (acuan sensor
   kompas ponsel) dengan utara sebenarnya (acuan bearing kiblat). */
const WMM_COEFFS = [
  // [n, m, g, h, dg/dt, dh/dt]
  [1, 0, -29404.5, 0, 6.7, 0],
  [1, 1, -1450.7, 4652.9, 7.7, -25.1],
  [2, 0, -2500.0, 0, -11.5, 0],
  [2, 1, 2982.0, -2991.6, -7.1, -30.2],
  [2, 2, 1676.8, -734.8, -2.2, -23.9],
  [3, 0, 1363.9, 0, 2.8, 0],
  [3, 1, -2381.0, -82.2, -6.2, 5.7],
  [3, 2, 1236.2, 241.8, 3.4, -1.0],
  [3, 3, 525.7, -542.9, -12.2, 1.1],
  [4, 0, 903.1, 0, -1.1, 0],
  [4, 1, 809.4, 282.0, -1.6, 0.2],
  [4, 2, 86.2, -158.4, -6.0, 6.9],
  [4, 3, -309.4, 199.8, 5.4, 3.7],
  [4, 4, 47.9, -350.1, -5.5, -5.6],
  [5, 0, -234.4, 0, -0.3, 0],
  [5, 1, 363.1, 47.7, 0.6, 0.1],
  [5, 2, 187.8, 208.4, -0.7, 2.5],
  [5, 3, -140.7, -121.3, 0.1, -0.9],
  [5, 4, -151.2, 32.2, 1.2, 3.0],
  [5, 5, 13.7, 99.1, 1.0, 0.5],
  [6, 0, 65.9, 0, -0.6, 0],
  [6, 1, 65.6, -19.1, -0.4, 0.1],
  [6, 2, 73.0, 25.0, 0.5, -1.8],
  [6, 3, -121.5, 52.7, 1.4, -1.4],
  [6, 4, -36.2, -64.4, -1.4, 0.9],
  [6, 5, 13.5, 9.0, 0.0, 0.1],
  [6, 6, -64.7, 68.1, 0.8, 1.0],
];

const DEFAULT_LOCATION = {
  lat: -6.1751,
  lon: 106.865,
  name: "Jakarta, Indonesia",
};

/* ---------- Tim pengembang (disamakan dengan aplikasi Android) ---------- */
const TEAM_DATA = {
  lecturer: "Dr. ALAMSYAH, S.Pd. I., M.H",
  students: [
    { name: "Dwi Azzahra Sasqila Fitri", studentId: "105841118724" },
    { name: "Wuri Satya Natama", studentId: "105841118824" },
    { name: "Emil Rahmat", studentId: "105841119124" },
    { name: "Tyara Ayuliansyah", studentId: "105841119524" },
    { name: "Gefira Nur Fatima", studentId: "105841120124" },
    { name: "Muh Rafly Aprial Ridho", studentId: "105841120324" },
  ],
};

/* ---------- Data masjid (mock) ---------- */
const MOSQUES = [
  {
    id: 1,
    name: "Masjid Istiqlal",
    address: "Jl. Taman Wijaya Kusuma, Ps. Baru, Sawah Besar, Jakarta Pusat",
    lat: -6.1702,
    lon: 106.8311,
  },
  {
    id: 2,
    name: "Masjid Agung Sunda Kelapa",
    address: "Jl. Taman Sunda Kelapa No.16, Menteng, Jakarta Pusat",
    lat: -6.1994,
    lon: 106.8329,
  },
  {
    id: 3,
    name: "Masjid Cut Meutia",
    address: "Jl. Cut Mutia No.1, Menteng, Jakarta Pusat",
    lat: -6.1856,
    lon: 106.8352,
  },
  {
    id: 4,
    name: "Masjid Al-Azhar",
    address: "Jl. Sisingamangaraja, Kebayoran Baru, Jakarta Selatan",
    lat: -6.238,
    lon: 106.7995,
  },
  {
    id: 5,
    name: "Masjid Raya Jakarta Islamic Centre",
    address: "Jl. Kramat Jaya Raya, Tugu Utara, Koja, Jakarta Utara",
    lat: -6.1163,
    lon: 106.9057,
  },
  {
    id: 6,
    name: "Masjid At-Tin",
    address: "Jl. Taman Mini I, Pinang Ranti, Makasar, Jakarta Timur",
    lat: -6.2891,
    lon: 106.883,
  },
  {
    id: 7,
    name: "Masjid Raya KH Hasyim Asy'ari",
    address: "Jl. Daan Mogot KM.14,5 No.6, Semanan, Kalideres, Jakarta Barat",
    lat: -6.1583,
    lon: 106.7095,
  },
  {
    id: 8,
    name: "Masjid Babussalam",
    address: "Jl. Kebon Sirih Timur Dalam, Kb. Sirih, Menteng, Jakarta Pusat",
    lat: -6.183,
    lon: 106.829,
  },
];

/* ---------- Hari besar Islam (kalender Hijriah) ---------- */
/* month: 1 = Muharram … 12 = Dzulhijjah */
const ISLAMIC_HOLIDAYS = [
  { day: 1, month: 1, name: "Tahun Baru Hijriah", nameEn: "Islamic New Year" },
  { day: 10, month: 1, name: "Hari Asyura", nameEn: "Day of Ashura" },
  {
    day: 12,
    month: 3,
    name: "Maulid Nabi Muhammad ﷺ",
    nameEn: "Mawlid an-Nabi",
  },
  { day: 27, month: 7, name: "Isra' Mi'raj", nameEn: "Isra and Mi'raj" },
  { day: 15, month: 8, name: "Nisfu Sya'ban", nameEn: "Mid-Sha'ban" },
  { day: 1, month: 9, name: "Awal Ramadan", nameEn: "First day of Ramadan" },
  { day: 17, month: 9, name: "Nuzulul Qur'an", nameEn: "Nuzul al-Quran" },
  { day: 1, month: 10, name: "Idulfitri", nameEn: "Eid al-Fitr" },
  { day: 9, month: 12, name: "Hari Arafah", nameEn: "Day of Arafah" },
  { day: 10, month: 12, name: "Iduladha", nameEn: "Eid al-Adha" },
];

/* ---------- Nama bulan Hijriah ---------- */
const HIJRI_MONTHS = [
  "",
  "Muharram",
  "Safar",
  "Rabi'ul Awal",
  "Rabi'ul Akhir",
  "Jumadil Awal",
  "Jumadil Akhir",
  "Rajab",
  "Sya'ban",
  "Ramadan",
  "Syawal",
  "Dzulqa'dah",
  "Dzulhijjah",
];

/* ---------- Definisi waktu salat ---------- */
const PRAYER_DEFS = [
  { key: "fajr", name: "Subuh", nameEn: "Fajr", icon: "wb_twilight" },
  {
    key: "sunrise",
    name: "Terbit",
    nameEn: "Sunrise",
    icon: "wb_sunny",
    info: true,
  },
  { key: "dhuhr", name: "Zuhur", nameEn: "Dhuhr", icon: "light_mode" },
  { key: "asr", name: "Asar", nameEn: "Asr", icon: "routine" },
  { key: "maghrib", name: "Magrib", nameEn: "Maghrib", icon: "wb_twilight" },
  { key: "isha", name: "Isya", nameEn: "Isha", icon: "bedtime" },
];

/* ---------- Terjemahan UI ---------- */
const I18N = {
  id: {
    gregorian: "Masehi",
    hijri: "Hijriah",
    nextPrayer: "Salat Berikutnya",
    countdown: "Hitung mundur",
    mainFeatures: "Fitur Utama",
    todaySchedule: "Jadwal Hari Ini",
    qiblaDirection: "Arah Kiblat",
    qiblaDesc: "Kompas kiblat akurat",
    prayerTimes: "Jadwal Salat",
    prayerDesc: "Waktu salat hari ini",
    nearbyMosques: "Masjid Terdekat",
    mosquesDesc: "Temukan masjid sekitar",
    hijriCalendar: "Kalender Hijriah",
    calendarDesc: "Tanggal & hari besar",
    qiblaBearing: "Arah Kiblat",
    heading: "Arah Anda",
    distanceKaaba: "Jarak ke Ka'bah",
    qiblaInstruction:
      "Letakkan ponsel pada permukaan datar, lalu putar perlahan hingga ikon Ka'bah sejajar dengan penunjuk atas. Jika arah terasa meleset, gerakkan ponsel membentuk angka 8 untuk kalibrasi dan jauhkan dari benda logam/magnet.",
    refreshLocation: "Perbarui Lokasi",
    prayerMethodNote: "Perhitungan: Muslim World League (Fajr 18°, Isha 17°)",
    todayHijri: "Hari ini (Hijriah)",
    today: "Hari ini",
    holiday: "Hari besar",
    islamicHolidays: "Hari Besar Islam",
    mosqueList: "Daftar Masjid",
    distance: "Jarak",
    coordinates: "Koordinat",
    route: "Rute",
    openMaps: "Buka di Maps",
    profile: "Pengaturan",
    location: "Lokasi",
    appearance: "Tampilan",
    darkMode: "Mode Gelap",
    language: "Bahasa",
    about: "Tentang",
    aboutApp: "Tentang Aplikasi",
    privacy: "Kebijakan Privasi",
    version: "Versi",
    madeWith: "Dibuat dengan",
    close: "Tutup",
    developmentTeamTitle: "Tim Pengembang QiblaHub",
    teamProject: "Proyek PKM AIK",
    teamGroup: "Kelompok 2",
    teamLecturer: "Dosen Pendamping",
    teamSupervisedBy: "Dibimbing oleh",
    teamStudents: "Mahasiswa",
    teamStudentCount: "{count} Anggota Mahasiswa",
    viewTeam: "Lihat Tim",
    navHome: "Beranda",
    navMosque: "Masjid",
    navCalendar: "Kalender",
    navProfile: "Pengaturan",
    greetingMorning: "Semoga pagimu penuh berkah",
    greetingAfternoon: "Semoga harimu penuh berkah",
    greetingEvening: "Semoga malammu penuh berkah",
    locationUpdated: "Lokasi berhasil diperbarui",
    locationDenied: "Izin lokasi ditolak — memakai lokasi default",
    searchPlaceholder: "Cari masjid…",
    qiblaSearchPlaceholder: "Cari kota atau tempat…",
    searching: "Mencari lokasi…",
    searchNotFound: "Lokasi tidak ditemukan",
    noMosque: "Masjid tidak ditemukan",
    compassUnavailable:
      "Sensor kompas tidak tersedia di perangkat ini. Gunakan angka Arah Kiblat (derajat dari utara, searah jarum jam) sebagai acuan.",
    compassCalibrate:
      "Akurasi kompas rendah — gerakkan ponsel membentuk angka 8 beberapa kali untuk kalibrasi, dan jauhkan dari benda logam/magnet.",
    declinationLabel: "Deklinasi magnetik",
    trueNorthNote: "arah otomatis dikoreksi ke utara sebenarnya",
    aboutBody:
      "<p><strong>QiblaHub</strong> adalah aplikasi pendamping ibadah digital yang membantu Anda menemukan arah kiblat, jadwal salat, kalender Hijriah, dan masjid terdekat berbasis lokasi.</p><p>Aplikasi ini dikembangkan sebagai proyek akhir akademik dengan fokus pada kemudahan penggunaan, aksesibilitas, dan desain modern yang elegan.</p>",
    privacyBody:
      "<p>QiblaHub menghormati privasi Anda:</p><p>• Data lokasi hanya digunakan di perangkat untuk menghitung arah kiblat, jadwal salat, dan jarak masjid.</p><p>• Tidak ada data pribadi yang dikumpulkan, disimpan di server, atau dibagikan kepada pihak ketiga.</p><p>• Preferensi tema dan bahasa disimpan secara lokal di perangkat Anda.</p>",
  },
  en: {
    gregorian: "Gregorian",
    hijri: "Hijri",
    nextPrayer: "Next Prayer",
    countdown: "Countdown",
    mainFeatures: "Main Features",
    todaySchedule: "Today's Schedule",
    qiblaDirection: "Qibla Direction",
    qiblaDesc: "Accurate qibla compass",
    prayerTimes: "Prayer Times",
    prayerDesc: "Today's prayer schedule",
    nearbyMosques: "Nearby Mosques",
    mosquesDesc: "Find mosques around you",
    hijriCalendar: "Hijri Calendar",
    calendarDesc: "Dates & holidays",
    qiblaBearing: "Qibla Bearing",
    heading: "Your Heading",
    distanceKaaba: "Distance to Kaaba",
    qiblaInstruction:
      "Place your phone on a flat surface, then rotate slowly until the Kaaba icon aligns with the top marker. If the direction seems off, wave your phone in a figure-8 motion to calibrate and keep it away from metal/magnetic objects.",
    refreshLocation: "Refresh Location",
    prayerMethodNote: "Calculation: Muslim World League (Fajr 18°, Isha 17°)",
    todayHijri: "Today (Hijri)",
    today: "Today",
    holiday: "Holiday",
    islamicHolidays: "Islamic Holidays",
    mosqueList: "Mosque List",
    distance: "Distance",
    coordinates: "Coordinates",
    route: "Route",
    openMaps: "Open in Maps",
    profile: "Settings",
    location: "Location",
    appearance: "Appearance",
    darkMode: "Dark Mode",
    language: "Language",
    about: "About",
    aboutApp: "About Application",
    privacy: "Privacy Policy",
    version: "Version",
    madeWith: "Made with",
    close: "Close",
    developmentTeamTitle: "QiblaHub Development Team",
    teamProject: "PKM AIK Project",
    teamGroup: "Group 2",
    teamLecturer: "Academic Supervisor",
    teamSupervisedBy: "Supervised by",
    teamStudents: "Students",
    teamStudentCount: "{count} Student Members",
    viewTeam: "View Team",
    navHome: "Home",
    navMosque: "Mosque",
    navCalendar: "Calendar",
    navProfile: "Settings",
    greetingMorning: "May your morning be blessed",
    greetingAfternoon: "May your day be blessed",
    greetingEvening: "May your evening be blessed",
    locationUpdated: "Location updated successfully",
    locationDenied: "Location denied — using default location",
    searchPlaceholder: "Search mosques…",
    qiblaSearchPlaceholder: "Search city or place…",
    searching: "Searching location…",
    searchNotFound: "Location not found",
    noMosque: "No mosques found",
    compassUnavailable:
      "Compass sensor is unavailable on this device. Use the Qibla bearing (degrees from north, clockwise) as your reference.",
    compassCalibrate:
      "Compass accuracy is low — move your phone in a figure-8 motion a few times to calibrate, and keep it away from metal/magnetic objects.",
    declinationLabel: "Magnetic declination",
    trueNorthNote: "heading auto-corrected to true north",
    aboutBody:
      "<p><strong>QiblaHub</strong> is a digital worship companion that helps you find the qibla direction, prayer times, the Hijri calendar, and nearby mosques using location-based services.</p><p>This application was developed as an academic final project focusing on usability, accessibility, and elegant modern design.</p>",
    privacyBody:
      "<p>QiblaHub respects your privacy:</p><p>• Location data is only used on-device to calculate the qibla direction, prayer times, and mosque distances.</p><p>• No personal data is collected, stored on servers, or shared with third parties.</p><p>• Theme and language preferences are saved locally on your device.</p>",
  },
};
