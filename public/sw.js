const STATIC_CACHE = "liftlog-static-v1";
const API_CACHE = "liftlog-api-v1";

const PRECACHE_URLS = ["/", "/offline"];

// Install: pre-cache static shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// Activate: delete old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== API_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch routing
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and chrome-extension requests
  if (request.method !== "GET") return;
  if (url.protocol === "chrome-extension:") return;

  // Skip HMR in dev
  if (url.pathname.startsWith("/_next/webpack-hmr")) return;

  // Supabase API → networkFirst into API_CACHE
  if (url.hostname.includes("supabase.co")) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  // Next.js static assets → cacheFirst
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Navigation requests → fetch, fallback to /offline
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match("/offline").then((cached) => cached || new Response("Offline", { status: 503 }))
      )
    );
    return;
  }

  // Everything else → networkFirst
  event.respondWith(networkFirst(request, STATIC_CACHE));
});

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response("Offline", { status: 503 });
  }
}

// Placeholder for future background sync
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-workouts") {
    console.log("[sw] sync-workouts fired — placeholder for future use");
  }
});
