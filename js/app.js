/* ═══════════════════════════════════════════════════
   QiblaHub — Application Logic
   Navigasi, geolokasi, kiblat, jadwal salat, kalender
   Hijriah (Intl umalqura), masjid terdekat, tema, bahasa
   ═══════════════════════════════════════════════════ */

"use strict";

/* ─────────── State ─────────── */
const state = {
  lat: DEFAULT_LOCATION.lat,
  lon: DEFAULT_LOCATION.lon,
  locationName: DEFAULT_LOCATION.name,
  heading: 0,
  qiblaBearing: 0,
  prayerTimes: null,
  nearbyMosques: null, // hasil OpenStreetMap; null = pakai data statis
  roadKm: null, // jarak tempuh jalan per id masjid (OSRM)
  lang: localStorage.getItem("qh-lang") || "id",
  theme: localStorage.getItem("qh-theme") || "light",
  calAnchor: new Date(), // tanggal referensi bulan Hijriah yang tampil
  selectedMosque: null,
  compassActive: false,
};

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);
const t = (key) =>
  (I18N[state.lang] && I18N[state.lang][key]) || I18N.id[key] || key;

/* ═══════════ UTILITAS MATEMATIKA ═══════════ */
const rad = (d) => (d * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;
const fixAngle = (a) => ((a % 360) + 360) % 360;
const fixHour = (h) => ((h % 24) + 24) % 24;

/* Jarak haversine (km) */
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* Arah kiblat (bearing dari utara searah jarum jam) */
function qiblaBearing(lat, lon) {
  const dLon = rad(KAABA.lon - lon);
  const y = Math.sin(dLon);
  const x =
    Math.cos(rad(lat)) * Math.tan(rad(KAABA.lat)) -
    Math.sin(rad(lat)) * Math.cos(dLon);
  return fixAngle(deg(Math.atan2(y, x)));
}

/* ═══════════ PERHITUNGAN WAKTU SALAT (MWL) ═══════════ */
function sunPosition(jd) {
  const D = jd - 2451545.0;
  const g = fixAngle(357.529 + 0.98560028 * D);
  const q = fixAngle(280.459 + 0.98564736 * D);
  const L = fixAngle(
    q + 1.915 * Math.sin(rad(g)) + 0.02 * Math.sin(rad(2 * g)),
  );
  const e = 23.439 - 0.00000036 * D;
  const RA =
    deg(Math.atan2(Math.cos(rad(e)) * Math.sin(rad(L)), Math.cos(rad(L)))) / 15;
  return {
    declination: deg(Math.asin(Math.sin(rad(e)) * Math.sin(rad(L)))),
    equation: q / 15 - fixHour(RA),
  };
}

/* Jam matahari untuk sudut ketinggian tertentu (angle: derajat di bawah horizon positif) */
function hourAngle(angle, decl, lat) {
  const cosH =
    (-Math.sin(rad(angle)) - Math.sin(rad(decl)) * Math.sin(rad(lat))) /
    (Math.cos(rad(decl)) * Math.cos(rad(lat)));
  if (cosH < -1 || cosH > 1) return NaN;
  return deg(Math.acos(cosH)) / 15;
}

function computePrayerTimes(date, lat, lon) {
  const jd = Math.floor(date.getTime() / 86400000 - 0.5) + 2440588 + 0.5; // JD tengah malam UTC
  const sun = sunPosition(jd + 0.5 - lon / (15 * 24));
  const decl = sun.declination;
  const tz = -date.getTimezoneOffset() / 60;

  const noon = fixHour(12 - sun.equation); // waktu matahari lokal
  const toLocal = (h) => fixHour(h - lon / 15 + tz); // konversi ke waktu lokal

  const asrAlt = deg(Math.atan(1 / (1 + Math.tan(rad(Math.abs(lat - decl)))))); // bayangan 1x

  return {
    fajr: toLocal(noon - hourAngle(18, decl, lat)),
    sunrise: toLocal(noon - hourAngle(0.833, decl, lat)),
    dhuhr: toLocal(noon + 2 / 60),
    asr: toLocal(noon + hourAngle(-asrAlt, decl, lat)),
    maghrib: toLocal(noon + hourAngle(0.833, decl, lat)),
    isha: toLocal(noon + hourAngle(17, decl, lat)),
  };
}

function fmtTime(hours) {
  if (isNaN(hours)) return "--:--";
  let h = Math.floor(hours);
  let m = Math.round((hours - h) * 60);
  if (m === 60) {
    m = 0;
    h = (h + 1) % 24;
  }
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/* ═══════════ TANGGAL HIJRIAH (Intl umalqura) ═══════════ */
const hijriFmt = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
  day: "numeric",
  month: "numeric",
  year: "numeric",
});

function hijriParts(date) {
  const parts = {};
  hijriFmt.formatToParts(date).forEach((p) => {
    if (p.type !== "literal") parts[p.type] = parseInt(p.value, 10);
  });
  return parts; // { day, month, year }
}

function hijriString(date) {
  const h = hijriParts(date);
  return `${h.day} ${HIJRI_MONTHS[h.month]} ${h.year} H`;
}

function gregString(date) {
  return date.toLocaleDateString(state.lang === "id" ? "id-ID" : "en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/* ═══════════ NAVIGASI ═══════════ */
const NAV_SCREENS = ["home", "mosques", "calendar", "profile"];

function navigate(name) {
  $$(".screen").forEach((s) => s.classList.remove("active"));
  const target = $(`#screen-${name}`);
  if (target) {
    target.classList.add("active");
    target.style.animation = "none";
    void target.offsetWidth; // restart animasi
    target.style.animation = "";
  }
  $$(".nav-item, .top-link").forEach((n) =>
    n.classList.toggle("active", n.dataset.nav === name),
  );
  window.scrollTo({ top: 0, behavior: "instant" });

  if (name === "qibla") startCompass();
  else stopCompass();
}

document.addEventListener("click", (e) => {
  const navEl = e.target.closest("[data-nav]");
  if (navEl) navigate(navEl.dataset.nav);
});
document.addEventListener("keydown", (e) => {
  const navEl = e.target.closest?.("[data-nav][role='button']");
  if (navEl && (e.key === "Enter" || e.key === " "))
    navigate(navEl.dataset.nav);
});

/* ═══════════ TOAST & MODAL ═══════════ */
let toastTimer;
function showToast(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add("hidden"), 2600);
}

function showModal(title, html) {
  $("#modal-title").textContent = title;
  $("#modal-body").innerHTML = html;
  $("#modal").classList.remove("hidden");
}
$("#modal-close").addEventListener("click", () =>
  $("#modal").classList.add("hidden"),
);
$("#modal").addEventListener("click", (e) => {
  if (e.target.id === "modal") $("#modal").classList.add("hidden");
});

/* ═══════════ GEOLOKASI ═══════════ */
let geoWatchId = null;
let geoStopTimer = null;

function stopGeoWatch() {
  if (geoWatchId !== null && navigator.geolocation) {
    navigator.geolocation.clearWatch(geoWatchId);
    geoWatchId = null;
  }
  clearTimeout(geoStopTimer);
  geoStopTimer = null;
}

/* Pantau GPS beberapa detik dan pakai pembacaan paling akurat —
   meniru perilaku geolocator (high accuracy) di aplikasi Flutter */
function requestLocation(silent = false) {
  if (!navigator.geolocation) {
    applyLocation(
      DEFAULT_LOCATION.lat,
      DEFAULT_LOCATION.lon,
      DEFAULT_LOCATION.name,
    );
    return;
  }
  stopGeoWatch();

  let best = null;

  const finish = () => {
    stopGeoWatch();
    if (best && !silent)
      showToast(`${t("locationUpdated")} (±${Math.round(best.accuracy)} m)`);
  };

  geoStopTimer = setTimeout(finish, 12000); // berhenti menyaring setelah 12 dtk

  geoWatchId = navigator.geolocation.watchPosition(
    (pos) => {
      const { latitude, longitude, accuracy } = pos.coords;
      if (best && accuracy >= best.accuracy) return; // bukan perbaikan
      const movedKm = best
        ? haversine(best.lat, best.lon, latitude, longitude)
        : Infinity;
      best = { lat: latitude, lon: longitude, accuracy };
      if (movedKm > 0.03) {
        // bergeser > 30 m → render ulang & ambil nama tempat
        applyLocation(latitude, longitude, null);
        reverseGeocode(latitude, longitude);
      }
      if (accuracy <= 20) finish(); // sudah seakurat GPS ponsel
    },
    () => {
      stopGeoWatch();
      if (!best) {
        applyLocation(
          DEFAULT_LOCATION.lat,
          DEFAULT_LOCATION.lon,
          DEFAULT_LOCATION.name,
        );
        if (!silent) showToast(t("locationDenied"));
      }
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
  );
}

async function reverseGeocode(lat, lon) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=13&accept-language=${state.lang}`,
    );
    if (!res.ok) return;
    const data = await res.json();
    const a = data.address || {};
    const name =
      [a.city || a.town || a.village || a.county, a.state]
        .filter(Boolean)
        .join(", ") || data.display_name?.split(",").slice(0, 2).join(",");
    if (name) {
      state.locationName = name;
      renderLocation();
    }
  } catch {
    /* offline / diblokir — biarkan koordinat saja */
  }
}

function applyLocation(lat, lon, name) {
  state.lat = lat;
  state.lon = lon;
  state.locationName = name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  state.qiblaBearing = qiblaBearing(lat, lon);
  state.prayerTimes = computePrayerTimes(new Date(), lat, lon);
  state.roadKm = null; // jarak jalan lama tidak berlaku di lokasi baru
  renderLocation();
  renderQibla();
  renderPrayer();
  renderMosques($("#mosque-search").value);
  updateMosqueMap();
  fetchNearbyMosques(); // muat masjid asli di sekitar lokasi
}

/* Ambil masjid terdekat dari OpenStreetMap (Overpass API) — persis
   seperti aplikasi: radius 4 km, ambil hingga 400 elemen lalu URUTKAN
   berdasar jarak (urutan hasil server bukan berdasarkan jarak!),
   sehingga masjid paling dekat tidak pernah terpotong. */
let loadingMosques = false;

function parseMosqueElements(elements) {
  const seen = new Set();
  return elements
    .map((e) => {
      if (seen.has(e.id)) return null;
      seen.add(e.id);
      const lat = e.lat ?? e.center?.lat;
      const lon = e.lon ?? e.center?.lon;
      if (lat == null || lon == null) return null;
      const tags = e.tags || {};
      const name = (tags.name || "Masjid").trim(); // tanpa nama tetap diambil
      const addr = [
        tags["addr:street"],
        tags["addr:subdistrict"] || tags["addr:village"],
        tags["addr:city"],
      ]
        .filter(Boolean)
        .join(", ");
      return {
        id: e.id,
        name,
        address:
          addr ||
          (state.lang === "id"
            ? "Alamat tidak tersedia"
            : "Address unavailable"),
        lat,
        lon,
      };
    })
    .filter(Boolean);
}

async function fetchNearbyMosques() {
  if (loadingMosques) return;
  loadingMosques = true;

  // Koordinat saat request dimulai — untuk mendeteksi hasil usang
  const reqLat = state.lat,
    reqLon = state.lon;

  const query =
    `[out:json][timeout:40];(` +
    `nwr["amenity"="place_of_worship"]["religion"="muslim"](around:4000,${reqLat},${reqLon});` +
    `nwr["building"="mosque"](around:4000,${reqLat},${reqLon});` +
    `);out center 400;`;

  const endpoints = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
  ];

  /* Minta ke semua server SEKALIGUS dan pakai jawaban valid yang paling
     cepat — sebagian server bisa menolak (406) atau sangat lambat */
  const controllers = endpoints.map(() => new AbortController());
  const attempts = endpoints.map((endpoint, i) =>
    (async () => {
      const timer = setTimeout(() => controllers[i].abort(), 30000);
      try {
        const res = await fetch(
          `${endpoint}?data=${encodeURIComponent(query)}`,
          {
            headers: { Accept: "application/json" },
            signal: controllers[i].signal,
          },
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const list = parseMosqueElements(data.elements || []);
        if (!list.length) throw new Error("hasil kosong");
        return list;
      } finally {
        clearTimeout(timer);
      }
    })(),
  );

  let list = null;
  try {
    list = await Promise.any(attempts);
    controllers.forEach((c) => c.abort()); // batalkan request lain
  } catch {
    /* semua server gagal — data statis tetap dipakai */
  }

  loadingMosques = false;
  if (!list) return;

  /* Lokasi berubah saat request berjalan? Hasil usang — ulangi */
  if (reqLat !== state.lat || reqLon !== state.lon) return fetchNearbyMosques();

  /* Urutkan berdasar jarak lalu ambil 100 terdekat (persis aplikasi) */
  list.sort(
    (a, b) =>
      haversine(state.lat, state.lon, a.lat, a.lon) -
      haversine(state.lat, state.lon, b.lat, b.lon),
  );
  state.nearbyMosques = list.slice(0, 100);
  renderMosques($("#mosque-search").value);
  fetchRoadDistances(); // jarak lewat rute jalan (OSRM)
  enrichMosqueDetails(); // lengkapi nama/alamat masjid tanpa nama
}

/* Lengkapi nama/alamat masjid yang kosong lewat reverse geocoding
   Nominatim — meniru geocoder perangkat pada aplikasi.
   Maksimal ~1 permintaan/detik sesuai aturan Nominatim. */
let enriching = false;

async function enrichMosqueDetails() {
  if (enriching || !state.nearbyMosques) return;
  enriching = true;
  const list = state.nearbyMosques;
  const noAddr = ["Alamat tidak tersedia", "Address unavailable"];
  let failures = 0;

  for (let i = 0; i < list.length && i < 20 && failures < 3; i++) {
    if (state.nearbyMosques !== list) break; // daftar sudah diganti — stop
    const m = list[i];
    const needsName = m.name === "Masjid";
    const needsAddr = noAddr.includes(m.address);
    if (!needsName && !needsAddr) continue;

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${m.lat}&lon=${m.lon}&zoom=17&accept-language=${state.lang}`,
      );
      if (!res.ok) throw new Error("reverse failed");
      const a = (await res.json()).address || {};
      const street = a.road || a.pedestrian || a.residential || "";
      const parts = [
        street,
        a.village || a.suburb || a.neighbourhood,
        a.city || a.town || a.county,
      ].filter(Boolean);
      if (needsName && street) m.name = `Masjid ${street}`;
      if (needsAddr && parts.length) m.address = parts.join(", ");
      if (i % 5 === 4) renderMosques($("#mosque-search").value);
      await new Promise((r) => setTimeout(r, 1100)); // batas laju Nominatim
    } catch {
      failures++; // geocoder tidak tersedia — berhenti setelah 3 kegagalan
    }
  }

  enriching = false;
  renderMosques($("#mosque-search").value);
}

function renderLocation() {
  $("#home-location").textContent = state.locationName;
  $("#prayer-location").textContent = state.locationName;
  $("#profile-location").textContent = state.locationName;
}

/* ═══════════ HOME ═══════════ */
function renderHome() {
  const now = new Date();
  const h = now.getHours();
  const subKey =
    h < 11
      ? "greetingMorning"
      : h < 18
        ? "greetingAfternoon"
        : "greetingEvening";
  $("#home-greeting").textContent = "Assalamu'alaikum";
  $("#home-greeting-sub").textContent = t(subKey);
  $("#home-date-greg").textContent = now.toLocaleDateString(
    state.lang === "id" ? "id-ID" : "en-GB",
    { day: "numeric", month: "long", year: "numeric" },
  );
  $("#home-date-hijri").textContent = hijriString(now);
}

/* ═══════════ JADWAL SALAT ═══════════ */
function prayerStatus() {
  const pt = state.prayerTimes;
  if (!pt) return null;
  const now = new Date();
  const nowH = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
  const order = PRAYER_DEFS.filter((p) => !p.info);

  let current = null,
    next = null;
  for (const p of order) {
    if (pt[p.key] <= nowH) current = p;
  }
  next = order.find((p) => pt[p.key] > nowH) || null;

  let nextTime, nextDef;
  if (next) {
    nextDef = next;
    nextTime = pt[next.key];
  } else {
    // setelah Isya → Subuh besok
    nextDef = order[0];
    const tomorrow = new Date(now.getTime() + 86400000);
    nextTime = computePrayerTimes(tomorrow, state.lat, state.lon).fajr + 24;
  }
  const diffH = nextTime - nowH;
  return {
    current,
    nextDef,
    nextTime: fixHour(nextTime),
    diffSec: Math.max(0, diffH * 3600),
  };
}

function fmtCountdown(sec) {
  const s = Math.floor(sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

function prayerName(def) {
  return state.lang === "id" ? def.name : def.nameEn;
}

function renderPrayer() {
  const pt = state.prayerTimes;
  if (!pt) return;
  const st = prayerStatus();

  /* Layar jadwal salat */
  const list = $("#prayer-list");
  list.innerHTML = "";
  const now = new Date();
  const nowH = now.getHours() + now.getMinutes() / 60;

  PRAYER_DEFS.forEach((p) => {
    const row = document.createElement("div");
    const isCurrent = !p.info && st?.current?.key === p.key;
    const passed = !p.info && !isCurrent && pt[p.key] < nowH;
    row.className = `prayer-row${isCurrent ? " current" : ""}${passed ? " passed" : ""}`;
    row.innerHTML = `
      <span class="pr-icon"><span class="material-symbols-rounded">${p.icon}</span></span>
      <span class="pr-name">
        <strong>${prayerName(p)}${isCurrent ? '<span class="pr-badge">' + (state.lang === "id" ? "Sekarang" : "Now") + "</span>" : ""}</strong>
        <small>${p.info ? (state.lang === "id" ? "Bukan waktu salat" : "Not a prayer time") : p.nameEn}</small>
      </span>
      <span class="pr-time">${fmtTime(pt[p.key])}</span>`;
    list.appendChild(row);
  });

  /* Hero jadwal */
  if (st) {
    $("#prayer-next-name").textContent = prayerName(st.nextDef);
    $("#prayer-next-time").textContent = fmtTime(st.nextTime);
    $("#npb-name").textContent = prayerName(st.nextDef);
    $("#npb-time").textContent = fmtTime(st.nextTime);
  }
  $("#prayer-date-greg").textContent = now.toLocaleDateString(
    state.lang === "id" ? "id-ID" : "en-GB",
    { day: "numeric", month: "long", year: "numeric" },
  );
  $("#prayer-date-hijri").textContent = hijriString(now);

  /* Mini list di beranda */
  const mini = $("#mini-prayer-list");
  mini.innerHTML = "";
  PRAYER_DEFS.filter((p) => !p.info).forEach((p) => {
    const isCurrent = st?.current?.key === p.key;
    const row = document.createElement("div");
    row.className = `mini-prayer-row${isCurrent ? " current" : ""}`;
    row.innerHTML = `
      <span class="mp-name"><span class="material-symbols-rounded">${p.icon}</span>${prayerName(p)}</span>
      <span class="mp-time">${fmtTime(pt[p.key])}</span>`;
    mini.appendChild(row);
  });
}

function tickCountdown() {
  const st = prayerStatus();
  if (!st) return;
  const text = fmtCountdown(st.diffSec);
  $("#prayer-countdown").textContent = text;
  $("#npb-countdown").textContent = text;
}
setInterval(tickCountdown, 1000);

/* Render ulang daftar salat tiap menit (highlight bergeser) */
setInterval(() => {
  renderPrayer();
  renderHome();
}, 60000);

/* ═══════════ KIBLAT / KOMPAS ═══════════ */
function renderQibla() {
  $("#qibla-bearing").textContent = `${state.qiblaBearing.toFixed(1)}°`;
  $("#qibla-distance").textContent = `${Math.round(
    haversine(state.lat, state.lon, KAABA.lat, KAABA.lon),
  ).toLocaleString(state.lang === "id" ? "id-ID" : "en-US")} km`;
  updateCompassView();
}

/* Smoothing melingkar: dial mengejar heading sensor lewat busur
   terpendek — meredam getaran magnetometer tanpa melompat di 0°/360° */
let displayHeading = 0; // sudut kontinu (tanpa wrap) yang dirender
let compassRafId = null;

function updateCompassView() {
  $("#compass-dial").style.transform = `rotate(${-displayHeading}deg)`;
  $("#qibla-needle").style.transform = `rotate(${state.qiblaBearing}deg)`;
  /* jaga ikon Ka'bah tetap tegak */
  $(".qn-kaaba").style.transform =
    `rotate(${-(state.qiblaBearing - displayHeading)}deg)`;
  $("#qibla-heading").textContent = `${Math.round(fixAngle(displayHeading))}°`;
}

function animateCompass() {
  const delta = ((state.heading - fixAngle(displayHeading) + 540) % 360) - 180;
  displayHeading += Math.abs(delta) < 0.05 ? delta : delta * 0.2;
  updateCompassView();
  if (state.compassActive) compassRafId = requestAnimationFrame(animateCompass);
}

/* Sudut rotasi layar (0/90/180/270) — tanpa ini pembacaan melenceng
   90°/180° saat perangkat dalam mode landscape */
function screenAngle() {
  if (screen.orientation && typeof screen.orientation.angle === "number")
    return screen.orientation.angle;
  return typeof window.orientation === "number" ? window.orientation : 0;
}

/* Heading terkompensasi kemiringan dari sudut Euler perangkat (Z-X'-Y'').
   Memproyeksikan sumbu perangkat ke bidang horizontal bumi sehingga
   arah tetap akurat meski ponsel tidak rata sempurna — rumus
   `360 - alpha` saja hanya benar saat perangkat benar-benar datar. */
function headingFromEuler(alpha, beta, gamma) {
  const a = rad(alpha),
    b = rad(beta),
    g = rad(gamma);
  const cA = Math.cos(a),
    sA = Math.sin(a);
  const cB = Math.cos(b),
    sB = Math.sin(b);
  const cG = Math.cos(g),
    sG = Math.sin(g);

  /* Proyeksi horizontal sumbu atas layar (sumbu-y perangkat) */
  let east = -sA * cB;
  let north = cA * cB;

  /* Ponsel hampir tegak → sumbu-y mendekati vertikal (tak stabil);
     pakai arah punggung perangkat (rumus spesifikasi W3C) */
  if (Math.abs(cB) < 0.35) {
    east = -cA * sG - sA * sB * cG;
    north = -sA * sG + cA * sB * cG;
  }
  return fixAngle(deg(Math.atan2(east, north)));
}

let absoluteSensor = false; // sumber bereferensi utara sudah aktif
let calibrationHinted = false;

function setHeading(h) {
  if (!state.orientationFired) {
    state.orientationFired = true;
    if (state.compassFallback) {
      state.compassFallback = false;
      $("#qibla-instruction-text").textContent = t("qiblaInstruction");
    }
  }
  state.heading = fixAngle(h);
}

/* Android/Chromium: `deviceorientationabsolute` selalu bereferensi
   utara magnetik — sumber paling akurat, diprioritaskan */
function onAbsOrientation(e) {
  if (e.alpha == null) return;
  absoluteSensor = true;
  setHeading(
    headingFromEuler(e.alpha, e.beta || 0, e.gamma || 0) + screenAngle(),
  );
}

/* iOS Safari (webkitCompassHeading) & browser lain yang berspesifikasi
   absolute. Event RELATIF (titik nol sembarang) sengaja DIABAIKAN —
   memakainya membuat arah kiblat acak/menyesatkan. */
function onOrientation(e) {
  if (
    typeof e.webkitCompassHeading === "number" &&
    e.webkitCompassHeading >= 0
  ) {
    absoluteSensor = true;
    setHeading(e.webkitCompassHeading + screenAngle());

    /* Akurasi kompas iOS rendah → sarankan kalibrasi angka-8 */
    const acc = e.webkitCompassAccuracy;
    if (typeof acc === "number") {
      if (!calibrationHinted && (acc < 0 || acc > 25)) {
        calibrationHinted = true;
        $("#qibla-instruction-text").textContent = t("compassCalibrate");
      } else if (calibrationHinted && acc >= 0 && acc <= 25) {
        calibrationHinted = false;
        $("#qibla-instruction-text").textContent = t("qiblaInstruction");
      }
    }
    return;
  }
  if (absoluteSensor) return; // sudah ada sumber bereferensi utara
  if (e.absolute === true && e.alpha != null) {
    setHeading(
      headingFromEuler(e.alpha, e.beta || 0, e.gamma || 0) + screenAngle(),
    );
  }
}

let compassFallbackTimer = null;

function startCompass() {
  if (state.compassActive) return;
  state.compassActive = true;
  state.orientationFired = false;
  absoluteSensor = false;
  calibrationHinted = false;

  const attach = () => {
    window.addEventListener(
      "deviceorientationabsolute",
      onAbsOrientation,
      true,
    );
    window.addEventListener("deviceorientation", onOrientation, true);
  };

  /* Laptop/desktop umumnya tanpa sensor — beri petunjuk pemakaian manual */
  clearTimeout(compassFallbackTimer);
  compassFallbackTimer = setTimeout(() => {
    if (!state.orientationFired) {
      state.compassFallback = true;
      $("#qibla-instruction-text").textContent = t("compassUnavailable");
    }
  }, 3000);

  if (
    typeof DeviceOrientationEvent !== "undefined" &&
    typeof DeviceOrientationEvent.requestPermission === "function"
  ) {
    DeviceOrientationEvent.requestPermission()
      .then((res) => {
        if (res === "granted") attach();
        else $("#qibla-instruction-text").textContent = t("compassUnavailable");
      })
      .catch(() => {});
  } else if (typeof DeviceOrientationEvent !== "undefined") {
    attach();
  } else {
    $("#qibla-instruction-text").textContent = t("compassUnavailable");
  }

  displayHeading = state.heading;
  updateCompassView();
  cancelAnimationFrame(compassRafId);
  compassRafId = requestAnimationFrame(animateCompass);
}

function stopCompass() {
  if (!state.compassActive) return;
  state.compassActive = false;
  clearTimeout(compassFallbackTimer);
  cancelAnimationFrame(compassRafId);
  window.removeEventListener(
    "deviceorientationabsolute",
    onAbsOrientation,
    true,
  );
  window.removeEventListener("deviceorientation", onOrientation, true);
}

/* ═══════════ PENCARIAN LOKASI ARAH KIBLAT ═══════════ */
async function searchQiblaLocation(query) {
  const q = query.trim();
  if (!q) return;
  showToast(t("searching"));
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&accept-language=${state.lang}&q=${encodeURIComponent(q)}`,
    );
    if (!res.ok) throw new Error("geocode failed");
    const data = await res.json();
    if (!data.length) {
      showToast(t("searchNotFound"));
      return;
    }
    const hit = data[0];
    stopGeoWatch(); // hentikan GPS agar tidak menimpa hasil pencarian
    applyLocation(
      parseFloat(hit.lat),
      parseFloat(hit.lon),
      hit.display_name.split(",").slice(0, 2).join(", ").trim(),
    );
    showToast(t("locationUpdated"));
  } catch {
    showToast(t("searchNotFound"));
  }
}

$("#qibla-search-form").addEventListener("submit", (e) => {
  e.preventDefault();
  searchQiblaLocation($("#qibla-search").value);
});

$("#btn-qibla-locate").addEventListener("click", () => requestLocation());
$("#btn-qibla-refresh").addEventListener("click", () => requestLocation());
$("#btn-refresh-location").addEventListener("click", () => requestLocation());
$("#btn-profile-locate").addEventListener("click", () => requestLocation());

/* ═══════════ KALENDER HIJRIAH ═══════════ */
function hijriMonthStart(anchor) {
  /* cari tanggal Masehi saat hari Hijriah = 1 pada bulan anchor */
  const h = hijriParts(anchor);
  const start = new Date(anchor);
  start.setDate(start.getDate() - (h.day - 1));
  return { start, month: h.month, year: h.year };
}

function hijriMonthLength(start) {
  for (let i = 29; i <= 30; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    if (hijriParts(d).day === 1) return i;
  }
  return 30;
}

function renderCalendar() {
  const { start, month, year } = hijriMonthStart(state.calAnchor);
  const len = hijriMonthLength(start);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  $("#cal-month-label").textContent = `${HIJRI_MONTHS[month]} ${year} H`;

  const grid = $("#cal-grid");
  grid.innerHTML = "";

  /* sel kosong sebelum hari pertama (minggu dimulai Ahad) */
  for (let i = 0; i < start.getDay(); i++) {
    const cell = document.createElement("div");
    cell.className = "cal-cell empty";
    grid.appendChild(cell);
  }

  for (let d = 1; d <= len; d++) {
    const gDate = new Date(start);
    gDate.setDate(gDate.getDate() + (d - 1));
    gDate.setHours(0, 0, 0, 0);

    const cell = document.createElement("div");
    const isToday = gDate.getTime() === today.getTime();
    const isHoliday = ISLAMIC_HOLIDAYS.some(
      (hd) => hd.day === d && hd.month === month,
    );
    const isFriday = gDate.getDay() === 5;

    cell.className = `cal-cell${isToday ? " today" : ""}${isHoliday ? " holiday" : ""}${isFriday ? " friday" : ""}`;
    cell.innerHTML = `${d}<small>${gDate.getDate()}/${gDate.getMonth() + 1}</small>`;
    if (isHoliday) {
      const hd = ISLAMIC_HOLIDAYS.find((x) => x.day === d && x.month === month);
      cell.title = state.lang === "id" ? hd.name : hd.nameEn;
    }
    grid.appendChild(cell);
  }

  /* kartu hari ini */
  const now = new Date();
  $("#cal-today-hijri").textContent = hijriString(now);
  $("#cal-today-greg").textContent = gregString(now);

  /* daftar hari besar */
  const hl = $("#holiday-list");
  hl.innerHTML = "";
  ISLAMIC_HOLIDAYS.forEach((hd) => {
    const item = document.createElement("div");
    item.className = "holiday-item";
    item.innerHTML = `
      <span class="holiday-date"><strong>${hd.day}</strong><small>${HIJRI_MONTHS[hd.month].slice(0, 3)}</small></span>
      <span class="holiday-info">
        <strong>${state.lang === "id" ? hd.name : hd.nameEn}</strong>
        <small>${hd.day} ${HIJRI_MONTHS[hd.month]}</small>
      </span>`;
    hl.appendChild(item);
  });
}

$("#cal-prev").addEventListener("click", () => {
  const { start } = hijriMonthStart(state.calAnchor);
  const prev = new Date(start);
  prev.setDate(prev.getDate() - 1);
  state.calAnchor = prev;
  renderCalendar();
});
$("#cal-next").addEventListener("click", () => {
  const { start } = hijriMonthStart(state.calAnchor);
  const len = hijriMonthLength(start);
  const next = new Date(start);
  next.setDate(next.getDate() + len);
  state.calAnchor = next;
  renderCalendar();
});
$("#btn-cal-today").addEventListener("click", () => {
  state.calAnchor = new Date();
  renderCalendar();
});

/* Jarak tempuh lewat jalan (bukan garis lurus) via OSRM — gratis tanpa key */
async function fetchRoadDistances() {
  const source = (state.nearbyMosques || MOSQUES).slice(0, 80);
  if (!source.length) return;
  const reqLat = state.lat,
    reqLon = state.lon; // deteksi hasil usang
  try {
    const coords = [
      `${state.lon},${state.lat}`,
      ...source.map((m) => `${m.lon},${m.lat}`),
    ].join(";");
    const res = await fetch(
      `https://router.project-osrm.org/table/v1/driving/${coords}?sources=0&annotations=distance`,
    );
    if (!res.ok) return;
    const data = await res.json();
    const dists = data.distances?.[0];
    if (!dists) return;
    if (reqLat !== state.lat || reqLon !== state.lon) return; // lokasi berubah
    state.roadKm = {};
    source.forEach((m, i) => {
      const d = dists[i + 1];
      if (typeof d === "number") state.roadKm[m.id] = d / 1000;
    });
    renderMosques($("#mosque-search").value);
  } catch {
    /* haversine tetap dipakai */
  }
}

/* ═══════════ MASJID TERDEKAT ═══════════ */
function mosquesWithDistance() {
  const source = state.nearbyMosques || MOSQUES;
  return source
    .map((m) => ({
      ...m,
      distance:
        state.roadKm?.[m.id] ?? haversine(state.lat, state.lon, m.lat, m.lon),
    }))
    .sort((a, b) => a.distance - b.distance);
}

function fmtDistance(km) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

function osmEmbed(lat, lon, delta = 0.02) {
  const bbox = `${lon - delta},${lat - delta},${lon + delta},${lat + delta}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`;
}

function updateMosqueMap() {
  $("#mosque-map").src = osmEmbed(state.lat, state.lon, 0.04);
}

function renderMosques(filter = "") {
  const listEl = $("#mosque-list");
  listEl.innerHTML = "";
  const q = filter.trim().toLowerCase();
  const items = mosquesWithDistance().filter(
    (m) =>
      !q ||
      m.name.toLowerCase().includes(q) ||
      m.address.toLowerCase().includes(q),
  );

  $("#mosque-count").textContent = items.length;

  if (!items.length) {
    listEl.innerHTML = `<div class="empty-state">
      <span class="material-symbols-rounded">mosque</span>${t("noMosque")}</div>`;
    return;
  }

  items.forEach((m) => {
    const card = document.createElement("div");
    card.className = "mosque-card";
    card.innerHTML = `
      <div class="mc-top">
        <span class="mc-icon"><span class="material-symbols-rounded">mosque</span></span>
        <span class="mc-info"><strong>${m.name}</strong><small>${m.address}</small></span>
        <span class="mc-dist">${fmtDistance(m.distance)}</span>
      </div>
      <div class="mc-actions">
        <button class="mc-btn map" data-act="map"><span class="material-symbols-rounded">map</span>${t("openMaps")}</button>
        <button class="mc-btn nav" data-act="nav"><span class="material-symbols-rounded">near_me</span>${state.lang === "id" ? "Navigasi" : "Navigate"}</button>
      </div>`;

    card.addEventListener("click", (e) => {
      const act = e.target.closest("[data-act]")?.dataset.act;
      if (act === "map") {
        window.open(
          `https://www.google.com/maps/search/?api=1&query=${m.lat},${m.lon}`,
          "_blank",
          "noopener",
        );
      } else if (act === "nav") {
        window.open(
          `https://www.google.com/maps/dir/?api=1&destination=${m.lat},${m.lon}`,
          "_blank",
          "noopener",
        );
      } else {
        openMosqueDetail(m);
      }
    });
    listEl.appendChild(card);
  });
}

$("#mosque-search").addEventListener("input", (e) =>
  renderMosques(e.target.value),
);

/* ═══════════ DETAIL MASJID ═══════════ */
function openMosqueDetail(m) {
  state.selectedMosque = m;
  $("#detail-name").textContent = m.name;
  $("#detail-address").textContent = m.address;
  $("#detail-distance").textContent = fmtDistance(m.distance);
  $("#detail-coords").textContent = `${m.lat.toFixed(5)}, ${m.lon.toFixed(5)}`;
  $("#detail-map").src = osmEmbed(m.lat, m.lon, 0.008);
  navigate("detail");
}

$("#btn-detail-route").addEventListener("click", () => {
  const m = state.selectedMosque;
  if (m)
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${m.lat},${m.lon}`,
      "_blank",
      "noopener",
    );
});
$("#btn-detail-maps").addEventListener("click", () => {
  const m = state.selectedMosque;
  if (m)
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${m.lat},${m.lon}`,
      "_blank",
      "noopener",
    );
});

/* ═══════════ TEMA & BAHASA ═══════════ */
function applyTheme(theme) {
  state.theme = theme;
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("qh-theme", theme);
  $("#toggle-dark").checked = theme === "dark";
}
$("#toggle-dark").addEventListener("change", (e) =>
  applyTheme(e.target.checked ? "dark" : "light"),
);

function applyLang(lang) {
  state.lang = lang;
  localStorage.setItem("qh-lang", lang);
  document.documentElement.lang = lang;
  $("#select-lang").value = lang;

  $$("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  $("#mosque-search").placeholder = t("searchPlaceholder");
  $("#qibla-search").placeholder = t("qiblaSearchPlaceholder");
  if (state.compassFallback)
    $("#qibla-instruction-text").textContent = t("compassUnavailable");

  renderHome();
  renderPrayer();
  renderCalendar();
  renderMosques($("#mosque-search").value);
  renderQibla();
}
$("#select-lang").addEventListener("change", (e) => applyLang(e.target.value));

/* ═══════════ TENTANG & PRIVASI ═══════════ */
$("#btn-about").addEventListener("click", () =>
  showModal(t("aboutApp"), t("aboutBody")),
);
$("#btn-privacy").addEventListener("click", () =>
  showModal(t("privacy"), t("privacyBody")),
);

/* ═══════════ INISIALISASI ═══════════ */
function init() {
  applyTheme(state.theme);
  applyLang(state.lang);

  applyLocation(
    DEFAULT_LOCATION.lat,
    DEFAULT_LOCATION.lon,
    DEFAULT_LOCATION.name,
  );
  renderHome();
  renderCalendar();
  tickCountdown();

  /* splash → app */
  setTimeout(() => {
    $("#splash").classList.add("fade-out");
    $("#app").classList.remove("hidden");
    requestLocation(true);
  }, 2400);
}

document.addEventListener("DOMContentLoaded", init);
