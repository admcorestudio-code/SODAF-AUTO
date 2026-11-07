# 3 autres styles pour l'affiche du tirage du samedi 14 novembre (le propriétaire veut choisir parmi plusieurs).
# A = nuit et calendrier (affiche.html / build.py). B = panneau routier. C = éditorial. D = feu tricolore.
import pathlib
d = pathlib.Path(__file__).parent
QR = "qr.svg"
FONTS = '@font-face{font-family:"Outfit";src:url(Outfit.ttf)}@font-face{font-family:"Figtree";src:url(Figtree.ttf)}@page{size:210mm 297mm;margin:0}*{box-sizing:border-box;margin:0;padding:0}'
TXT = dict(
    gain1="2 étudiants gagnent", gain2="leur permis à", prix="15&nbsp;000&nbsp;F", av="au lieu de <s>60 000 F</s>, inscription comprise",
    lots=["Inscription offerte", "Une séance de conduite en plus", "T-shirt SODAF", "Priorité sur les horaires"],
    ins="Inscris-toi gratuitement", url="autosodaf.com/#tirage", lim="Jusqu'au vendredi 13 novembre à minuit,<br>avec la photo de ta carte d'étudiant.",
    cond="<b>Étudiants de 18 ans et plus</b> · une participation par numéro<br>Tirage filmé à l'agence · vidéo le soir même sur TikTok <b>@autoecole.sodaf.tg</b>",
    adr="412 Avenue Akei, Tokoin Tamé, en face de la caisse")

def lots(cls=""):
    return '<div class="lots ' + cls + '">' + "".join("<span>" + l + "</span>" for l in TXT["lots"]) + "</div>"

def foot(logo):
    return f'<div class="foot"><img src="{logo}" alt="SODAF" class="flogo"><div class="tel">72 54 41 66<small>appel et WhatsApp</small></div><div class="adr">SODAF Auto-École<br>{TXT["adr"]}</div></div>'

def ins(qr=120):
    return f'<div class="ins"><div class="qr"><img src="{QR}" alt="QR code autosodaf.com/#tirage" style="width:{qr}px;height:{qr}px"></div><div><h2>{TXT["ins"]}</h2><p class="url">{TXT["url"]}</p><p class="lim">{TXT["lim"]}</p></div></div>'

# ---------- B · Panneau routier (vert autoroute, bords blancs, flèches) ----------
B_CSS = """
body{background:#0A5C35}
.p{width:794px;height:1123px;padding:34px;background:#0A5C35;font-family:Figtree;color:#fff;display:flex;flex-direction:column;gap:28px;position:relative}
.sign{border:6px solid #fff;border-radius:26px;padding:26px 30px;position:relative}
.top{display:flex;justify-content:space-between;align-items:center}
.top img{height:38px}
.top .k{font:800 15px/1 Outfit;letter-spacing:.16em;text-transform:uppercase;border:3px solid #fff;padding:9px 14px;border-radius:8px}
.dir{margin-top:22px;display:flex;align-items:center;gap:22px}
.arrow{flex:none;width:120px;height:120px}
.dir h1{font:900 64px/0.95 Outfit;letter-spacing:-.01em}
.dir h1 small{display:block;font:700 24px/1.2 Outfit;letter-spacing:.08em;text-transform:uppercase;color:#FFD23F;margin-bottom:8px}
.km{margin-top:22px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
.km div{background:#fff;color:#0A5C35;border-radius:12px;padding:12px 10px;text-align:center}
.km b{display:block;font:900 44px/1 Outfit}
.km span{font:800 14px/1.2 Outfit;letter-spacing:.12em;text-transform:uppercase}
.gain{text-align:center}
.gain h2{font:900 40px/1.05 Outfit}
.gain h2 b{color:#FFD23F}
.gain p{font:600 19px/1.3 Figtree;opacity:.9;margin-top:6px}
.gain s{text-decoration-color:#E63946;text-decoration-thickness:3px}
.lots{display:flex;flex-wrap:wrap;justify-content:center;gap:9px}
.lots span{font:700 15px/1 Figtree;background:#FFD23F;color:#0B2A1A;padding:10px 14px;border-radius:8px}
.ins{display:flex;gap:20px;align-items:center;background:#fff;color:#0B2A1A;border-radius:18px;padding:16px 20px;border-left:14px solid #FFD23F}
.ins h2{font:900 28px/1 Outfit}.ins .url{font:800 20px/1.2 Outfit;color:#0A5C35;margin-top:6px}.ins .lim{font:600 16px/1.35 Figtree;margin-top:6px}
.cond{text-align:center;font:500 14px/1.5 Figtree;opacity:.92}
.foot{margin-top:auto;display:flex;align-items:center;gap:22px;border-top:2px dashed rgba(255,255,255,.5);padding-top:14px;font:600 14px/1.35 Figtree}
.foot .flogo{display:none}.foot .tel{font:900 22px/1 Outfit;color:#FFD23F}.foot .tel small{display:block;font:600 12px Figtree;color:#fff}.foot .adr{margin-left:auto;text-align:right}
"""
ARROW = '<svg class="arrow" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#fff"/><path d="M28 50h38M52 32l18 18-18 18" stroke="#0A5C35" stroke-width="11" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>'
B = f"""<div class="p"><div class="sign"><div class="top"><img src="logo.svg" alt="SODAF"><span class="k">Tirage au sort étudiant</span></div>
<div class="dir">{ARROW}<h1><small>Prochaine sortie</small>Samedi<br>14 novembre</h1></div>
<div class="km"><div><b>20 h</b><span>heure</span></div><div><b>2</b><span>gagnants</span></div><div><b>0 F</b><span>pour jouer</span></div></div></div>
<div class="gain"><h2>{TXT["gain1"]} {TXT["gain2"]} <b>{TXT["prix"]}</b></h2><p>{TXT["av"]}</p></div>
{lots()}{ins(118)}<p class="cond">{TXT["cond"]}</p>{foot("logo.svg")}</div>"""

# ---------- C · Éditorial (crème, très grande date, filet rouge) ----------
C_CSS = """
body{background:#F4EFE6}
.p{width:794px;height:1123px;padding:46px 54px 36px;background:#F4EFE6;color:#111;font-family:Figtree;display:flex;flex-direction:column;position:relative}
.p::after{content:"";position:absolute;left:54px;right:54px;top:118px;border-top:2px solid #111}
.top{display:flex;justify-content:space-between;align-items:flex-end;height:58px}
.top img{height:34px}
.top .k{font:700 13px/1.4 Outfit;letter-spacing:.22em;text-transform:uppercase;text-align:right}
.date{margin-top:42px;display:flex;align-items:flex-end;gap:18px}
.date .n{font:900 300px/.78 Outfit;letter-spacing:-.06em;color:#111}
.date .n i{font-style:normal;color:#D7263D}
.date .m{padding-bottom:14px;font:800 30px/1.05 Outfit;text-transform:uppercase;letter-spacing:.04em}
.date .m b{display:block;color:#D7263D;font-size:46px}
.rule{margin:26px 0 20px;height:12px;background:#D7263D}
.gain h1{font:900 52px/1 Outfit;letter-spacing:-.02em}
.gain p{margin-top:10px;font:600 21px/1.3 Figtree;color:#444}
.gain s{text-decoration-color:#D7263D;text-decoration-thickness:3px}
.lots{margin-top:20px;display:grid;grid-template-columns:1fr 1fr;border-top:1px solid #111}
.lots span{font:700 17px/1.2 Figtree;padding:12px 0;border-bottom:1px solid #111}
.lots span::before{content:"— ";color:#D7263D}
.ins{margin-top:24px;display:flex;gap:22px;align-items:center;background:#111;color:#F4EFE6;padding:18px 22px}
.ins .qr{background:#fff;padding:8px}
.ins h2{font:900 30px/1 Outfit}.ins .url{font:800 20px/1.2 Outfit;color:#FF6B6B;margin-top:6px}.ins .lim{font:500 16px/1.35 Figtree;margin-top:6px;opacity:.9}
.cond{margin-top:16px;font:500 14px/1.5 Figtree;color:#333}
.foot{margin-top:auto;display:flex;align-items:center;gap:22px;border-top:2px solid #111;padding-top:12px;font:600 14px/1.35 Figtree}
.foot .flogo{display:none}.foot .tel{font:900 22px/1 Outfit;color:#D7263D}.foot .tel small{display:block;font:600 12px Figtree;color:#111}.foot .adr{margin-left:auto;text-align:right}
"""
C = f"""<div class="p"><div class="top"><img src="logo-noir.svg" alt="SODAF"><span class="k">Tirage au sort<br>étudiant</span></div>
<div class="date"><div class="n">14<i>.</i></div><div class="m">Samedi<b>Novembre</b>20 h · à l'agence</div></div>
<div class="rule"></div>
<div class="gain"><h1>{TXT["gain1"]}<br>{TXT["gain2"]} {TXT["prix"]}.</h1><p>{TXT["av"]}</p></div>
{lots()}{ins(112)}<p class="cond">{TXT["cond"]}</p>{foot("logo-noir.svg")}</div>"""

# ---------- D · Feu tricolore (noir, feu qui passe au vert) ----------
D_CSS = """
body{background:#0E0E10}
.p{width:794px;height:1123px;padding:40px 50px 32px;background:radial-gradient(90% 60% at 30% 30%,#1B2A1F 0%,#0E0E10 60%);color:#fff;font-family:Figtree;display:flex;flex-direction:column;gap:22px}
.top{display:flex;justify-content:space-between;align-items:center}
.top img{height:36px}.top .k{font:700 13px/1 Outfit;letter-spacing:.18em;text-transform:uppercase;color:#3DDC84;border:2px solid #3DDC84;padding:9px 14px;border-radius:999px}
.hero{display:flex;gap:34px;align-items:center;margin-top:8px}
.feu{flex:none;width:150px;background:#1C1C20;border-radius:36px;padding:16px;display:flex;flex-direction:column;gap:14px;box-shadow:inset 0 0 0 4px #2A2A30}
.feu i{display:block;width:118px;height:118px;border-radius:50%;background:#2B2B2F}
.feu i.r{background:#3A1515}.feu i.o{background:#3A2E10}
.feu i.v{background:#3DDC84;box-shadow:0 0 30px #3DDC84,0 0 70px rgba(61,220,132,.6)}
.hero .t small{font:700 20px/1 Outfit;letter-spacing:.2em;text-transform:uppercase;color:#3DDC84}
.hero h1{font:900 76px/.92 Outfit;margin-top:10px}
.hero .h{display:inline-block;margin-top:16px;font:800 30px/1 Outfit;color:#0E0E10;background:#3DDC84;padding:10px 18px;border-radius:12px}
.gain h2{font:900 42px/1.05 Outfit}.gain h2 b{color:#3DDC84}
.gain p{font:600 20px/1.3 Figtree;color:#B8B8C0;margin-top:6px}.gain s{text-decoration-color:#FF4D4D;text-decoration-thickness:3px;color:#fff}
.lots{display:flex;flex-wrap:wrap;gap:10px}
.lots span{font:700 15px/1 Figtree;padding:10px 14px;border-radius:10px;background:#1F1F24;border:1px solid #34343C}
.ins{display:flex;gap:22px;align-items:center;background:#3DDC84;color:#0E0E10;border-radius:20px;padding:18px 22px}
.ins .qr{background:#fff;padding:10px;border-radius:12px}
.ins h2{font:900 30px/1 Outfit}.ins .url{font:800 20px/1.2 Outfit;margin-top:6px}.ins .lim{font:600 16px/1.35 Figtree;margin-top:6px}
.cond{font:500 14px/1.5 Figtree;color:#B8B8C0}.cond b{color:#fff}
.foot{margin-top:auto;display:flex;align-items:center;gap:22px;border-top:1px solid #2E2E34;padding-top:14px;font:600 14px/1.35 Figtree}
.foot .flogo{display:none}.foot .tel{font:900 22px/1 Outfit;color:#3DDC84}.foot .tel small{display:block;font:600 12px Figtree;color:#B8B8C0}.foot .adr{margin-left:auto;text-align:right}
"""
D = f"""<div class="p"><div class="top"><img src="logo.svg" alt="SODAF"><span class="k">Tirage au sort étudiant</span></div>
<div class="hero"><div class="feu"><i class="r"></i><i class="o"></i><i class="v"></i></div><div class="t"><small>Feu vert pour ton permis</small><h1>Samedi<br>14 novembre</h1><span class="h">20 h · à l'agence</span></div></div>
<div class="gain"><h2>{TXT["gain1"]} {TXT["gain2"]} <b>{TXT["prix"]}</b></h2><p>{TXT["av"]}</p></div>
{lots()}{ins(118)}<p class="cond">{TXT["cond"]}</p>{foot("logo.svg")}</div>"""

for k, css, body in (("b", B_CSS, B), ("c", C_CSS, C), ("d", D_CSS, D)):
    (d / f"style-{k}.html").write_text(f'<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Tirage SODAF {k}</title><style>{FONTS}{css}</style></head><body>{body}</body></html>')
print("ok")
