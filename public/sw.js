// Service Worker — Restoran Tizimi
const CACHE_NAME = "restoran-v1";
const API_CACHE = "restoran-api-v1";
const IMG_CACHE = "restoran-img-v1";

// Install vaqtida cache qilinadigan sahifalar
const STATIC_ASSETS = [
  "/",
  "/login",
  "/dashboard",
  "/tables",
  "/orders",
  "/kitchen",
  "/cashier",
  "/products",
  "/manifest.json",
];

// ─── INSTALL ──────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS).catch(() => {
          // Ba'zi sahifalar yuklanmasa ham davom etadi
        });
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

// ─── FETCH — so'rovlarni ushlash ──────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // WebSocket — o'tkazib yuborish
  if (url.protocol === "wss:" || url.protocol === "ws:") return;

  // Chrome extension — o'tkazib yuborish
  if (!url.protocol.startsWith("http")) return;

  // API so'rovlari — Network First (5s timeout)
  if (url.hostname !== self.location.hostname) {
    event.respondWith(networkFirst(request, API_CACHE, 5000));
    return;
  }

  // Rasmlar — Cache First
  if (request.destination === "image") {
    event.respondWith(cacheFirst(request, IMG_CACHE));
    return;
  }

  // Sahifalar va statik fayllar — Stale While Revalidate
  event.respondWith(staleWhileRevalidate(request, CACHE_NAME));
});

// ─── Network First: avval network, yo'q bo'lsa cache ─────────
async function networkFirst(request, cacheName, timeout) {
  const cache = await caches.open(cacheName);
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timer);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    // API offline javob
    return new Response(
      JSON.stringify({
        success: false,
        message: "Offline rejim — internet yo'q",
        offline: true,
      }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }
}

// ─── Cache First: cache dan, yo'q bo'lsa network ─────────────
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

// ─── Stale While Revalidate: cache, keyin yangilash ──────────
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

// ─── Background Sync — offline amallarni yuborish ─────────────
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-pending-actions") {
    event.waitUntil(syncPendingActions());
  }
});

async function syncPendingActions() {
  // IndexedDB dan pending amallarni o'qib yuborish
  // Bu logika lib/sync.ts da — client tomonida boshqariladi
  // SW faqat signalni yuboradi
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({ type: "sync-requested" });
  });
}

// ─── Push notifications (kelajak uchun) ──────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;
  try {
    const data = event.data.json();
    event.waitUntil(
      self.registration.showNotification(data.title || "Restoran", {
        body: data.body || "",
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
      }),
    );
  } catch {}
});
