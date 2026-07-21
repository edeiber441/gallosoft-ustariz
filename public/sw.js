// Service Worker para Gallosoft (PWA shell cache)
// - Cachea SOLO assets estáticos (_next/static, iconos, manifest, fuentes) con stale-while-revalidate
// - Los payloads RSC de Next.js (navegación client-side) SIEMPRE van a la red: nunca se sirven stale
//   (esto evita que la lista de gallos muestre datos viejos tras crear/editar)
// - Las rutas /api/* siempre van a la red (DB remota)
// - El start_url se pre-cachea en install para arranque offline

const VERSION = "gallosoft-v2";
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

// Extensiones/paths seguros para cache estático
const STATIC_PATH_PREFIXES = ["/_next/static/", "/_next/image/"];
const STATIC_EXT_RE = /\.(?:png|jpg|jpeg|gif|webp|ico|svg|css|js|woff2?|ttf|otf|eot|wasm|webmanifest|json)$/i;

function isStaticAsset(url) {
  if (STATIC_PATH_PREFIXES.some((p) => url.pathname.startsWith(p))) return true;
  if (url.pathname === "/manifest.webmanifest") return true;
  if (STATIC_EXT_RE.test(url.pathname)) return true;
  return false;
}

// Detecta peticiones de payload RSC / navegación client-side de Next.js.
// Llevan cabeceras como RSC: 1, Next-Router-State-Tree, Next-Router-Prefetch.
function isRscRequest(req) {
  if (req.headers.get("RSC")) return true;
  if (req.headers.get("Next-Router-State-Tree")) return true;
  if (req.headers.get("Next-Router-Prefetch")) return true;
  if (req.headers.get("Next-URL")) return true;
  return false;
}

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

  // Payloads RSC / navegación client-side de Next.js: SIEMPRE red, nunca cache.
  // Si se cachearan stale-while-revalidate, la lista de gallos mostraría datos viejos
  // tras crear/editar y habría que forzar refresh.
  if (isRscRequest(req)) {
    event.respondWith(fetch(req));
    return;
  }

  // Navegaciones (documentos, carga completa): network-first con fallback al start_url cacheado
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
  if (isStaticAsset(url)) {
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
    return;
  }

  // Cualquier otra misma: red (no cacheamos nada que pueda ser dinámico)
  event.respondWith(fetch(req).catch(() => caches.match(req)));
});
