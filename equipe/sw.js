// SODAF Équipe : aucun stockage des données. Le service worker affiche seulement
// un message clair quand il n'y a pas de connexion internet.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (e) => {
  if (e.request.mode !== "navigate") return;
  e.respondWith(fetch(e.request).catch(() => new Response(
    '<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SODAF Équipe</title>' +
    '<body style="margin:0;font-family:system-ui,sans-serif;background:#14171C;color:#fff;display:grid;place-items:center;min-height:100vh;text-align:center;padding:24px">' +
    '<div><p style="font-size:3rem;margin:0">📶</p><h1 style="font-size:1.4rem">Pas de connexion internet</h1><p style="color:#C9CED4">Vérifie le Wi-Fi ou les données mobiles, puis réessaie.<br>En attendant, note les paiements dans le carnet de reçus.</p>' +
    '<button onclick="location.reload()" style="margin-top:12px;font:600 1rem system-ui;padding:.8em 1.4em;border:0;border-radius:999px;background:#F2B100">Réessayer</button></div></body></html>',
    { headers: { "Content-Type": "text/html; charset=utf-8" } })));
});
