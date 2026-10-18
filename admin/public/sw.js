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
