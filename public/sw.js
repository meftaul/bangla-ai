// Hand-written service worker (Serwist needs webpack; we build with Turbopack).
// Offline = lessons the student already opened. Registered by src/components/pwa.tsx.
// ponytail: static cache grows across deploys; bump V (and the "pages-v" name in
// dashboard-shell.tsx) to wipe, or add trimming if storage becomes a problem.
const V = 1;
const PAGES = `pages-v${V}`;
const STATIC = `static-v${V}`;
const LESSONS = /^\/dashboard(\/(articles|courses)(\/.*)?)?\/?$/;

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(PAGES).then((c) => c.add("/offline")));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== PAGES && k !== STATIC).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  // Supabase (cross-origin), Server Actions (POST) and realtime (websocket) pass through.
  if (req.method !== "GET" || url.origin !== location.origin) return;

  // Hashed, immutable build output: JS chunks, CSS, next/font + KaTeX fonts.
  if (url.pathname.startsWith("/_next/static/")) {
    e.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(STATIC).then((c) => c.put(req, copy));
            }
            return res;
          }),
      ),
    );
    return;
  }

  if (req.mode !== "navigate") return;

  // Lessons: network-first, remember good responses, fall back to the copy.
  // Offline client-side nav fails its RSC fetch and Next falls back to a full
  // navigation, which lands here.
  if (LESSONS.test(url.pathname)) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          // Never cache the login redirect or a 404.
          if (res.ok && !res.redirected) {
            const copy = res.clone();
            caches.open(PAGES).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req, { cacheName: PAGES }).then((hit) => hit || caches.match("/offline"))),
    );
    return;
  }

  // Everything else (live sessions, login, join) is online-only.
  e.respondWith(fetch(req).catch(() => caches.match("/offline")));
});
