// Service Worker — Restoran Tizimi
const CACHE_NAME = "restoran-v2";
const API_CACHE = "restoran-api-v2";
const IMG_CACHE = "restoran-img-v2";

// "/" olib tashlandi — middleware redirect qiladi, SW cache qilmasin
const STATIC_ASSETS = ["/login", "/manifest.json"];

// ─── INSTALL ──────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS).catch(() => {});
      })
      .then(() => self.skipWaiting()),
  );
});

// ─── ACTIVATE — eski cache larni tozalash ─────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => ![CACHE_NAME, API_CACHE, IMG_CACHE].includes(k))
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// ─── FETCH ────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // WebSocket — o'tkazib yuborish
  if (url.protocol === "wss:" || url.protocol === "ws:") return;
  if (!url.protocol.startsWith("http")) return;

  // "/" va navigatsiya so'rovlari — HECH QACHON cache qilmasin
  // Middleware server tomonda redirect qiladi
  if (request.mode === "navigate") {
    event.respondWith(fetch(request));
    return;
  }

  // API so'rovlari — Network First
  if (url.hostname !== self.location.hostname) {
    event.respondWith(networkFirst(request, API_CACHE, 5000));
    return;
  }

  // Rasmlar — Cache First
  if (request.destination === "image") {
    event.respondWith(cacheFirst(request, IMG_CACHE));
    return;
  }

  // Statik fayllar — Stale While Revalidate
  event.respondWith(staleWhileRevalidate(request, CACHE_NAME));
});

// ─── Network First ────────────────────────────────────────────
async function networkFirst(request, cacheName, timeout) {
  const cache = await caches.open(cacheName);
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timer);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    return new Response(
      JSON.stringify({
        success: false,
        message: "Offline rejim",
        offline: true,
      }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }
}

// ─── Cache First ──────────────────────────────────────────────
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    return new Response("", { status: 404 });
  }
}

// ─── Stale While Revalidate ───────────────────────────────────
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);
  return cached || fetchPromise || new Response("Offline", { status: 503 });
}

// ─── Background Sync ──────────────────────────────────────────
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-pending-actions") {
    event.waitUntil(
      self.clients
        .matchAll()
        .then((clients) =>
          clients.forEach((c) => c.postMessage({ type: "sync-requested" })),
        ),
    );
  }
});
