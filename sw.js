// ميزان: offline cache. Bump VERSION whenever any app file changes.
const VERSION = "mizan-v12";
const CORE = ["./", "index.html", "manifest.webmanifest", "icon.svg", "icon-180.png", "icon-192.png", "icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CORE.map((u) => new Request(u, { cache: "reload" })))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // App pages: network first so updates arrive, cache when offline.
  if (req.mode === "navigate") {
    e.respondWith(fetch(req.url, { cache: "no-cache", credentials: "same-origin" }).then((res) => { const copy = res.clone(); caches.open(VERSION).then((c) => c.put("index.html", copy)); return res; })
      .catch(() => caches.match("index.html")));
    return;
  }
  // Everything else (icons, Google Fonts): cache first, fill the cache on first use.
  if (url.origin === location.origin || url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req, url.origin === location.origin ? { cache: "no-cache" } : {}).then((res) => {
      const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); return res;
    })));
  }
});
