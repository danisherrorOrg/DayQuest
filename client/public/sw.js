// Minimal service worker: enables PWA installability and keeps
// already-visited pages/assets available offline via a network-first,
// cache-as-you-go strategy. Not a full offline-first app shell — Vite's
// hashed build filenames aren't known ahead of time here, so there's no
// precache list; everything is cached opportunistically as it's fetched.
const CACHE_NAME = "day-story-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  // API calls are always live — never served from or written to the cache.
  if (url.pathname.startsWith("/api/")) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() => caches.match(request)),
  );
});
