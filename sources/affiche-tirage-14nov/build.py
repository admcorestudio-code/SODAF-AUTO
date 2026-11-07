# Affiche spéciale du tirage reporté au samedi 14 novembre 2026 (demande du propriétaire, 7 nov.).
# Volontairement différente de l'affiche du tirage de base (fond nuit, grand calendrier).
# Refaire : python3 build.py && python3 render.py <dossier de sortie>
import pathlib
d = pathlib.Path(__file__).parent
base = (d / "affiche.html").read_text()
logo = (d / "logo.svg").read_text()

def page(cls, qr, logo_h):
    return f'''<div class="page {cls}"><div class="route"></div>
<div class="top"><img class="logo" src="logo.svg" alt="SODAF" style="height:{logo_h}px;width:auto"><span class="pill">Tirage au sort étudiant</span></div>
<p class="kick">Le tirage, c'est ce samedi</p>
<div class="cal"><i class="anneau g"></i><i class="anneau d"></i><div class="mois">Novembre</div><div class="jour">14</div><div class="sam">Samedi</div><span class="h">20 h · à l'agence</span></div>
<div class="gain"><h1>2 étudiants gagnent<br>leur permis à <b>15 000 F</b></h1><p>au lieu de <s>60 000 F</s>, inscription comprise</p></div>
<div class="lots"><span>Inscription offerte</span><span>Une séance de conduite en plus</span><span>T-shirt SODAF</span><span>Priorité sur les horaires</span></div>
<div class="ins"><div class="qr"><img src="qr.svg" alt="QR code autosodaf.com/#tirage" style="width:{qr}px;height:{qr}px"></div>
<div><h2>Inscris-toi gratuitement</h2><p class="url">autosodaf.com/#tirage</p><p class="av">Jusqu'au vendredi 13 novembre à minuit,<br>avec la photo de ta carte d'étudiant.</p></div></div>
<p class="cond"><b>Étudiants de 18 ans et plus</b> · une participation par numéro<br>Tirage filmé à l'agence · la vidéo sort le soir même sur TikTok <b>@autoecole.sodaf.tg</b></p>
<div class="foot"><div class="tel">72 54 41 66<small>appel et WhatsApp</small></div><div class="adr">SODAF Auto-École<br>412 Avenue Akei, Tokoin Tamé, en face de la caisse</div></div>
</div>'''

(d / "a4.html").write_text(base.replace("<!--PAGE-->", page("a4", 128, 40)))
(d / "story.html").write_text(base.replace("<!--PAGE-->", page("story", 200, 58)))
print("ok")
