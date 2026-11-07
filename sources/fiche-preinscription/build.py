# Fiche de pré-inscription papier (7 nov. 2026) : quand le secrétariat n'est pas là (mercredi et vendredi des semaines de cours),
# le moniteur la donne au visiteur, qui la remplit lui-même. Pas d'argent. Le lendemain matin, le secrétariat appelle chaque personne.
# Une page A4 = 2 fiches A5 à couper. python3 build.py && python3 build.py render
import pathlib, sys
d = pathlib.Path(__file__).parent
F = "../affiche-tirage-14nov/"
def cases(l): return "".join(f'<span class="cb"><i></i>{x}</span>' for x in l)
def fiche():
    return f'''<section class="f">
<header><img src="{F}logo-noir.svg" alt="SODAF"><div class="ht"><b>Fiche de pré-inscription</b><span>À remplir par le visiteur</span></div></header>
<p class="intro">Bienvenue chez SODAF Auto-École. Laissez vos coordonnées : <b>le secrétariat vous appelle très vite</b> pour vous renseigner ou finir votre inscription. <b>Aucun paiement aujourd'hui.</b></p>
<div class="g">
 <div class="c1">
  <div class="ln"><span>Date</span><i class="s"></i><span>Heure</span><i class="s"></i></div>
  <div class="ln"><span>Nom et prénoms</span><i></i></div>
  <div class="ln"><span>Téléphone</span><b>+228</b><i></i></div>
  <div class="ln"><span>Quartier ou université</span><i></i></div>
  <div class="q"><span>Je viens pour</span><div>{cases(["des informations", "m'inscrire"])}</div></div>
  <div class="q"><span>M'appeler plutôt</span><div>{cases(["le matin", "à midi", "le soir"])}</div></div>
 </div>
 <div class="c2">
  <div class="q"><span>La formation qui m'intéresse</span><div class="col">{cases(["Formation complète", "Tarif étudiant", "Formule rapide", "Formation privée", "Remise à niveau", "Code seul", "Je ne sais pas encore"])}</div></div>
  <div class="q"><span>J'ai connu SODAF par</span><div>{cases(["en passant", "TikTok", "un ami", "un ambassadeur", "une affiche", "autre"])}</div></div>
  <div class="ln"><span>Ma question</span><i></i></div><div class="ln"><i></i></div>
 </div>
</div>
<div class="secw"><p class="sect">Réservé au secrétariat · <b>visiteur : ne rien écrire ici</b></p><div class="sec"><div class="ln"><span>Appelé le</span><i class="s"></i></div>{cases(["Pré-inscrit", "Pas joignable", "Pas intéressé"])}<div class="ln"><span>SO</span><i class="xs"></i></div></div></div>
<footer><b>SODAF Auto-École</b> · 412 Avenue Akei, Tokoin Tamé, en face de la caisse · 72 54 41 66 (appel et WhatsApp) · autosodaf.com</footer>
</section>'''
CSS = '''@font-face{font-family:"Outfit";src:url(../affiche-tirage-14nov/Outfit.ttf)}@font-face{font-family:"Figtree";src:url(../affiche-tirage-14nov/Figtree.ttf)}
@page{size:210mm 297mm;margin:0}*{box-sizing:border-box;margin:0;padding:0}
body{background:#fff;color:#14171C;font-family:Figtree;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{width:794px;height:1123px;display:flex;flex-direction:column}
.f{position:relative;height:561px;padding:26px 40px 18px 50px;display:flex;flex-direction:column;gap:12px}
.f::before{content:"";position:absolute;left:0;top:0;bottom:0;width:10px;background:#35D07F}
.f+.cut+.f{border-top:0}
.cut{height:1px;border-top:1.5px dashed #9AA1AB;position:relative}.cut span{position:absolute;right:40px;top:-9px;background:#fff;padding:0 8px;font:600 10px Outfit;letter-spacing:.12em;text-transform:uppercase;color:#9AA1AB}
header{display:flex;justify-content:space-between;align-items:center;padding-bottom:10px;border-bottom:1.5px solid #14171C}
header img{height:26px}
.ht{text-align:right}.ht b{display:block;font:800 22px/1 Outfit;text-transform:uppercase;letter-spacing:-.005em}.ht span{display:block;margin-top:4px;font:600 11px Outfit;letter-spacing:.1em;text-transform:uppercase;color:#1F9A5A}
.intro{font:500 12.5px/1.45 Figtree;color:#3B424B}.intro b{color:#14171C}
.g{display:grid;grid-template-columns:1.25fr 1fr;gap:26px}
.c1,.c2{display:flex;flex-direction:column;gap:13px}
.ln{display:flex;align-items:flex-end;gap:8px}
.ln span,.q>span,.sec>span.t{font:700 10.5px Outfit;letter-spacing:.07em;text-transform:uppercase;color:#4A525C;white-space:nowrap;padding-bottom:2px}
.ln b{font:700 13px Figtree;padding-bottom:1px}
.ln i{flex:1;border-bottom:1.2px solid #14171C;height:22px}.ln i.s{flex:0 0 92px}.ln i.xs{flex:0 0 60px}
.q{display:flex;flex-direction:column;gap:7px}
.q>div{display:flex;flex-wrap:wrap;gap:7px 16px}.q>div.col{display:grid;grid-template-columns:1fr 1fr;gap:7px 12px}
.cb{display:inline-flex;align-items:center;gap:7px;font:600 12.5px Figtree;white-space:nowrap}
.cb i{flex:none;width:15px;height:15px;border:1.6px solid #14171C;border-radius:4px}
.secw{margin-top:auto;display:flex;flex-direction:column;gap:5px}.sect{font:700 10.5px Outfit;letter-spacing:.07em;text-transform:uppercase;color:#6B7280}.sect b{color:#B42318}
.sec{display:flex;align-items:center;flex-wrap:wrap;gap:8px 16px;border:1.5px dashed #B9BEC6;border-radius:12px;padding:10px 14px;background:#F6F7F8}
.sec{flex-wrap:nowrap;gap:14px}.sec .cb{font-size:12px}
.sec .ln i.s{flex:0 0 80px}
footer{font:500 10px Figtree;color:#5B6470}footer b{color:#14171C}'''
html = f'<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>SODAF · fiche de pré-inscription</title><style>{CSS}</style></head><body><div class="page">{fiche()}<div class="cut"><span>Couper ici</span></div>{fiche()}</div></body></html>'
if len(sys.argv) > 1 and sys.argv[1] == "render":
    from playwright.sync_api import sync_playwright
    ent = d.parent.parent / "entreprise"
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={"width": 794, "height": 1123}, device_scale_factor=2)
        pg.goto((d / "fiche.html").as_uri()); pg.wait_for_timeout(700)
        print("debordement", pg.evaluate("[...document.querySelectorAll('.f')].map(f => f.scrollHeight - f.clientHeight)"))
        pg.pdf(path=str(ent / "fiche-preinscription-sodaf.pdf"), width="210mm", height="297mm", print_background=True, page_ranges="1")
        pg.screenshot(path=str(d / "fiche.png"), clip={"x": 0, "y": 0, "width": 794, "height": 1123}); b.close()
    from PIL import Image
    im = Image.open(d / "fiche.png").convert("RGB"); im.save(ent / "fiche-preinscription-sodaf.jpg", quality=88)
    im.resize((240, round(240 * im.height / im.width))).save(ent / "apercu-fiche-preinscription.jpg", quality=85)
else:
    (d / "fiche.html").write_text(html); print("ok")
