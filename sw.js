// ぽんぽんモンスター：一度開けばネットがなくても遊べるようにする
const CACHE = "pp-cache-v1";
const CORE = ["./", "./index.html", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).catch(() => { })); self.skipWaiting(); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url), same = url.origin === self.location.origin;
  if (same && (req.mode === "navigate" || url.pathname.endsWith("/") || url.pathname.endsWith(".html"))) {
    // ゲーム本体は まずネットから（更新がすぐ届く）。だめなら保存したもの
    e.respondWith(fetch(req).then(res => { if (res.ok) { const c = res.clone(); caches.open(CACHE).then(k => k.put("./index.html", c)); } return res; })
      .catch(() => caches.match("./index.html").then(r => r || caches.match("./"))));
    return;
  }
  if (same || /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.match(req).then(hit => {
      const net = fetch(req).then(res => { if (res && (res.ok || res.type === "opaque")) { const c = res.clone(); caches.open(CACHE).then(k => k.put(req, c)); } return res; }).catch(() => hit);
      return hit || net;
    }));
  }
});
