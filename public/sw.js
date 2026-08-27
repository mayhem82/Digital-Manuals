// Offline caching (BUILD.md section 20). Cache-first for the app shell so the
// manual keeps working with no connection; network-first for data JSON so a
// newer ingestion result is picked up whenever online.
// Bump this whenever sw.js's caching *strategy* changes (not on every content
// deploy -- content itself is served network-first/cache-busted by hashing).
// Forces activate() to purge any stale cache from the old strategy.
const CACHE = "digital-manuals-v2";
const SHELL_ASSETS = ["./", "./index.html", "./manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const isData = url.pathname.includes("/data/") || url.pathname.includes("/assets/");
  // Vite content-hashes these filenames, so a given URL's bytes never change --
  // safe to cache-first. Everything else (the HTML shell above all) must be
  // network-first: cache-first here would strand a returning visitor on an
  // old index.html that references hashed bundle files a later deploy has
  // since deleted, with no way to recover except manually clearing storage.
  const isHashedBundle = url.pathname.includes("/_app/");

  if (isData) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  if (isHashedBundle) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const clone = res.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, clone));
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
