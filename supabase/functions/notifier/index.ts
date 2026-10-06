// SODAF · Fonction « notifier » : envoie les notifications sur les téléphones de l'équipe.
// Appelée uniquement par la base (déclencheurs de la migration 0028) avec un secret partagé.
// Types : message (canal), preinscription (formulaire du site), inscription (finalisée en ligne), test (bouton « Tester »).
// Les clés VAPID et le secret sont lus dans prive.config_push : rien de secret dans ce fichier.
import webpush from "npm:web-push@3.6.7";
import postgres from "npm:postgres@3.4.5";

const sql = postgres(Deno.env.get("SUPABASE_DB_URL")!, { prepare: false, max: 2, idle_timeout: 20 });
const prenom = (n: string) => (n || "").trim().split(/\s+/)[0] || "Équipe";
const milliers = (n: number) => String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const ROLE: Record<string, string> = { admin: "Direction", secretariat: "Secrétariat", moniteur: "Moniteur" };
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ ok: true });
  const cfg: Record<string, string> = Object.fromEntries((await sql`select cle, valeur from prive.config_push`).map((r) => [r.cle, r.valeur]));
  if (!cfg.secret_fonction || req.headers.get("x-sodaf-secret") !== cfg.secret_fonction) return json({ erreur: "refusé" }, 401);
  let p: { type?: string; id?: number; profil?: string };
  try { p = await req.json(); } catch { return json({ erreur: "requête illisible" }, 400); }

  let roles: string[] | null = null, exclure: string | null = null, seulement: string | null = null;
  let note: { title: string; body: string; url: string; tag: string } | null = null;

  if (p.type === "message") {
    const [m] = await sql`select m.texte, m.canal, m.auteur, c.nom as canal_nom, c.roles, pr.nom as auteur_nom, pr.role as auteur_role
                            from public.messages m join public.canaux c on c.id = m.canal join public.profils pr on pr.id = m.auteur where m.id = ${p.id ?? 0}`;
    if (!m) return json({ envoyes: 0, raison: "message introuvable" });
    roles = m.roles; exclure = m.auteur;
    note = { title: prenom(m.auteur_nom) + " (" + (ROLE[m.auteur_role] || "Équipe") + ") · " + m.canal_nom, body: m.texte.length > 180 ? m.texte.slice(0, 177) + "…" : m.texte, url: "/equipe/?canal=" + m.canal, tag: "canal-" + m.canal };
  } else if (p.type === "preinscription") {
    const [e] = await sql`select id, nom, formation, source from public.eleves where id = ${p.id ?? 0}`;
    if (!e || e.source !== "site") return json({ envoyes: 0, raison: "pas une pré-inscription du site" });
    roles = ["admin", "secretariat"];
    note = { title: "Nouvelle pré-inscription", body: e.nom + (e.formation ? " · " + e.formation : "") + " · à accueillir (SO" + e.id + ")", url: "/equipe/?eleve=" + e.id, tag: "eleve-" + e.id };
  } else if (p.type === "inscription") {
    const [w] = await sql`select eleve_id, mode, a_payer, prenoms, nom, mixx_ref from public.inscriptions_web where id = ${p.id ?? 0}`;
    if (!w) return json({ envoyes: 0, raison: "inscription introuvable" });
    roles = ["admin", "secretariat"];
    const qui = ((w.prenoms || "") + " " + (w.nom || "")).trim();
    note = w.mode === "mixx"
      ? { title: "Paiement Mixx à vérifier", body: qui + " · " + milliers(w.a_payer) + " F" + (w.mixx_ref ? " · réf. " + w.mixx_ref : "") + " (SO" + w.eleve_id + ")", url: "/equipe/?eleve=" + w.eleve_id, tag: "eleve-" + w.eleve_id }
      : { title: "Inscription finalisée", body: qui + " viendra payer " + milliers(w.a_payer) + " F à l'agence (SO" + w.eleve_id + ")", url: "/equipe/?eleve=" + w.eleve_id, tag: "eleve-" + w.eleve_id };
  } else if (p.type === "test") {
    seulement = p.profil || null;
    note = { title: "Notifications SODAF activées", body: "Tu recevras ici les messages de l'équipe et les nouvelles inscriptions.", url: "/equipe/?canal=general", tag: "test" };
  } else return json({ erreur: "type inconnu" }, 400);

  const abos = await sql`select s.id, s.endpoint, s.p256dh, s.auth, s.profil, pr.role from public.push_abonnements s join public.profils pr on pr.id = s.profil where pr.actif`; // comptes désactivés : plus de notifications
  const cibles = abos.filter((a) => (seulement ? a.profil === seulement : (!roles || roles.includes(a.role)) && a.profil !== exclure));
  webpush.setVapidDetails(cfg.vapid_sujet, cfg.vapid_public, cfg.vapid_private);
  const corps = JSON.stringify(note);
  let envoyes = 0, echecs = 0, retires = 0;
  await Promise.all(cibles.map(async (a) => {
    try {
      await webpush.sendNotification({ endpoint: a.endpoint, keys: { p256dh: a.p256dh, auth: a.auth } }, corps, { TTL: 86400, urgency: "high" });
      envoyes++;
    } catch (e) {
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) { await sql`delete from public.push_abonnements where id = ${a.id}`; retires++; } // téléphone désabonné : on retire l'abonnement technique
      else { echecs++; console.error("envoi", code, String((e as Error).message || e).slice(0, 200)); }
    }
  }));
  return json({ type: p.type, cibles: cibles.length, envoyes, echecs, retires });
});
