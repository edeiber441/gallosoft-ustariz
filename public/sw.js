// Service Worker mínimo para Gallosoft (PWA shell cache)
// - Cachea el shell estático (HTML, JS, CSS, fuentes, iconos) con stale-while-revalidate
// - Las rutas /api/* y navegaciones con cookies siempre van a la red (DB remota)
// - El start_url se pre-cachea en install para arranque offline

const VERSION = "gallosoft-v1";
const SHELL_CACHE = `${VERSION}-shell`;
const START_URL = "/";

const SHELL_ASSETS = [
  START_URL,
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-192-maskable.png",
  "/icon-512-maskable.png",
  "/apple-touch-icon.png",
  "/favicon.ico",
  "/logo-ustariz.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_ASSETS).catch(() => undefined))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("gallosoft-") && key !== VERSION && key !== SHELL_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Solo mismo origen
  if (url.origin !== self.location.origin) return;

  // APIs y datos dinámicos: siempre red (DB remota), sin cache
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // Navegaciones (documentos): network-first con fallback al start_url cacheado
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(SHELL_CACHE).then((c) => c.put(START_URL, copy)).catch(() => undefined);
          return res;
        })
        .catch(() => caches.match(START_URL).then((r) => r || caches.match(req)))
    );
    return;
  }

  // Assets estáticos: stale-while-revalidate
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === "basic") {
            const copy = res.clone();
            caches.open(SHELL_CACHE).then((c) => c.put(req, copy)).catch(() => undefined);
          }
          return res;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
