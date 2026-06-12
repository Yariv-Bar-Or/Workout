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

// Background sync — tell all open clients to run syncQueue
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-workouts") {
    event.waitUntil(
      self.clients.matchAll({ includeUncontrolled: true, type: "window" }).then((clients) => {
        clients.forEach((client) => client.postMessage({ type: "SYNC_QUEUE" }));
      })
    );
  }
});

// Web push notification
self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title ?? "LiftLog ⏱️", {
      body: data.body,
      icon: data.icon ?? "/icons/icon-192x192.png",
      badge: data.badge ?? "/icons/icon-72x72.png",
      tag: data.tag ?? "rest-timer",
      renotify: data.renotify ?? true,
    })
  );
});

// Show rest-timer notification when the page sends SHOW_TIMER_NOTIFICATION
self.addEventListener("message", (event) => {
  if (event.data?.type === "SHOW_TIMER_NOTIFICATION") {
    event.waitUntil(
      self.registration.showNotification("⏱ LiftLog", {
        body: "סיים המנוחה — חזור לאימון!",
        icon: "/icons/icon-192x192.png",
        tag: "rest-timer",
        renotify: true,
      })
    );
  }
});

// Focus / open the app when the rest-timer notification is tapped
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        const focused = clients.find((c) => c.focused);
        if (focused) return focused.focus();
        const visible = clients.find((c) => c.visibilityState === "visible");
        if (visible) return visible.focus();
        if (clients.length > 0) return clients[0].focus();
        return self.clients.openWindow("/");
      })
  );
});
