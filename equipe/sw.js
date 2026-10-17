// v3 · SODAF Équipe : aucun stockage, aucune interception des pages.
// La page « Pas de connexion » est retirée (17 oct.) : elle bloquait l'application même avec internet.
// Le service worker ne sert plus qu'aux notifications.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

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
