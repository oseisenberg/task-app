// Network-first service worker. Hashed build assets must never be served
// stale, so we always try the network and only fall back to cache when
// offline. Bumping CACHE on each change purges everything older.
const CACHE = "task-app-v2";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || new URL(request.url).origin !== location.origin)
    return;

  event.respondWith(
    fetch(request)
      .then((res) => {
        // Cache good same-origin responses for offline fallback only.
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
        }
        return res;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        if (request.mode === "navigate") {
          return (await caches.match("/index.html")) || Response.error();
        }
        return Response.error();
      })
  );
});
