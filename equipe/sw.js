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

// Notifications de l'équipe (messages, nouvelles pré-inscriptions, paiements Mixx) envoyées par la base
self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { title: "SODAF Équipe", body: e.data ? e.data.text() : "" }; }
  e.waitUntil(self.registration.showNotification(d.title || "SODAF Équipe", {
    body: d.body || "", icon: "/equipe/icon-192.png", tag: d.tag || undefined, renotify: !!d.tag,
    data: { url: d.url || "/equipe/" },
  }));
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || "/equipe/", self.location.origin).href;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
    const w = list.find((c) => c.url.includes("/equipe/"));
    if (w) { w.postMessage({ sodafOuvrir: url }); return w.focus(); }
    return self.clients.openWindow(url);
  }));
});
