# Fiches de conduite papier (une par formule). Usage : python3 build.py  ->  fiches.html (une page A4 par formule)
# Puis : python3 render.py /tmp/fc  (voir LISEZMOI.md)
import pathlib, html
ICI = pathlib.Path(__file__).parent
LOGO = (ICI.parent / "memos" / "logo.svg.html").read_text(encoding="utf-8")

# k, nom, nombre de séances, durée, couleur, couleur du texte sur la couleur, précision
FORMULES = [
    ("complete", "Formation complète", 12, "2 h", "#0B6E4F", "#FFFFFF", "Conduite en groupe : 4 élèves maximum en voiture, chacun conduit à son tour."),
    ("etudiant", "Tarif étudiant", 12, "2 h", "#1A4A85", "#FFFFFF", "Même programme que la formation complète. Carte d'étudiant de l'année."),
    ("rapide", "Formule rapide", 6, "2 h", "#C2410C", "#FFFFFF", "Pour ceux qui savent déjà tenir un volant."),
    ("remise", "Remise à niveau", 4, "2 h", "#4A525C", "#FFFFFF", "Pour les titulaires du permis qui veulent reprendre confiance. Évaluation comprise."),
    ("tirage", "Gagnant du tirage", 13, "2 h", "#F2B705", "#14171C", "12 séances + 1 séance offerte par le tirage au sort."),
    ("privee", "Formation privée", 12, "1 h", "#14171C", "#FFFFFF", "Seul(e) en voiture avec le moniteur, 1 h à chaque fois."),
]
ROWS_TOTAL = 16  # séances de la formule + lignes « séance en plus » pour remplir la page

def page(k, nom, n, duree, coul, txt, prec):
    plus = max(2, min(6, ROWS_TOTAL - n)); h = min(46, 590 // (n + plus))
    cases = "".join(f'<span class="cs"><i>{i}</i></span>' for i in range(1, n + 1))
    lignes = "".join(f'<tr><td class="no">{i}</td><td></td><td class="hr"><span>de</span><span>à</span></td><td></td><td></td><td></td></tr>' for i in range(1, n + 1))
    lignes += f'<tr class="sep"><td colspan="6">Séances en plus (payées au secrétariat avant la séance)</td></tr>'
    lignes += "".join(f'<tr class="px"><td class="no">+{i}</td><td></td><td class="hr"><span>de</span><span>à</span></td><td></td><td></td><td></td></tr>' for i in range(1, plus + 1))
    seance = "séance" + ("s" if n > 1 else "")
    return f'''<section class="page" style="--c:{coul};--t:{txt};--h:{h}px">
<header><div class="lg">{LOGO}<span class="ae">Auto-école · Lomé</span></div>
<div class="hd"><span class="k">Fiche de conduite</span><span class="f">{html.escape(nom)}</span></div></header>
<div class="top">
<div class="who">
<div class="ln"><span>Nom et prénoms</span><i></i></div>
<div class="ln2"><div class="ln"><span>N° de dossier</span><b>SO</b><i></i></div><div class="ln"><span>Téléphone</span><b>+228</b><i></i></div></div>
<div class="ln2"><div class="ln"><span>Inscrit(e) le</span><i></i></div><div class="ln"><span>Moniteur</span><i></i></div></div>
</div>
<div class="tot"><span class="tk">{n} {seance}</span><span class="td">de {duree}</span><span class="tf">Faites :<b></b>/ {n}</span></div>
</div>
<p class="prec">{html.escape(prec)}</p>
<div class="cases"><span class="cl">Une case cochée à chaque séance faite</span><div class="cg">{cases}</div></div>
<table><thead><tr><th class="no">N°</th><th class="dt">Date</th><th class="hrh">Heure</th><th>Ce qu'on a travaillé</th><th class="sg">Moniteur<small>signature</small></th><th class="sg">Élève<small>signature</small></th></tr></thead>
<tbody>{lignes}</tbody></table>
<div class="rg">
<div><b>À chaque séance</b><span>Apporte cette fiche. À la fin, le moniteur écrit la date, l'heure et ce que vous avez travaillé, puis vous signez tous les deux.</span></div>
<div><b>Tu ne peux pas venir ?</b><span>Préviens le secrétariat le plus tôt possible, au 72 54 41 66 (appel ou WhatsApp).</span></div>
<div><b>Ta fiche, ta preuve</b><span>Garde-la dans ton cahier jusqu'à l'examen. Ne la perds pas : elle compte tes séances.</span></div>
</div>
<footer><span><b>SODAF Auto-École</b> · 412 Avenue Akei, Tokoin Tamé, Lomé (en face de la caisse, près de la pharmacie Yembla)</span><span>72 54 41 66 · autosodaf.com</span></footer>
</section>'''

CSS = (ICI / "fiche.css").read_text(encoding="utf-8").replace("FONTS", str(ICI / "fonts"))
pages = "\n".join(page(*f) for f in FORMULES)
(ICI / "fiches.html").write_text(f'<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Fiches de conduite SODAF</title><style>{CSS}</style></head><body>\n{pages}\n</body></html>', encoding="utf-8")
print("ok", len(FORMULES), "pages")
