// SODAF · application élève (site public). Aucune donnée personnelle n'est gardée ici :
// seulement les pages et fichiers du site, pour que les cours et les quiz s'ouvrent même sans connexion.
// L'espace équipe (/equipe/) a son propre service worker et n'est jamais touché par celui-ci.
const CACHE = "sodaf-eleve-v1";
const BASE = ["/", "/manifest.webmanifest", "/icon-eleve-192.png", "/icon-eleve-512.png", "/couverture-manuel.jpg", "/favicon.ico"];

self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(BASE).catch(() => {});
    try { // le script du site (son nom change à chaque version : app.js?v=…)
      const html = await (await fetch("/", { cache: "no-store" })).text();
      const m = html.match(/src="(\/app\.js\?v=\d+)"/); if (m) await c.add(m[1]);
    } catch (_) {}
    self.skipWaiting();
  })());
});
self.addEventListener("activate", (e) => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k.startsWith("sodaf-eleve-") && k !== CACHE) await caches.delete(k);
  await self.clients.claim();
})()));

self.addEventListener("fetch", (e) => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET") return;
  if (u.origin === location.origin) {
    if (u.pathname.startsWith("/equipe/") || u.pathname.startsWith("/videos/") || u.pathname === "/sw.js") return;
    // Pages et script : d'abord internet (toujours la dernière version), sinon la copie gardée
    if (r.mode === "navigate" || u.pathname === "/app.js") {
      e.respondWith((async () => {
        try {
          const res = await fetch(r);
          if (res.ok) { const c = await caches.open(CACHE); c.put(r.mode === "navigate" ? "/" : r, res.clone()); if (u.pathname === "/app.js") trim(c, u.href); }
          return res;
        } catch (_) {
          const c = await caches.open(CACHE);
          return (await c.match(r.mode === "navigate" ? "/" : r)) || (r.mode === "navigate" ? offline() : Response.error());
        }
      })());
      return;
    }
    // Images et autres fichiers du site : la copie gardée d'abord, mise à jour en arrière-plan
    e.respondWith(fromCache(r));
    return;
  }
  if (u.hostname === "fonts.googleapis.com" || u.hostname === "fonts.gstatic.com") e.respondWith(fromCache(r));
  // Tout le reste (base de données, WhatsApp, cartes…) passe directement par internet
});

async function fromCache(r) {
  const c = await caches.open(CACHE), hit = await c.match(r);
  const net = fetch(r).then((res) => { if (res.ok || res.type === "opaque") c.put(r, res.clone()); return res; }).catch(() => null);
  return hit || (await net) || Response.error();
}
async function trim(c, garder) { // une seule version du script en mémoire
  for (const k of await c.keys()) { const p = new URL(k.url); if (p.pathname === "/app.js" && k.url !== garder) c.delete(k); }
}
function offline() {
  return new Response('<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SODAF</title><body style="margin:0;font-family:system-ui,sans-serif;background:#0B6E4F;color:#fff;display:grid;place-items:center;min-height:100vh;text-align:center;padding:24px"><div><h1 style="font-size:1.4rem">Pas de connexion internet</h1><p>Ouvre l\'application une fois avec internet : ensuite, les cours et les quiz marchent même sans connexion.</p><button onclick="location.reload()" style="margin-top:12px;font:600 1rem system-ui;padding:.8em 1.4em;border:0;border-radius:999px;background:#F2B100">Réessayer</button></div></body></html>', { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
