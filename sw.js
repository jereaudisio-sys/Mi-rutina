// Mi Rutina: keeps the app on the phone so it opens without signal.
const VERSION = "v1";
const SHELL = ["./", "index.html", "supabase.js", "manifest.webmanifest", "icon-192.png", "icon-512.png"];
const CACHE = "mi-rutina-" + VERSION;

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("mi-rutina-") && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.hostname.endsWith("supabase.co")) return; // data always goes to the cloud
  const isFont = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (url.origin !== location.origin && !isFont) return;
  // Show the saved copy right away, refresh it in the background for next time
  e.respondWith(caches.open(CACHE).then(async c => {
    const key = req.mode === "navigate" ? "index.html" : req;
    const hit = await c.match(key, { ignoreSearch: req.mode === "navigate" });
    const net = fetch(req).then(res => { if (res && (res.ok || res.type === "opaque")) c.put(key, res.clone()); return res; }).catch(() => null);
    return hit || (await net) || new Response("Sin conexión", { status: 503 });
  }));
});
