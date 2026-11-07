# Fiche « Claude pour SODAF » (7 nov. 2026) : pour les ambassadeurs, comment se servir de Claude (compte gratuit chacun) pour les affiches, vidéos, textes.
# python3 build.py && python3 build.py render  ->  entreprise/fiche-claude-ambassadeurs-sodaf.pdf (+ jpg page 1, aperçu)
import pathlib, sys, re, html as H
d = pathlib.Path(__file__).parent
F = "../affiche-tirage-14nov/"
def e(t): return re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", H.escape(t, quote=False))
CONTEXTE = ("Tu m'aides pour la communication de SODAF Auto-École, une auto-école à Lomé (Togo) : 412 Avenue Akei, Tokoin Tamé, en face de la caisse. "
  "Téléphone et WhatsApp : 72 54 41 66. Site : autosodaf.com. TikTok : @autoecole.sodaf.tg.\n"
  "Prix fixes : formation complète 55 000 F ; formule rapide 35 000 F ; tarif étudiant 30 000 F ; formation privée 85 000 F ; remise à niveau 25 000 F ; code seul 25 000 F. "
  "Inscription 5 000 F. On peut commencer avec 5 000 F : le code en ligne s'ouvre, puis 2 mois pour payer la formation.\n"
  "Nos points forts : 6 élèves maximum en salle, 4 maximum par voiture, double pédales ; code l'après-midi ou le soir ; conduite à son rythme ; cours et quiz sur le site.\n"
  "Règles : toujours écrire « SODAF Auto-École » ; ne jamais parler de l'État ; pas de fausse date limite ni de « dernières places » ; pas de prix inventé ni de promotion ; "
  "ne jamais annoncer le dimanche ; ne pas parler des gains du parrainage ; le tirage au sort : les gagnants sont publiés sur notre TikTok ; on dit « examen du permis ».\n"
  "Ton : simple et chaleureux, le français de tous les jours au Togo, des phrases courtes.")
DEMANDES = [
  ("Une affiche", "Fais-moi le texte d'une affiche pour [les étudiants]. Un titre de 5 mots maximum, une phrase, 3 points forts, et à la fin : WhatsApp 72 54 41 66. Puis dis-moi comment la placer dans Canva, en format TikTok 1080 × 1920."),
  ("Une vidéo TikTok", "Écris le script d'une vidéo TikTok de 30 secondes sur [la première séance de conduite]. D'abord l'accroche des 3 premières secondes, puis plan par plan : ce qu'on filme avec l'Osmo, ce qu'on dit, le texte à l'écran."),
  ("Le texte de publication", "Écris le texte de publication TikTok pour cette vidéo : [décris la vidéo]. 2 lignes maximum, une question pour faire commenter, et 5 hashtags."),
  ("Répondre à un commentaire", "Quelqu'un a commenté : « [colle le commentaire] ». Propose 2 réponses courtes et polies. S'il demande un prix, donne le prix exact et invite-le à écrire sur WhatsApp."),
  ("Les idées de la semaine", "Donne-moi 5 idées de vidéos pour cette semaine, pour [les étudiants / les commerçantes / ceux qui travaillent]. Pour chaque idée : le titre, l'accroche, où filmer."),
  ("La journée terrain", "Prépare ce que je dis en 20 secondes pour présenter SODAF à [un étudiant / une commerçante], et mes réponses aux 3 questions qu'on me pose le plus : le prix, la durée, les horaires."),
  ("Corriger un texte", "Corrige l'orthographe de ce texte sans changer le sens : [colle le texte]."),
]
VERIF = ["Les **prix** sont exacts (compare avec ton mémo).", "« **SODAF Auto-École** » et le **72 54 41 66** sont écrits sans faute.",
  "Pas de fausse urgence, pas de l'État, pas de dimanche, pas de parrainage.", "Tu as **relu** le texte en entier.",
  "Tu l'envoies à la **direction dans Messages** et tu publies seulement après « c'est bon »."]
NE_PAS = ["Claude **ne monte pas** dans CapCut et **ne publie pas** : c'est toi.", "Claude **peut se tromper** : tu vérifies toujours, surtout les prix.",
  "**Jamais de données d'élèves** dans Claude : ni nom, ni numéro, ni photo de carte.", "Ton compte est **à toi seul** : ne le prête à personne, même à l'autre ambassadeur."]
def page1():
    return f'''<section class="page">
<header><img src="{F}logo-noir.svg" alt="SODAF"><div class="ht"><b>Claude pour SODAF</b><span>Fiche des ambassadeurs · novembre 2026</span></div></header>
<h1>Ton assistant pour les affiches, les vidéos et les textes</h1>
<p class="intro">{e("Claude t'aide à écrire vite et bien : le texte d'une affiche, le script d'une vidéo, une réponse à un commentaire. **Toi**, tu crées dans Canva, tu filmes, tu montes dans CapCut, et tu fais valider par la direction.")}</p>
<div class="sec"><h3>1 · Ton compte</h3><ol class="st">
<li><i>1</i><p>{e("Va sur **claude.ai** (ou l'appli **Claude** sur le téléphone ou la tablette).")}</p></li>
<li><i>2</i><p>{e("Crée ton compte avec **ton propre Gmail**. C'est **gratuit**.")}</p></li>
<li><i>3</i><p>{e("Sur le PC de l'agence : connecte-le dans **ton** profil Chrome (Christian ou Patrick).")}</p></li>
<li><i>4</i><p>{e("Message « limite atteinte » : attends quelques heures. Si ça arrive souvent, dis-le à la direction.")}</p></li></ol></div>
<div class="sec"><h3>2 · Le texte de départ</h3><p class="small">{e("À **copier au début de chaque nouvelle conversation** : Claude connaît alors SODAF, les prix et nos règles. Il est aussi dans Documents → « Claude pour SODAF ».")}</p>
<div class="ctx">{"".join("<p>" + re.sub(r"(\d) (\d{3}) F", "\\1&nbsp;\\2&nbsp;F", H.escape(l)) + "</p>" for l in CONTEXTE.split(chr(10)))}</div></div>
<div class="duo"><div class="sec"><h3>Avant d'envoyer à la direction</h3><ul class="ck">{"".join("<li><i></i><span>" + e(t) + "</span></li>" for t in VERIF)}</ul></div>
<div class="sec"><h3>À savoir</h3><ul class="pc">{"".join("<li>" + e(t) + "</li>" for t in NE_PAS)}</ul></div></div>
<footer><span>SODAF Auto-École · 412 Avenue Akei, Tokoin Tamé, en face de la caisse · 72 54 41 66</span><span>1 / 2</span></footer></section>'''
def page2():
    cards = "".join(f'<div class="dm"><b>{e(t)}</b><p>{H.escape(p)}</p></div>' for t, p in DEMANDES)
    return f'''<section class="page">
<header><img src="{F}logo-noir.svg" alt="SODAF"><div class="ht"><b>Claude pour SODAF</b><span>Les demandes prêtes à copier</span></div></header>
<h1>Copie, remplace ce qui est entre [crochets], envoie</h1>
<p class="intro">{e("Colle d'abord le **texte de départ** (page 1), puis une de ces demandes. Pas content du résultat ? Demande simplement : « plus court », « plus drôle », « pour des commerçantes », « refais l'accroche ».")}</p>
<div class="dms">{cards}<div class="dm tip"><b>L'astuce</b><p>{H.escape("Une conversation par sujet. Pour une nouvelle affiche ou une nouvelle vidéo, ouvre une nouvelle conversation et recolle le texte de départ : Claude reste précis et tu tiens plus longtemps avant la limite.")}</p></div></div>
<footer><span>SODAF Auto-École · autosodaf.com · TikTok @autoecole.sodaf.tg</span><span>2 / 2</span></footer></section>'''
CSS = '''@font-face{font-family:"Outfit";src:url(../affiche-tirage-14nov/Outfit.ttf)}@font-face{font-family:"Figtree";src:url(../affiche-tirage-14nov/Figtree.ttf)}
@page{size:210mm 297mm;margin:0}*{box-sizing:border-box;margin:0;padding:0}
body{background:#fff;color:#14171C;font-family:Figtree;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{position:relative;width:794px;height:1123px;padding:34px 48px 26px 58px;display:flex;flex-direction:column;gap:14px;overflow:hidden;break-after:page}
.page:last-child{break-after:auto}
.page::before{content:"";position:absolute;left:0;top:0;bottom:0;width:10px;background:#F97316}
header{display:flex;justify-content:space-between;align-items:center;padding-bottom:10px;border-bottom:1.5px solid #14171C}header img{height:26px}
.ht{text-align:right}.ht b{display:block;font:800 22px/1 Outfit;text-transform:uppercase}.ht span{display:block;margin-top:4px;font:600 11px Outfit;letter-spacing:.1em;text-transform:uppercase;color:#C2410C}
h1{font:800 27px/1.12 Outfit;letter-spacing:-.01em}
.intro{font:500 13.5px/1.5 Figtree;color:#3B424B}.intro b{color:#14171C}
.sec h3{font:800 12px Outfit;letter-spacing:.12em;text-transform:uppercase;color:#4A525C;padding-bottom:6px;border-bottom:1px solid #E3E6EA;margin-bottom:8px}
.st{list-style:none;display:grid;grid-template-columns:1fr 1fr;gap:8px 18px}.st li{display:flex;gap:10px;align-items:flex-start;font:500 13px/1.4 Figtree}
.st i{flex:none;width:22px;height:22px;border-radius:50%;background:#F97316;color:#fff;display:grid;place-items:center;font:800 11.5px Outfit;font-style:normal}
.small{font:500 12.5px/1.45 Figtree;color:#3B424B;margin-bottom:8px}
.ctx{border:1.5px solid #F97316;border-radius:12px;background:#FFF7ED;padding:12px 16px;font:500 12.3px/1.5 Figtree;color:#1F2329;display:flex;flex-direction:column;gap:6px}
.duo{display:grid;grid-template-columns:1fr 1fr;gap:22px}
.ck,.pc{list-style:none;display:flex;flex-direction:column;gap:7px;font:500 12.5px/1.42 Figtree}
.ck li{display:flex;gap:9px}.ck i{flex:none;width:15px;height:15px;border:1.6px solid #14171C;border-radius:4px;margin-top:2px}
.pc li{position:relative;padding-left:14px}.pc li::before{content:"";position:absolute;left:0;top:7px;width:6px;height:6px;border-radius:50%;background:#F97316}
.dms{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.dm{border:1px solid #DDE1E6;border-radius:12px;padding:12px 14px;display:flex;flex-direction:column;gap:6px}
.dm b{font:800 14px Outfit}.dm p{font:500 12.5px/1.5 Figtree;color:#1F2329;background:#F6F7F8;border-radius:8px;padding:9px 11px}
.dm.tip{border-color:#F97316;background:#FFF7ED}.dm.tip p{background:transparent;padding:0}
footer{margin-top:auto;display:flex;justify-content:space-between;border-top:1px solid #E3E6EA;padding-top:10px;font:500 10.5px Figtree;color:#5B6470}'''
doc = f'<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Claude pour SODAF · ambassadeurs</title><style>{CSS}</style></head><body>{page1()}{page2()}</body></html>'
if len(sys.argv) > 1 and sys.argv[1] == "render":
    from playwright.sync_api import sync_playwright
    ent = d.parent.parent / "entreprise"
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={"width": 794, "height": 1123}, device_scale_factor=2)
        pg.goto((d / "fiche.html").as_uri()); pg.wait_for_timeout(700)
        print("debordement", pg.evaluate("[...document.querySelectorAll('.page')].map(p => { const f = p.querySelector('footer').getBoundingClientRect(), t = p.getBoundingClientRect(); return Math.round(f.bottom - t.bottom + 26); })"))
        pg.pdf(path=str(ent / "fiche-claude-ambassadeurs-sodaf.pdf"), width="210mm", height="297mm", print_background=True)
        for i in (0, 1): pg.screenshot(path=str(d / f"p{i+1}.png"), clip={"x": 0, "y": 1123 * i, "width": 794, "height": 1123}, full_page=True)
        b.close()
    from PIL import Image
    im = Image.open(d / "p1.png").convert("RGB"); im.save(ent / "fiche-claude-ambassadeurs-sodaf.jpg", quality=88)
    im.resize((240, round(240 * im.height / im.width))).save(ent / "apercu-fiche-claude.jpg", quality=85)
    (d / "contexte.txt").write_text(CONTEXTE + "\n")
else:
    (d / "fiche.html").write_text(doc); print("ok")
