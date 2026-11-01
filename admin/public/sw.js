/*
 * Anaya Collection admin service worker.
 * Caches only the app shell and static assets on this origin. API calls go to
 * the Laravel backend (another origin) and are never cached, so admin data is
 * always live and never stored on the device.
 */
const VERSION = "v1";
const SHELL_CACHE = `admin-shell-${VERSION}`;
const ASSETS_CACHE = `admin-assets-${VERSION}`;
const SHELL_URL = "/index.html";

const PRECACHE = [SHELL_URL, "/manifest.webmanifest", "/pwa-192.png", "/pwa-512.png", "/favicon.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  const keep = [SHELL_CACHE, ASSETS_CACHE];
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => !keep.includes(key)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

// SPA routes: always try the network for the latest index.html, fall back to the cached shell.
async function handleNavigation(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      (await caches.open(SHELL_CACHE)).put(SHELL_URL, response.clone());
    }
    return response;
  } catch {
    return (await caches.match(SHELL_URL)) || Response.error();
  }
}

// Vite's /assets/* files are content-hashed and never change: cache first.
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) (await caches.open(ASSETS_CACHE)).put(request, response.clone());
  return response;
}

// Icons and images in public/: serve cached, refresh in the background.
async function staleWhileRevalidate(request) {
  const cache = await caches.open(ASSETS_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);
  return cached || network;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  // Never touch the API or any other origin.
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(request));
    return;
  }

  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (["image", "font"].includes(request.destination) || /\.(png|jpe?g|webp|svg|ico|woff2?)$/.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});

/* ── Push Notifications ── */

self.addEventListener("push", (event) => {
  console.log("[SW] Push received:", event.data?.text());

  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Anaya Collection", body: event.data.text() };
  }

  const title = payload.title || "Anaya Collection Admin";
  const options = {
    body: payload.body || "",
    icon: payload.icon || "/pwa-192.png",
    badge: payload.badge || "/favicon.png",
    tag: payload.tag || "admin-notification",
    renotify: true,
    data: { url: payload.url || "/" },
    vibrate: [200, 100, 200],
  };

  event.waitUntil(
    self.registration.showNotification(title, options).then(() => {
      // Update badge count on the app icon (SW scope uses navigator)
      if (self.navigator && "setAppBadge" in self.navigator) {
        const count = payload.badge_count ?? 1;
        self.navigator.setAppBadge(count).catch(() => {});
      }
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification clicked:", event.notification.data);
  event.notification.close();

  const urlPath = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      // If an admin window is already open, focus it and navigate
      for (const client of clients) {
        if (new URL(client.url).origin === self.location.origin && "focus" in client) {
          return client.focus().then((c) => c.navigate(urlPath));
        }
      }
      // Otherwise open a new window
      return self.clients.openWindow(urlPath);
    }),
  );
});
