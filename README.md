<div align="center">

# 🕌 QiblaHub Web (Web AIK)

**Islamic companion app versi web — ringan, tanpa framework, responsif untuk HP & laptop**

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

</div>

---

## ✨ Fitur

- 🧭 **Arah Kiblat** — kompas kiblat (sensor orientasi di HP), derajat & jarak ke Ka'bah, plus **pencarian kota/tempat** untuk perangkat tanpa sensor
- 🕐 **Jadwal Salat** — perhitungan Muslim World League (Fajr 18°, Isha 17°) dengan hitung mundur salat berikutnya
- 🗓️ **Kalender Hijriah** — konversi Umm al-Qura (Intl API), penanda hari Jumat & hari besar Islam
- 🕌 **Masjid Terdekat** — data asli OpenStreetMap radius 4 km diurutkan berdasar jarak, jarak tempuh via rute jalan (OSRM), dan peta tertanam
- 📍 **Lokasi Akurat** — GPS high-accuracy (memantau hingga pembacaan terbaik) + reverse geocoding nama kota
- 🌙 **Mode Gelap & Dwibahasa** — tema terang/gelap, Bahasa Indonesia & English, tersimpan di localStorage
- 💻 **Responsif** — bottom navigation di HP, top navbar + layout dua kolom di laptop/desktop
- ⚡ **Zero dependency** — HTML, CSS, dan JavaScript murni, tanpa build step

## 🚀 Cara Menjalankan

Tidak perlu instalasi — cukup buka `index.html` di browser, atau gunakan
static server agar fitur lokasi (memerlukan HTTPS/localhost) berjalan penuh:

```bash
# Python
python -m http.server 8000

# atau Node.js
npx serve .
```

Buka `http://localhost:8000`.

> 💡 Fitur GPS/lokasi hanya berjalan di `localhost` atau HTTPS — ini kebijakan
> keamanan browser (Geolocation API). Reverse geocoding (Nominatim) juga
> menolak request dari `file://`, jadi gunakan static server / hosting.

## 📂 Struktur

```
Web AIK/
├── index.html    # Halaman utama (SPA — semua layar dalam satu file)
├── css/
│   └── style.css # Tema, komponen, layout responsif (mobile + desktop)
└── js/
    ├── data.js   # Data statis: Ka'bah, masjid fallback, hari besar, i18n
    └── app.js    # Logika: kiblat, waktu salat, kalender, geolokasi, API
```

## 🌍 Sumber Data (gratis, tanpa API key)

| Data                    | Layanan                    |
| ----------------------- | -------------------------- |
| Masjid terdekat         | OpenStreetMap Overpass API |
| Jarak tempuh rute jalan | OSRM                       |
| Pencarian & nama tempat | Nominatim                  |
| Peta tertanam           | OpenStreetMap embed        |

## 📱 Versi Mobile

Tersedia juga versi Flutter untuk Android: [QiblaHub](https://github.com/Emil-02/QiblaHub)

## 📄 Lisensi

MIT

---

<div align="center">

Dibuat dengan ❤️ oleh <a href="https://github.com/Emil-02">Emil-02</a>

</div>
