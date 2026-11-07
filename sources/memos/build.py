# Mémos de l'équipe SODAF (source). Construit memos.html (une page A4 par rôle), puis render.py en fait les PDF et les images.
# Mis à jour le 7 nov. 2026 (3 mémos : secrétariat, moniteur, ambassadeurs). Pour changer un texte : modifie ce fichier, puis lance  python3 build.py && python3 render.py
import html, pathlib
ICI = pathlib.Path(__file__).parent
LOGO = (ICI / "logo.svg.html").read_text(encoding="utf-8")
MOIS = "novembre 2026"

def e(t):  # texte simple, avec **gras**
    t = html.escape(t, quote=False)
    parts = t.split("**")
    return "".join(("<b>" + p + "</b>") if i % 2 else p for i, p in enumerate(parts))

PRIX = [("Formation complète", "55 000 F"), ("Formule rapide", "35 000 F"), ("Tarif étudiant", "30 000 F"),
        ("Formation privée", "85 000 F"), ("Remise à niveau", "25 000 F"),
        ("Code seul", "25 000 F"), ("Séance en plus", "3 000 F"), ("Dépôt d'examen", "35 000 F")]
PRIX_NOTE = ("Inscription **5 000 F** pour toutes les formules (remise à niveau : comprise ; gagnant du tirage : offerte). "
             "Paiement en 2 fois : la moitié, puis le reste dès que possible. **Prix fixes** : réductions seulement pour l'étudiant et le tirage.")

def prix():
    cells = "".join('<div class="px"><span>%s</span><b>%s</b></div>' % (e(a), e(b)) for a, b in PRIX)
    return '<div class="sec"><h3>Les prix</h3><div class="pxs">%s</div><p class="small">%s</p></div>' % (cells, e(PRIX_NOTE))

def etapes(titre, items):
    lis = "".join('<li><i>%d</i><div><b class="t">%s</b><p>%s</p></div></li>' % (k + 1, e(t), e(d)) for k, (t, d) in enumerate(items))
    return '<div class="sec"><h3>%s</h3><ol class="st">%s</ol></div>' % (e(titre), lis)

def lignes(titre, items):
    rows = "".join('<div class="ln"><span>%s</span><p>%s</p></div>' % (e(a), e(b)) for a, b in items)
    return '<div class="sec"><h3>%s</h3><div class="lns">%s</div></div>' % (e(titre), rows)

def puces(titre, items, cls=""):
    lis = "".join("<li>%s</li>" % e(t) for t in items)
    return '<div class="sec %s"><h3>%s</h3><ul class="pc">%s</ul></div>' % (cls, e(titre), lis)


def semaine(titre, lignes_, note=""):
    jours = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"]
    th = "<tr><th></th>" + "".join("<th>%s</th>" % j for j in jours) + "</tr>"
    tr = "".join("<tr><td class=\"h\">%s</td>%s</tr>" % (e(h), "".join("<td class=\"%s\">%s</td>" % (("c" if v.startswith("Code") or v.startswith("Rattrapage du code") else "v" if v.startswith("Conduite") or v.startswith("Rattrapages") else "x"), e(v)) for v in vals)) for h, vals in lignes_)
    return '<div class="sec"><h3>%s</h3><table class="wk">%s%s</table>%s</div>' % (e(titre), th, tr, ('<p class="small">%s</p>' % e(note)) if note else "")

def cartes(titre, items):
    cs = "".join('<div class="cd"><b>%s</b><p>%s</p></div>' % (e(a), e(b)) for a, b in items)
    return '<div class="sec"><h3>%s</h3><div class="cds">%s</div></div>' % (e(titre), cs)

def regle(t):
    return '<div class="rg">%s</div>' % e(t)

def page(role, titre, intro, gauche, droite, bas=""):
    return f'''<section class="page">
<header><div class="lg">{LOGO}<div class="ae">Auto-école<br>Togo</div></div>
<div class="hr"><div class="k">Mémo · {e(role)}</div><div class="s">Espace équipe : autosodaf.com/equipe · garde ce mémo à côté de toi</div></div></header>
<h1>{e(titre)}</h1><p class="intro">{e(intro)}</p>
<div class="cols"><div class="col">{gauche}</div><div class="col">{droite}</div></div>
{bas}
<footer><span>SODAF Auto-École · 412 Avenue Akei, Tokoin Tamé, en face de la caisse · +228 72 54 41 66</span><span>Mémo {e(role.lower())} · {MOIS}</span></footer>
</section>'''

REGLES = ("**Les règles de tous.** Tout bouton qui enregistre ou envoie se confirme en **deux touches**. Rien ne se supprime. "
          "Au client, on dit « **examen du permis** » (dossier déposé à SOTOPLA). Paiement : espèces à l'agence ou **Mixx by Yas** (code marchand 1492996, ADM CORE), toujours avec un reçu. "
          "Ton mot de passe ne se donne à personne.")

# ---------------------------------------------------------------- Secrétariat
SEC = page("Secrétariat", "Le secrétariat, étape par étape",
  "Ton espace Secrétariat s'ouvre sur Accueil client. L'outil te dit quoi faire et les messages WhatsApp sont déjà écrits : tu vérifies, puis tu envoies.",
  lignes("Ta journée", [
    ("7 h 30", "**À faire**, puis les **fiches papier** d'hier : appelle chacun."),
    ("Un client au bureau", "**Accueil client** → **Ouvrir l'écran client** (la présentation), puis **Nouvelle pré-inscription**."),
    ("Un client sur WhatsApp", "Appelle-le tout de suite : **Client venu de WhatsApp · Script d'appel**."),
    ("L'après-midi", "**Planning conduite** : **Rappel de la veille** pour les séances de demain."),
    ("Le samedi", "Recopie la fiche de la mécanicienne dans **Mécanique**. Agence jusqu'à 17 h."),
  ]) +
  etapes("Un élève, de A à Z", [
    ("Les appels", "Pré-inscrit du site : **Envoyer l'accueil**. Appelle avec le script : les prix, puis « commencer avec 5 000 F ». Il hésite ? Pré-inscris-le quand même pendant l'appel."),
    ("Le lien d'inscription", "**Envoyer le lien d'inscription** : il choisit sa formule et combien il paie. Relance tous les 5 jours (4 au plus), **puis appelle-le**."),
    ("Le reçu", "Il paie en espèces : **Formation payée ? Faire le reçu**, puis envoie-le. 5 000 F = inscrit, le code en ligne s'ouvre. La moitié = code en salle. Tout = conduite."),
    ("Le code", "Il reçoit tout seul une place dans un groupe de 6 : **Envoyer ses horaires**. Cours raté : il le revoit au tour suivant du programme. Il préfère le mercredi ? Choisis le **Groupe C** dans sa fiche."),
    ("Le solde", "À 3 semaines dans son groupe : rappel en rouge, en haut. À 1 mois sans paiement : place au code suspendue. Pas de conduite avant le solde."),
    ("La conduite", "Feu vert après les cours 1 à 9. Fiche → **Conduite** → **Réserver une séance** (3 par semaine au plus), puis **Envoyer ses séances**."),
    ("L'examen", "**Passer à l'examen** (message des papiers). Dossier complet + 35 000 F : reçu. Bordereau signé, **Lot déposé**, puis **Permis obtenu** ou **À repasser**."),
  ]),
  puces("Le planning conduite", [
    "Séances de 2 h, 4 places : **7 h 30**, **10 h** (lundi → samedi), **15 h 45** (lundi → vendredi).",
    "Beaucoup d'inscriptions ? Regarde d'abord l'onglet **Places libres**.",
    "Il prévient **la veille avant 18 h** : remets sa place sur « Place libre ». Rien n'est compté.",
    "Pas venu sans prévenir : le moniteur met **Absent**. La séance n'est pas comptée : il en réserve une autre. Au 4e : conduite bloquée (3 000 F).",
    "**Formation privée** : 1 h, seul avec le moniteur, sur une séance **vide**. Il prend 2 places.",
    "**Séance à l'unité** : client non inscrit, 1 h, **10 000 F** payés avant de monter.",
  ]) +
  puces("L'argent", [
    "Espèces ou **Mixx by Yas**. **Un reçu pour chaque franc** encaissé.",
    "Reçu faux : **Demander l'annulation** (la direction décide).",
    "Formule ou prix : tu ne changes jamais. Fiche → « Le client s'est trompé de formule ? ».",
    "Besoin d'argent (voiture, agence) : **Demandes à la direction**. Pas le prix ? Coche **Montant inconnu**, puis trouve le prix et le devis.",
    "**Petits frais** (taxi-moto, recharge, petit achat, **2 000 F au plus**) : Gestion → **Petits frais**, le jour même, en écrivant ce que c'est. Plus cher : une demande.",
  ]) +
  puces("Les cas particuliers", [
    "**Étudiant** : carte d'étudiant de l'année + carte d'identité. Sinon, tarif normal.",
    "**Corps habillés** : même prix que tout le monde. Conseille gentiment de venir en civil si possible (pas obligé).",
    "**Formation privée** : 85 000 F, 1 h seul avec le moniteur, code en particulier.",
    "**Dimanche** (seulement s'il ne peut venir que ce jour-là) : **formation complète ou privée** uniquement. Groupe F au code (14 h 30 et 18 h) et conduite. On ne l'annonce pas.",
  ]),
  prix() + regle(REGLES))

# ---------------------------------------------------------------- Gérante
GER = page("Gérante", "La gérante, au quotidien",
  "Tu fais le lien entre l'équipe et la direction. Tu travailles à distance, et tu tiens l'agence le mercredi et le vendredi des semaines de cours du secrétariat.",
  lignes("Ta semaine", [
    ("Chaque jour", "**À faire** (prix à trouver), **Messages**, **Gérance → Dépenses → Demandes**."),
    ("Mer. et ven.", "Semaines de cours du secrétariat : tu tiens l'agence avec **ton** compte (onglet Secrétariat). Voir l'onglet **Planning**."),
    ("Week-end", "**Rapport de la semaine** : ajoute tes remarques, **Envoyer le rapport**."),
    ("Le 1er du mois", "**Tirage au sort** : live TikTok dès 19 h, tirage à 20 h."),
  ]) +
  etapes("Tes outils", [
    ("Demandes de l'équipe", "**Transférer** à la direction ou **Refuser**. « Montant inconnu » : trouve le prix et le devis, **Enregistrer le prix**, puis transfère. Tu peux **Proposer un achat**."),
    ("Carburant et petits frais", "Essence : 2 000 F par séance prévue, 35 000 F par semaine au plus. « Essence en plus » arrive chez toi. Petits frais (2 000 F au plus) : le secrétariat les note, tu les vois. Au-dessus : une demande."),
    ("Reçus", "Demandes d'annulation du secrétariat : **Confirmer l'annulation** ou **Refuser l'annulation**. Toi seule (et la direction) annules un reçu."),
    ("Fiche d'un élève", "**Corriger la formule** après avoir appelé le client (carte d'étudiant ou carte professionnelle vue). **Prolonger d'un mois** quand le délai de 3 mois ne suffit pas."),
    ("Tirage au sort", "**Tirer un gagnant**, vérifie la carte d'étudiant : valide ou pas. Message au gagnant. 2 gagnants par mois."),
    ("Parrainage", "2 000 F au parrain par filleul inscrit. 3 filleuls : un t-shirt ; 5 : une séance offerte. On en parle aux élèves une fois inscrits."),
  ]),
  puces("Tu décides seule", [
    "Le prix d'une demande « montant inconnu ».",
    "L'annulation d'un reçu faux.",
    "Les tâches sans argent pour l'équipe.",
    "Corriger une formule, prolonger un délai d'un mois.",
  ]) +
  puces("La direction décide", [
    "Toute dépense : elle **accorde et paie** en un geste, puis la facture termine la tâche.",
    "Les prix : fixes, **aucune remise**. Réductions seulement : étudiant, parrainage, tirage.",
  ]) +
  puces("Les ambassadeurs", [
    "Un ambassadeur à l'agence **chaque jour** (il amène le secrétariat le matin) : Christian lun-mer-ven, Patrick mar-jeu-sam. Deux rôles qui s'échangent chaque mois : **Relations** et **Contenu**. Leurs affiches et vidéos sont validées par la direction (Messages).",
    "**Ambassadeurs** : qui est où cette semaine, leurs missions et les **Résultats**.",
    "À vérifier : pas de gain du parrain, « examen du permis ».",
  ]) +
  puces("Les tarifs spéciaux", [
    "**Étudiant** 30 000 F : carte d'étudiant + carte d'identité.",
    "**Corps habillés** : même prix que tout le monde ; une pub faite pour eux (« votre permis à votre rythme »).",
    "**Formation privée** 85 000 F : 1 h seul en voiture, code en particulier.",
  ]),
  prix() + regle(REGLES))

# ---------------------------------------------------------------- Moniteur
MON = page("Moniteur", "Le moniteur, sur son téléphone",
  "Ouvre autosodaf.com/equipe. Ton onglet Moniteur a 5 parties : Aujourd'hui, Code en salle, Planning conduite, Essence et voiture, Mode d'emploi.",
  etapes("Un cours de code (salle de 6)", [
    ("L'appel", "Coche les présents, puis **Valider les présences** : le cours compte."),
    ("La leçon", "Mode classe → **Leçon**. Le thème du jour s'affiche (12 cours en boucle)."),
    ("À la fin", "Mode classe → **Examen** : le quiz d'examen du cours (questions SOTOPLA)."),
  ]) +
  lignes("Les horaires du code", [
    ("Groupe A", "lundi et jeudi, 14 h 30"), ("Groupe B", "mardi et vendredi, 14 h 30"), ("Groupe C", "mercredi, 14 h 30 (1er cours) et 18 h (2e cours)"),
    ("Groupe D", "lundi et jeudi, 18 h (soir)"), ("Groupe E", "mardi et vendredi, 18 h (soir)"),
  ]) +
  puces("Essence et voiture", [
    "**Ajouter un plein** : montant, compteur, photo du compteur. Toi seul ajoutes les pleins.",
    "Budget dépassé : **Demander de l'essence en plus** (la direction décide).",
    "Un problème avec la voiture : **Prévenir le secrétariat**. Il appelle la mécanicienne.",
    "Samedi 13 h 30 : la mécanicienne contrôle la voiture.",
  ]) +
  puces("Mercredi et vendredi sans secrétariat", [
    "Une semaine sur deux, l'accueil est fermé. Un visiteur : donne-lui la **fiche de pré-inscription** papier. **Pas d'argent.** Laisse la fiche au bureau.",
  ]),
  etapes("Une séance de conduite (2 h, 4 places)", [
    ("Avant", "**Aujourd'hui** : tes élèves, leur photo et l'ordre de passage. Contrôle rapide de la voiture."),
    ("Pendant", "Partage le temps selon qui est là. Seul, un élève conduit 30 min à 1 h selon son niveau."),
    ("Après", "**Fait** ou **Absent** pour chacun, le jour même. Absent = pas venu sans prévenir."),
    ("À la 10e séance", "L'évaluation s'affiche : **Prêt pour l'examen** ou **Séances en plus**."),
  ]) +
  lignes("Les horaires de conduite", [
    ("7 h 30 – 9 h 30", "lundi → samedi"), ("10 h – 12 h", "lundi → samedi"),
    ("15 h 45 – 17 h 45", "lundi → vendredi"),
    ("12 h – 14 h 30", "repos (heures chaudes)"),
  ]) +
  puces("Les cas spéciaux", [
    "**Formation privée** : 1 h, seul avec toi. La séance ne prend pas d'élèves en groupe. Ses 12 cours de code sont en particulier : après chacun, **Noter ce cours** (Code en salle).",
    "**Séance à l'unité** : client non inscrit, 1 h. Il a payé avant de monter (reçu).",
    "**Feu vert** : un élève conduit après les cours 1 à 9 en salle (sauf remise à niveau et privée).",
  ]),
  semaine("Ta semaine", [
    ("7 h 30 – 9 h 30", ["Conduite"] * 6),
    ("10 h – 12 h", ["Conduite"] * 6),
    ("14 h 30", ["Code · groupe A", "Code · groupe B", "Code · groupe C (1er cours)", "Code · groupe A", "Code · groupe B", "Voiture : contrôle et atelier"]),
    ("15 h 45 – 17 h 45", ["Conduite", "Conduite", "Conduite", "Conduite", "Conduite", "—"]),
    ("18 h – 19 h", ["Code · groupe D", "Code · groupe E", "Code · groupe C (2e cours)", "Code · groupe D", "Code · groupe E", "—"]),
  ], "Un groupe sans élève n'a pas cours : ta page Aujourd'hui montre seulement ce qui a lieu. Midi – 14 h 30 : repos.") +
  regle("**À retenir.** Note chaque cours et chaque séance **le jour même** : c'est ce qui permet de suivre les élèves. "
        "Messages : écris @ puis la personne, ou SO12 pour ouvrir la fiche d'un élève. Ton mot de passe ne se donne à personne."))

# ---------------------------------------------------------------- Ambassadeur
AMB = page("Ambassadeur", "Les ambassadeurs, l'image de SODAF",
  "Deux ambassadeurs, deux rôles qui s'échangent **chaque mois, le 1er lundi** : **Relations** (les gens, les affiches, le tirage) et **Contenu** (les vidéos, avec le **téléphone SODAF**) ; le **PC reste à l'agence**, partagé. Tu ne vois ni les élèves ni l'argent.",
  lignes("Ta semaine", [
    ("À l'agence", "**Christian** lun, mer, ven ; **Patrick** mar, jeu, sam. Tu **amènes le secrétariat**, puis la pub auprès des passants."),
    ("Journée terrain", "**À deux, mer + ven une semaine sur deux** (le secrétariat a cours) : le matin les commerces, l'après-midi les universités."),
    ("1er lundi du mois", "Vous **changez de rôle** et le **téléphone SODAF** change de main : 15 minutes de relais."),
    ("1er samedi du mois", "**Tirage au sort** à 20 h, filmé pour TikTok : **les deux sont là**."),
    ("Chaque semaine", "Au moins **une publication chacun** sur **@autoecole.sodaf.tg**."),
  ]) +
  etapes("Chaque publication", [
    ("Préparer", "Relations : l'affiche (Canva, sur le PC). Contenu : la vidéo (Osmo, CapCut)."),
    ("Faire valider", "Envoie-la à la **direction dans Messages**. Elle répond « c'est bon » ou « change ça »."),
    ("Publier", "Toi-même, sur **TikTok** (et Instagram). Garde l'original."),
    ("Noter", "**Ambassadeurs → Affiches à publier** ou **Vidéos à publier** : le fichier et le lien."),
  ]) +
  puces("Une personne intéressée", [
    "Réponds poliment, puis donne le **72 54 41 66** (appel ou WhatsApp) ou **autosodaf.com**.",
    "Le secrétariat l'appelle. Il doit dire qu'il vient de toi : ça compte dans tes résultats.",
  ]),
  puces("Ce qu'on dit", [
    "**Commence avec 5 000 F** : le code en ligne s'ouvre, puis 2 mois pour payer la formation.",
    "Petits groupes : **6 élèves maximum** en salle, **4 maximum** en voiture, double pédales.",
    "Code **l'après-midi ou le soir** (18 h pour ceux qui travaillent). Conduite à ton rythme.",
    "Étudiants **30 000 F**. Corps habillés : « votre permis, à votre rythme » (gardes, missions).",
    "Le tirage au sort étudiant, le **premier samedi du mois** : la vidéo des gagnants sur TikTok.",
  ]) +
  puces("Les messages TikTok", [
    "Contenu répond aux **commentaires et messages chaque jour**, sur le téléphone SODAF, **dans l'heure** (alertes activées).",
  ]) +
  puces("Tes résultats", [
    "**Ambassadeurs → Résultats** : la semaine, le mois et l'historique de vos publications.",
    "**À faire** : les tâches de la direction. Touche « C'est fait » quand c'est fait.",
  ]),
  cartes("Idées de vidéos qui marchent", [
    ("Le site en action", "Un téléphone ouvre autosodaf.com : un cours, le quiz, le dossier. À épingler en haut du profil."),
    ("La question du jour", "Un panneau ou une priorité : « Tu sais qui passe ? » Réponse à la fin."),
    ("Le premier volant", "Un élève (d'accord pour être filmé) raconte sa première séance."),
    ("L'atelier du samedi", "La mécanicienne montre un geste simple : l'huile, les pneus, les phares."),
    ("Il a son permis", "Photo ou petit mot d'un élève qui vient d'avoir son permis (avec son accord)."),
  ]) +
  prix() + regle(REGLES))

CSS = (ICI / "memos.css").read_text(encoding="utf-8")
doc = ('<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Mémos de l\'équipe SODAF</title>'
       '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800&family=Figtree:wght@400;500;600;700&display=swap">'
       '<style>' + CSS + '</style></head><body>' + SEC + MON + AMB + '</body></html>')  # 5 nov. : plus de gérante depuis le 30 oct. (mémo retiré)
(ICI / "memos.html").write_text(doc, encoding="utf-8")
print("memos.html : 3 pages")
