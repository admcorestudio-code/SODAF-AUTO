# Affiche du tirage du samedi 14 novembre, style « Feu vert », version pro (choix du propriétaire, 7 nov.).
# python3 feu_vert.py && python3 feu_vert.py render <dossier>
import pathlib, sys
d = pathlib.Path(__file__).parent
CHK = '<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="10" fill="#35D07F"/><path d="M5.5 10.3l3 3 6-6.3" stroke="#06140C" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>'
TEL = '<svg viewBox="0 0 30 30"><rect width="30" height="30" rx="9" fill="#1B1D22"/><path d="M11.2 8.5l2 3.3-1.5 1.6a9.5 9.5 0 0 0 4.9 4.9l1.6-1.5 3.3 2-1 2.6c-6.6.4-12.3-5.3-11.9-11.9z" fill="#35D07F"/></svg>'
LIEU = '<svg viewBox="0 0 30 30"><rect width="30" height="30" rx="9" fill="#1B1D22"/><path d="M15 7.5a5.6 5.6 0 0 0-5.6 5.6c0 4.2 5.6 9.4 5.6 9.4s5.6-5.2 5.6-9.4A5.6 5.6 0 0 0 15 7.5zm0 7.6a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" fill="#35D07F"/></svg>'

def page(cls, qr):
    lots = "".join(f"<div>{CHK}{t}</div>" for t in ["Inscription offerte", "Une séance de conduite en plus", "Le t-shirt SODAF", "Priorité sur les horaires"])
    return f'''<div class="p {cls}"><div class="in">
<div class="top"><img src="logo.svg" alt="SODAF"><span class="tag"><i></i>Tirage au sort étudiant</span></div>
<div class="hero">
 <div class="feu"><div class="boite"><div class="lum r"></div><div class="lum o"></div><div class="lum v"></div></div><div class="mat"></div></div>
 <div class="txt"><div class="hfeu"><i></i><i></i><i class="v"></i></div><p class="k">Feu vert pour ton permis</p><h1><span>Samedi</span><span>14 novembre</span></h1>
  <div class="quand"><div class="h"><small>Tirage</small><b>20 h</b></div><div><small>Lieu</small><b>À l'agence SODAF</b></div><div><small>Gagnants</small><b>2</b></div></div></div>
</div>
<div class="offre"><p class="a">2 étudiants gagnent leur permis à</p><div class="prix"><b>15&nbsp;000&nbsp;F</b><span>au lieu de <s>60&nbsp;000&nbsp;F</s><br>inscription comprise</span></div>
<div class="lots">{lots}</div></div>
<div class="ins"><div class="qr"><img src="qr.svg" alt="QR code autosodaf.com/#tirage" style="width:{qr}px;height:{qr}px"><small>Scanne</small></div>
<div><h2>Inscris-toi gratuitement</h2><span class="url">autosodaf.com/#tirage</span>
<ol><li><b>1</b>Tes nom, université et numéro WhatsApp</li><li><b>2</b>La photo de ta carte d'étudiant</li><li><b>3</b>Avant le vendredi 13 novembre à minuit</li></ol></div></div>
<p class="cond"><b>Étudiants de 18 ans et plus</b>, une participation par numéro. Tirage filmé à l'agence, vidéo publiée le soir même sur TikTok <b>@autoecole.sodaf.tg</b>.</p>
<div class="foot"><div class="c">{TEL}<div><b>72 54 41 66</b>Appel et WhatsApp</div></div><div class="c">{LIEU}<div><b>412 Avenue Akei, Tokoin Tamé</b>En face de la caisse, Lomé</div></div><div class="r"><b>SODAF Auto-École</b>autosodaf.com</div></div>
</div></div>'''

base = (d / "feu-vert.html").read_text()
if len(sys.argv) > 1 and sys.argv[1] == "render":
    from playwright.sync_api import sync_playwright
    out = pathlib.Path(sys.argv[2]); out.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        b = p.chromium.launch()
        for name, w, h in (("feu-vert-a4", 794, 1123), ("feu-vert-story", 1080, 1920)):
            pg = b.new_page(viewport={"width": w, "height": h}, device_scale_factor=2)
            pg.goto((d / (name + ".html")).as_uri()); pg.wait_for_timeout(700)
            print(name, "debordement", pg.evaluate("(() => { const p = document.querySelector('.in'); return p.scrollHeight - p.clientHeight; })()"))
            pg.screenshot(path=str(out / (name + ".png")), clip={"x": 0, "y": 0, "width": w, "height": h})
            if name.endswith("a4"): pg.pdf(path=str(out / (name + ".pdf")), width="210mm", height="297mm", print_background=True, page_ranges="1")
            pg.close()
        b.close()
else:
    (d / "feu-vert-a4.html").write_text(base.replace("<!--PAGE-->", page("a4", 112)))
    (d / "feu-vert-story.html").write_text(base.replace("<!--PAGE-->", page("story", 190)))
    print("ok")
