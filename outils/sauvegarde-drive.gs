/**
 * SODAF Auto-École · Sauvegarde automatique Supabase → Google Drive
 * ----------------------------------------------------------------
 * Tourne dans ton compte Google (Google Apps Script), sans Claude, gratuitement.
 * Chaque dimanche matin : lit toute la base Supabase et crée un Google Sheet daté
 * (un onglet par table + un onglet Résumé) dans le dossier « Sauvegardes base de données ».
 *
 * Il ne modifie ni ne supprime jamais rien, ni dans Supabase ni dans Drive.
 *
 * Réglages à faire une seule fois (Paramètres du projet → Propriétés du script) :
 *   SODAF_EMAIL         = l'e-mail du compte de sauvegarde créé dans Supabase
 *   SODAF_MOT_DE_PASSE  = son mot de passe
 * Puis lancer une fois la fonction « installer ».
 */

const SB_URL = "https://fpfmpiodbznjofxjfyjf.supabase.co";
const SB_KEY = "sb_publishable_Up-XDNsPpfOsMR00Owu6wQ_FCFCwmwP"; // clé publique (déjà visible sur le site)
const DOSSIER_ID = "17NT22STPtnnJdBQ8CF5jLCk3v2rEFsbu";          // « Sauvegardes base de données »
const MAIL_SI_SUCCES = true;                                      // false = mail seulement en cas d'échec

const NOMS = {
  eleves: "Élèves", suivi: "Suivi des appels", inscriptions_web: "Inscriptions en ligne",
  paiements: "Paiements", creneaux_conduite: "Créneaux conduite", seances_code: "Séances de code",
  presences: "Présences", devoir_semaines: "Devoirs semaines", devoir_resultats: "Devoirs résultats",
  jours_feries: "Jours fériés", reglages: "Réglages", profils: "Équipe"
};

/** Lance la sauvegarde (appelée automatiquement chaque dimanche). */
function sauvegarder() {
  const tz = "Africa/Lome";
  const jour = Utilities.formatDate(new Date(), tz, "yyyy-MM-dd");
  try {
    const data = lireBase_();
    const tables = data.tables || {};
    const ss = SpreadsheetApp.create("SODAF sauvegarde " + jour);
    const resume = ss.getSheets()[0];
    resume.setName("Résumé");

    const lignes = [["Table", "Lignes"]];
    Object.keys(NOMS).forEach(function (cle) {
      const rows = tables[cle] || [];
      ecrireOnglet_(ss, NOMS[cle], rows);
      lignes.push([NOMS[cle], rows.length]);
    });

    resume.getRange(1, 1, 1, 2).setValues([["Sauvegarde SODAF du " + jour, ""]]).setFontWeight("bold");
    resume.getRange(3, 1, lignes.length, 2).setValues(lignes);
    resume.getRange(3, 1, 1, 2).setFontWeight("bold");
    resume.autoResizeColumns(1, 2);

    // Range le fichier dans le dossier de sauvegarde
    DriveApp.getFileById(ss.getId()).moveTo(DriveApp.getFolderById(DOSSIER_ID));

    if (MAIL_SI_SUCCES) {
      const txt = lignes.slice(1).map(function (l) { return "• " + l[0] + " : " + l[1]; }).join("\n");
      MailApp.sendEmail(moi_(), "✅ Sauvegarde SODAF du " + jour,
        "La sauvegarde de la base SODAF est terminée.\n\n" + txt + "\n\nFichier : " + ss.getUrl());
    }
  } catch (e) {
    MailApp.sendEmail(moi_(), "⚠️ Sauvegarde SODAF du " + jour + " : ÉCHEC",
      "La sauvegarde automatique n'a pas pu se faire.\n\nErreur : " + e.message +
      "\n\nOuvre le script (script.google.com) et lance « sauvegarder » à la main pour voir le détail.");
    throw e;
  }
}

/** À lancer UNE fois : programme la sauvegarde chaque dimanche entre 6 h et 7 h. */
function installer() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === "sauvegarder") ScriptApp.deleteTrigger(t); // évite les doublons de programmation
  });
  ScriptApp.newTrigger("sauvegarder").timeBased().onWeekDay(ScriptApp.WeekDay.SUNDAY).atHour(6).create();
  lireBase_(); // vérifie tout de suite que la connexion fonctionne
  Logger.log("C'est programmé : chaque dimanche entre 6 h et 7 h. La connexion à la base fonctionne.");
}

// ---------- outils internes ----------

function lireBase_() {
  const p = PropertiesService.getScriptProperties();
  const email = p.getProperty("SODAF_EMAIL"), mdp = p.getProperty("SODAF_MOT_DE_PASSE");
  if (!email || !mdp) throw new Error("Propriétés SODAF_EMAIL et SODAF_MOT_DE_PASSE manquantes (Paramètres du projet → Propriétés du script).");

  const auth = UrlFetchApp.fetch(SB_URL + "/auth/v1/token?grant_type=password", {
    method: "post", contentType: "application/json", muteHttpExceptions: true,
    headers: { apikey: SB_KEY }, payload: JSON.stringify({ email: email, password: mdp })
  });
  if (auth.getResponseCode() !== 200) throw new Error("Connexion à Supabase refusée (" + auth.getResponseCode() + ") : vérifie l'e-mail et le mot de passe.");
  const jeton = JSON.parse(auth.getContentText()).access_token;

  const r = UrlFetchApp.fetch(SB_URL + "/rest/v1/rpc/sauvegarde_export", {
    method: "post", contentType: "application/json", muteHttpExceptions: true,
    headers: { apikey: SB_KEY, Authorization: "Bearer " + jeton }, payload: "{}"
  });
  if (r.getResponseCode() !== 200) throw new Error("Lecture de la base refusée (" + r.getResponseCode() + ") : " + r.getContentText().slice(0, 200));
  return JSON.parse(r.getContentText());
}

function ecrireOnglet_(ss, nom, rows) {
  const sh = ss.insertSheet(nom);
  if (!rows.length) { sh.getRange(1, 1).setValue("(table vide)"); return; }
  const cols = [];
  rows.forEach(function (o) { Object.keys(o).forEach(function (k) { if (cols.indexOf(k) < 0) cols.push(k); }); });
  const vals = [cols].concat(rows.map(function (o) { return cols.map(function (k) { return cellule_(o[k]); }); }));
  const rg = sh.getRange(1, 1, vals.length, cols.length);
  rg.setNumberFormat("@");          // tout en texte : les numéros (+228…, 0012) restent intacts
  rg.setValues(vals);
  sh.getRange(1, 1, 1, cols.length).setFontWeight("bold");
  sh.setFrozenRows(1);
}

function cellule_(v) {
  if (v === null || v === undefined) return "";
  if (typeof v === "object") v = JSON.stringify(v);
  v = String(v);
  return /^[=+\-@]/.test(v) ? "'" + v : v; // jamais interprété comme une formule
}

function moi_() { return Session.getEffectiveUser().getEmail(); }
