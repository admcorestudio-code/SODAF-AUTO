// SODAF · Fonction « notifier » : envoie les notifications sur les téléphones de l'équipe.
// Appelée uniquement par la base (déclencheurs de la migration 0028) avec un secret partagé.
// Types : message (canal), preinscription (formulaire du site), inscription (finalisée en ligne), connexion (lieu + alerte nouvel appareil), test (bouton « Tester »), geotest (contrôle du lieu),
// gérance : demande, demande_equipe (équipe → gérante), demande_reponse, decision, decision_avis, rapport, rapport_rappel (dimanche 18 h).
// reçus : annulation (demande du secrétariat → gérante ; réponse → secrétariat).
// planning : agence (0080, veille à 18 h : qui remplace le secrétariat).
// mécanique : entretien (jeudi 9 h, entretiens à prévoir samedi, liste calculée par prive.entretiens_a_prevoir).
// À faire (0062, 0063, 0072 : la facture termine la tâche) : tache (quoi : nouvelle, prix, accord, refus, argent, pas_recu, numero_bon, faite, relance).
// Les clés VAPID et le secret sont lus dans prive.config_push : rien de secret dans ce fichier.
import webpush from "npm:web-push@3.6.7";
import postgres from "npm:postgres@3.4.5";

const sql = postgres(Deno.env.get("SUPABASE_DB_URL")!, { prepare: false, max: 2, idle_timeout: 20 });
const prenom = (n: string) => (n || "").trim().split(/\s+/)[0] || "Équipe";
const milliers = (n: number) => String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const ROLE: Record<string, string> = { admin: "Direction", gerant: "Gérante", secretariat: "Secrétariat", moniteur: "Moniteur", ambassadeur: "Ambassadeur" };
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
  let p: { type?: string; quoi?: string; id?: number; profil?: string; ip?: string; jour?: string; qui?: string; note?: string | null; liste?: { type: string; texte: string }[] };
  try { p = await req.json(); } catch { return json({ erreur: "requête illisible" }, 400); }

  let roles: string[] | null = null, exclure: string | null = null, seulement: string | null = null, aussi: string | null = null;
  let mentionnes: string[] = [], auteurPrenom = "", canalNom = "";
  let note: { title: string; body: string; url: string; tag: string } | null = null;

  if (p.type === "message") {
    const [m] = await sql`select m.texte, m.canal, m.auteur, m.mentions, m.fichier, c.nom as canal_nom, c.roles, pr.nom as auteur_nom, pr.role as auteur_role
                            from public.messages m join public.canaux c on c.id = m.canal join public.profils pr on pr.id = m.auteur where m.id = ${p.id ?? 0}`;
    if (!m) return json({ envoyes: 0, raison: "message introuvable" });
    roles = m.roles; exclure = m.auteur; mentionnes = m.mentions || [];
    const corpsTexte = (m.fichier ? (String(m.fichier.type || "").startsWith("audio/") ? "Message vocal" : String(m.fichier.type || "").startsWith("image/") ? "Photo" : String(m.fichier.type || "").startsWith("video/") ? "Vidéo" : "Fichier : " + (m.fichier.nom || "Fichier")) + (m.texte && m.texte !== m.fichier.nom ? " · " : "") : "") + (m.texte && (!m.fichier || m.texte !== m.fichier.nom) ? m.texte : "");
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
    note = { title: "Dépense à accorder", body: corps.length > 180 ? corps.slice(0, 177) + "…" : corps, url: "/equipe/?gerance=demandes", tag: "dem-" + p.id };
  } else if (p.type === "demande_equipe") {
    const [d] = await sql`select d.montant, d.nature, d.texte, pr.role from public.demandes d left join public.profils pr on pr.id = d.auteur where d.id = ${p.id ?? 0}`;
    if (!d) return json({ envoyes: 0, raison: "demande introuvable" });
    roles = ["gerant"];
    const qui = d.role === "moniteur" ? "Moniteur" : d.role === "secretariat" ? "Secrétariat" : "Équipe";
    const corps = (d.montant ? milliers(d.montant) + " F · " : "") + d.texte;
    note = { title: qui + " · " + (d.nature === "Carburant" ? "Essence en plus" : "Dépense"), body: corps.length > 180 ? corps.slice(0, 177) + "…" : corps, url: "/equipe/?gerance=demandes", tag: "dem-" + p.id };
  } else if (p.type === "demande_reponse") {
    const [d] = await sql`select type, statut, reponse, auteur from public.demandes where id = ${p.id ?? 0}`;
    if (!d) return json({ envoyes: 0, raison: "demande introuvable" });
    seulement = d.auteur;
    note = { title: (d.statut === "accordee" ? "Accordé · " : "Refusé · ") + d.type, body: d.reponse || (d.statut === "accordee" ? "C'est accordé." : "Ce n'est pas accordé."), url: "/equipe/", tag: "dem-" + p.id };
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
  } else if (p.type === "entretien") {
    const l = Array.isArray(p.liste) ? p.liste : [];
    if (!l.length) return json({ envoyes: 0, raison: "rien à prévoir" });
    roles = ["gerant", "secretariat"];
    const corps = l.map((x) => x.type + " (" + x.texte + ")").join(" · ") + ". Préviens la mécanicienne : Mécanique → Prévenir.";
    note = { title: "Samedi : entretien de la voiture", body: corps.length > 180 ? corps.slice(0, 177) + "…" : corps, url: "/equipe/?onglet=mec", tag: "entretien" };
  } else if (p.type === "annulation") {
    const [r] = await sql`select numero, eleve_nom, montant, annul_dem_motif from public.paiements where id = ${p.id ?? 0}`;
    if (!r) return json({ envoyes: 0, raison: "reçu introuvable" });
    roles = ["gerant"];
    const corps = "Reçu n° " + r.numero + " · " + r.eleve_nom + " · " + milliers(r.montant) + " F. Raison : " + (r.annul_dem_motif || "");
    note = { title: "Annulation de reçu à confirmer", body: corps.length > 180 ? corps.slice(0, 177) + "…" : corps, url: "/equipe/?gerance=recus", tag: "annul-" + p.id };
  } else if (p.type === "annulation_reponse") {
    const [r] = await sql`select numero, eleve_nom, annule, annul_refus_motif, annul_dem_par from public.paiements where id = ${p.id ?? 0}`;
    if (!r || !r.annul_dem_par) return json({ envoyes: 0, raison: "reçu introuvable" });
    seulement = r.annul_dem_par;
    note = { title: r.annule ? "Reçu annulé · " + r.numero : "Annulation refusée · " + r.numero, body: r.annule ? r.eleve_nom + " : la gérante a confirmé. Refais le bon reçu." : r.eleve_nom + " : le reçu reste valable." + (r.annul_refus_motif ? " " + r.annul_refus_motif : ""), url: "/equipe/", tag: "annul-" + p.id };
  } else if (p.type === "tache") {
    const [t] = await sql`select t.titre, t.carburant, t.montant, t.paye_montant, t.paye_moyen, t.pas_recu_note, t.accord_note, t.par, t.pour, pp.role as pour_role, pa.role as par_role
                            from public.taches t join public.profils pp on pp.id = t.pour join public.profils pa on pa.id = t.par where t.id = ${p.id ?? 0}`;
    if (!t) return json({ envoyes: 0, raison: "tâche introuvable" });
    const court = (x: string) => (x.length > 180 ? x.slice(0, 177) + "…" : x), url = "/equipe/?onglet=taf", tag = "tache-" + p.id, qui = ROLE[t.pour_role] || "Équipe";
    if (p.quoi === "nouvelle") { seulement = t.pour; note = { title: "Nouvelle tâche · " + (t.par_role === "admin" ? "de la direction" : t.par_role === "gerant" ? "de la gérante" : "du " + (ROLE[t.par_role] || "équipe").toLowerCase()), body: court(t.titre), url, tag }; }
    else if (p.quoi === "prix") { roles = ["gerant"]; note = { title: "Prix à trouver", body: court(t.titre + " · Trouve le prix et le devis, puis envoie-les à la direction."), url, tag }; }
    else if (p.quoi === "accord") { roles = ["admin"]; note = { title: "Prix trouvé : " + milliers(t.montant) + " F", body: court(t.titre + " · Accorde ou refuse."), url, tag }; }
    else if (p.quoi === "refus") { roles = ["gerant"]; note = { title: "Refusé par la direction", body: court(t.titre + (t.accord_note ? " · " + t.accord_note : "")), url, tag }; }
    else if (p.quoi === "argent") { seulement = t.pour; note = { title: "Argent envoyé : " + milliers(t.paye_montant) + " F", body: court(t.titre + (t.carburant ? " · Fais le plein, puis touche « Fait »." : " · Une fois fait (achat, travaux…), ajoute la facture : c'est terminé.")), url, tag }; }
    else if (p.quoi === "pas_recu") { roles = ["admin"]; note = { title: "Argent pas reçu · " + qui, body: court(t.titre + (t.pas_recu_note ? " · " + t.pas_recu_note : "")), url, tag }; }
    else if (p.quoi === "faite") { seulement = t.par; note = { title: "Tâche faite · " + qui, body: court(t.titre), url, tag }; }
    else if (p.quoi === "numero_bon") { seulement = t.pour; note = { title: "L'argent est parti vers ton numéro", body: court(t.titre + " · Regarde ton solde et ton historique Mixx (le SMS n'arrive pas toujours), puis ajoute la facture une fois fait."), url, tag }; }
    else if (p.quoi === "relance") { roles = ["admin"]; aussi = t.pour; note = { title: "Facture attendue · " + qui, body: court(t.titre + " · L'argent est parti il y a 3 jours : ajoute la facture ou le ticket dans « À faire »."), url, tag }; }
    else return json({ erreur: "tâche : quoi inconnu" }, 400);
  } else if (p.type === "agence") {
    // Planning (0080) : la veille, rappel à la personne qui tient l'agence à la place du secrétariat
    if (!p.qui || !["gerant", "admin"].includes(p.qui) || !p.jour) return json({ envoyes: 0, raison: "rien à rappeler" });
    roles = [p.qui];
    const j = new Date(p.jour + "T12:00:00Z"), jour = j.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
    const sam = j.getUTCDay() === 6;
    note = { title: "Demain, tu tiens l'agence", body: jour.replace(/^./, (c) => c.toUpperCase()) + " : " + (p.note ? p.note : "le secrétariat a cours") + ". Agence " + (sam ? "8 h – 12 h, puis l'atelier jusqu'à 17 h." : "8 h – 12 h 30 et 14 h 30 – 18 h."), url: "/equipe/?onglet=plan", tag: "agence-" + p.jour };
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
