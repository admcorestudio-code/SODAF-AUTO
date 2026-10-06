// SODAF · Fonction « notifier » : envoie les notifications sur les téléphones de l'équipe.
// Appelée uniquement par la base (déclencheurs de la migration 0028) avec un secret partagé.
// Types : message (canal), preinscription (formulaire du site), inscription (finalisée en ligne), connexion (lieu + alerte nouvel appareil), test (bouton « Tester »), geotest (contrôle du lieu),
// gérance : demande, demande_reponse, decision, decision_avis, rapport, rapport_rappel (dimanche 18 h).
// Les clés VAPID et le secret sont lus dans prive.config_push : rien de secret dans ce fichier.
import webpush from "npm:web-push@3.6.7";
import postgres from "npm:postgres@3.4.5";

const sql = postgres(Deno.env.get("SUPABASE_DB_URL")!, { prepare: false, max: 2, idle_timeout: 20 });
const prenom = (n: string) => (n || "").trim().split(/\s+/)[0] || "Équipe";
const milliers = (n: number) => String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const ROLE: Record<string, string> = { admin: "Direction", gerant: "Gérante", secretariat: "Secrétariat", moniteur: "Moniteur" };
// Lieu approximatif d'une adresse internet (pays, ville, opérateur). Adresses locales ignorées. Deux services de secours, 4 s au plus chacun.
const nomPays = (cc: string, n: string) => { try { return new Intl.DisplayNames(["fr"], { type: "region" }).of(String(cc).toUpperCase()) || n; } catch { return n; } };
async function geo(ip: string): Promise<{ pays: string; ville: string | null; op: string | null } | null> {
  if (!ip || /^(10\.|127\.|0\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|::1$|f[cd]|fe80)/i.test(ip)) return null;
  const net = (t: unknown, n: number) => { const v = t ? String(t).replace(/^AS\d+\s*/, "").trim().slice(0, n) : ""; return v && !/-AS\d*$/i.test(v) ? v : null; }; // codes techniques du type « XXXX-AS » : ignorés
  try {
    const r = await fetch("https://get.geojs.io/v1/ip/geo/" + encodeURIComponent(ip) + ".json", { signal: AbortSignal.timeout(4000) });
    if (r.ok) { const j = await r.json(); if (j && j.country_code) return { pays: nomPays(j.country_code, j.country || "").slice(0, 60), ville: net(j.city, 80), op: net(j.organization_name || j.organization, 80) }; }
  } catch { /* service suivant */ }
  try {
    const r = await fetch("https://ipwho.is/" + encodeURIComponent(ip) + "?lang=fr", { signal: AbortSignal.timeout(4000) });
    if (r.ok) { const j = await r.json(); if (j && j.success) return { pays: nomPays(j.country_code, j.country || "").slice(0, 60), ville: net(j.city, 80), op: net(j.connection && (j.connection.isp || j.connection.org), 80) }; }
  } catch { /* lieu inconnu */ }
  return null;
}
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ ok: true });
  const cfg: Record<string, string> = Object.fromEntries((await sql`select cle, valeur from prive.config_push`).map((r) => [r.cle, r.valeur]));
  if (!cfg.secret_fonction || req.headers.get("x-sodaf-secret") !== cfg.secret_fonction) return json({ erreur: "refusé" }, 401);
  let p: { type?: string; id?: number; profil?: string; ip?: string };
  try { p = await req.json(); } catch { return json({ erreur: "requête illisible" }, 400); }

  let roles: string[] | null = null, exclure: string | null = null, seulement: string | null = null, aussi: string | null = null;
  let mentionnes: string[] = [], auteurPrenom = "", canalNom = "";
  let note: { title: string; body: string; url: string; tag: string } | null = null;

  if (p.type === "message") {
    const [m] = await sql`select m.texte, m.canal, m.auteur, m.mentions, m.fichier, c.nom as canal_nom, c.roles, pr.nom as auteur_nom, pr.role as auteur_role
                            from public.messages m join public.canaux c on c.id = m.canal join public.profils pr on pr.id = m.auteur where m.id = ${p.id ?? 0}`;
    if (!m) return json({ envoyes: 0, raison: "message introuvable" });
    roles = m.roles; exclure = m.auteur; mentionnes = m.mentions || [];
    const corpsTexte = (m.fichier ? (String(m.fichier.type || "").startsWith("audio/") ? "Message vocal" : String(m.fichier.type || "").startsWith("image/") ? "Photo" : "Fichier : " + (m.fichier.nom || "Fichier")) + (m.texte && m.texte !== m.fichier.nom ? " · " : "") : "") + (m.texte && (!m.fichier || m.texte !== m.fichier.nom) ? m.texte : "");
    note = { title: prenom(m.auteur_nom) + " (" + (ROLE[m.auteur_role] || "Équipe") + ") · " + m.canal_nom, body: corpsTexte.length > 180 ? corpsTexte.slice(0, 177) + "…" : corpsTexte, url: "/equipe/?canal=" + m.canal, tag: "canal-" + m.canal };
    auteurPrenom = prenom(m.auteur_nom); canalNom = m.canal_nom;
  } else if (p.type === "preinscription") {
    const [e] = await sql`select id, nom, formation, source from public.eleves where id = ${p.id ?? 0}`;
    if (!e || e.source !== "site") return json({ envoyes: 0, raison: "pas une pré-inscription du site" });
    roles = ["admin", "gerant", "secretariat"];
    note = { title: "Nouvelle pré-inscription", body: e.nom + (e.formation ? " · " + e.formation : "") + " · à accueillir (SO" + e.id + ")", url: "/equipe/?eleve=" + e.id, tag: "eleve-" + e.id };
  } else if (p.type === "inscription") {
    const [w] = await sql`select eleve_id, mode, a_payer, prenoms, nom, mixx_ref from public.inscriptions_web where id = ${p.id ?? 0}`;
    if (!w) return json({ envoyes: 0, raison: "inscription introuvable" });
    roles = ["admin", "gerant", "secretariat"];
    const qui = ((w.prenoms || "") + " " + (w.nom || "")).trim();
    note = w.mode === "mixx"
      ? { title: "Paiement Mixx à vérifier", body: qui + " · " + milliers(w.a_payer) + " F" + (w.mixx_ref ? " · réf. " + w.mixx_ref : "") + " (SO" + w.eleve_id + ")", url: "/equipe/?eleve=" + w.eleve_id, tag: "eleve-" + w.eleve_id }
      : { title: "Inscription finalisée", body: qui + " viendra payer " + milliers(w.a_payer) + " F à l'agence (SO" + w.eleve_id + ")", url: "/equipe/?eleve=" + w.eleve_id, tag: "eleve-" + w.eleve_id };
  } else if (p.type === "connexion") {
    // Sécurité : un compte s'est connecté sur un appareil jamais vu → la direction et la personne concernée sont prévenues
    // Chaque connexion : on cherche le lieu (pays, ville, opérateur) et on l'enregistre ; l'alerte ne part que pour un nouvel appareil
    const [c] = await sql`select c.id, c.description, c.le, c.profil, c.ip, c.pays, c.ville, c.operateur, c.nouvel, pr.nom, pr.role from public.connexions c join public.profils pr on pr.id = c.profil where c.id = ${p.id ?? 0}`;
    if (!c) return json({ envoyes: 0, raison: "connexion introuvable" });
    if (c.ip && !c.pays) {
      const g = await geo(c.ip);
      if (g) { await sql`update public.connexions set pays = ${g.pays}, ville = ${g.ville}, operateur = ${g.op} where id = ${c.id}`; c.pays = g.pays; c.ville = g.ville; c.operateur = g.op; }
    }
    const lieu = c.pays ? (c.ville ? c.ville + ", " : "") + c.pays + (c.operateur ? " (" + c.operateur + ")" : "") : "";
    if (!c.nouvel) return json({ type: p.type, lieu, envoyes: 0, raison: "appareil déjà connu" });
    roles = ["admin"]; aussi = c.profil;
    const heure = new Date(c.le).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Lome" });
    note = { title: "Nouvelle connexion · " + (ROLE[c.role] || "Équipe"), body: prenom(c.nom) + " (" + (ROLE[c.role] || "Équipe") + ") s'est connecté sur un nouvel appareil : " + (c.description || "appareil inconnu") + (lieu ? ", depuis " + lieu : "") + ", à " + heure + ". Si ce n'est pas normal : Direction → Comptes → Désactiver.", url: "/equipe/", tag: "cx-" + c.id };
  } else if (p.type === "demande") {
    const [d] = await sql`select d.type, d.montant, d.texte, e.nom as eleve from public.demandes d left join public.eleves e on e.id = d.eleve_id where d.id = ${p.id ?? 0}`;
    if (!d) return json({ envoyes: 0, raison: "demande introuvable" });
    roles = ["admin"];
    const corps = (d.montant ? milliers(d.montant) + " F · " : "") + (d.eleve ? d.eleve + " · " : "") + d.texte;
    note = { title: "Demande d'accord · " + d.type, body: corps.length > 180 ? corps.slice(0, 177) + "…" : corps, url: "/equipe/?gerance=demandes", tag: "dem-" + p.id };
  } else if (p.type === "demande_reponse") {
    const [d] = await sql`select type, statut, reponse, auteur from public.demandes where id = ${p.id ?? 0}`;
    if (!d) return json({ envoyes: 0, raison: "demande introuvable" });
    seulement = d.auteur;
    note = { title: (d.statut === "accordee" ? "Accordé · " : "Refusé · ") + d.type, body: d.reponse || (d.statut === "accordee" ? "La direction a donné son accord." : "La direction n'a pas donné son accord."), url: "/equipe/?gerance=demandes", tag: "dem-" + p.id };
  } else if (p.type === "decision") {
    const [d] = await sql`select categorie, texte from public.decisions where id = ${p.id ?? 0}`;
    if (!d) return json({ envoyes: 0, raison: "décision introuvable" });
    roles = ["admin"];
    note = { title: "Décision de la gérante · " + d.categorie, body: d.texte.length > 180 ? d.texte.slice(0, 177) + "…" : d.texte, url: "/equipe/?gerance=decisions", tag: "dec-" + p.id };
  } else if (p.type === "decision_avis") {
    const [d] = await sql`select texte, avis_note, auteur from public.decisions where id = ${p.id ?? 0}`;
    if (!d) return json({ envoyes: 0, raison: "décision introuvable" });
    seulement = d.auteur;
    const corps = (d.avis_note ? d.avis_note + " · " : "") + "« " + d.texte + " »";
    note = { title: "Décision à revoir", body: corps.length > 180 ? corps.slice(0, 177) + "…" : corps, url: "/equipe/?gerance=decisions", tag: "dec-" + p.id };
  } else if (p.type === "rapport") {
    const [r] = await sql`select semaine, chiffres from public.rapports where id = ${p.id ?? 0}`;
    if (!r) return json({ envoyes: 0, raison: "rapport introuvable" });
    roles = ["admin"];
    const c = r.chiffres || {};
    note = { title: "Rapport de la semaine du " + new Date(r.semaine).toLocaleDateString("fr-FR", { day: "numeric", month: "long", timeZone: "UTC" }), body: (c.encaisse != null ? milliers(c.encaisse) + " F encaissés" : "Rapport reçu") + (c.inscriptions != null ? " · " + c.inscriptions + " inscription" + (c.inscriptions > 1 ? "s" : "") : ""), url: "/equipe/?gerance=rapports", tag: "rap-" + p.id };
  } else if (p.type === "rapport_rappel") {
    roles = ["gerant"];
    note = { title: "Rapport de la semaine", body: "Les chiffres sont prêts. Ajoute tes remarques et envoie le rapport à la direction.", url: "/equipe/?gerance=rapports", tag: "rap-rappel" };
  } else if (p.type === "geotest") {
    return json({ ip: p.ip || null, lieu: await geo(p.ip || "") }); // contrôle technique (secret obligatoire), aucune écriture
  } else if (p.type === "test") {
    seulement = p.profil || null;
    note = { title: "Notifications SODAF activées", body: "Tu recevras ici les messages de l'équipe et les nouvelles inscriptions.", url: "/equipe/?canal=general", tag: "test" };
  } else return json({ erreur: "type inconnu" }, 400);

  const abos = await sql`select s.id, s.endpoint, s.p256dh, s.auth, s.profil, pr.role from public.push_abonnements s join public.profils pr on pr.id = s.profil where pr.actif`; // comptes désactivés : plus de notifications
  const cibles = abos.filter((a) => (seulement ? a.profil === seulement : ((!roles || roles.includes(a.role)) || a.profil === aussi) && a.profil !== exclure));
  webpush.setVapidDetails(cfg.vapid_sujet, cfg.vapid_public, cfg.vapid_private);
  const corps = JSON.stringify(note);
  const corpsMention = note && mentionnes.length ? JSON.stringify({ ...note, title: auteurPrenom + " t'a mentionné · " + canalNom }) : corps; // @mention : titre dédié
  let envoyes = 0, echecs = 0, retires = 0;
  await Promise.all(cibles.map(async (a) => {
    try {
      await webpush.sendNotification({ endpoint: a.endpoint, keys: { p256dh: a.p256dh, auth: a.auth } }, mentionnes.includes(a.profil) ? corpsMention : corps, { TTL: 86400, urgency: "high" });
      envoyes++;
    } catch (e) {
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) { await sql`delete from public.push_abonnements where id = ${a.id}`; retires++; } // téléphone désabonné : on retire l'abonnement technique
      else { echecs++; console.error("envoi", code, String((e as Error).message || e).slice(0, 200)); }
    }
  }));
  return json({ type: p.type, cibles: cibles.length, envoyes, echecs, retires });
});
