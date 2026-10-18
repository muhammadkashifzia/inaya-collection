/* Anaya Collection service worker: app-shell caching + offline fallback. */
const VERSION = "v1";
const STATIC_CACHE = `static-${VERSION}`;
const PAGES_CACHE = `pages-${VERSION}`;
const ASSETS_CACHE = `assets-${VERSION}`;
const OFFLINE_URL = "/offline";

const PRECACHE = [OFFLINE_URL, "/icon-192.png", "/icon-512.png", "/anaya-collection-logo.svg"];

// Personal / transactional pages are never cached.
const NO_CACHE_PATHS = ["/account", "/cart", "/checkout", "/wishlist", "/api"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  const keep = [STATIC_CACHE, PAGES_CACHE, ASSETS_CACHE];
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !keep.includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > max) await Promise.all(keys.slice(0, keys.length - max).map((k) => cache.delete(k)));
}

// Pages: network first, fall back to the cached copy, then the offline page.
async function handleNavigation(request, cacheable) {
  try {
    const response = await fetch(request);
    if (cacheable && response.ok && response.type === "basic") {
      const cache = await caches.open(PAGES_CACHE);
      cache.put(request, response.clone()).then(() => trim(PAGES_CACHE, 40));
    }
    return response;
  } catch {
    const cached = cacheable ? await caches.match(request) : undefined;
    return cached || (await caches.match(OFFLINE_URL)) || Response.error();
  }
}

// Hashed build assets never change: cache first.
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) (await caches.open(STATIC_CACHE)).put(request, response.clone());
  return response;
}

// Images, fonts and public files: serve cached, refresh in background.
async function staleWhileRevalidate(request) {
  const cache = await caches.open(ASSETS_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone()).then(() => trim(ASSETS_CACHE, 120));
      return response;
    })
    .catch(() => cached);
  return cached || network;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const cacheable = !NO_CACHE_PATHS.some((p) => url.pathname === p || url.pathname.startsWith(`${p}/`));

  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(request, cacheable));
    return;
  }

  // Leave RSC/flight requests, API calls and private pages to the network.
  if (!cacheable || request.headers.get("RSC") || url.searchParams.has("_rsc")) return;

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (
    url.pathname.startsWith("/_next/image") ||
    ["image", "font"].includes(request.destination) ||
    /\.(png|jpe?g|webp|avif|gif|svg|ico|woff2?)$/.test(url.pathname)
  ) {
    event.respondWith(staleWhileRevalidate(request));
  }
});
