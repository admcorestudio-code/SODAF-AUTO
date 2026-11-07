# Couverture Google illustrée avec personnages (7 nov. 2026) : le moniteur et une élève devant la voiture SODAF, en plein jour, devant l'agence.
# Un dessin (pas une fausse photo), en attendant la vraie photo. python3 personnages.py  ->  personnages.html ; python3 personnages.py render
import pathlib, sys
d = pathlib.Path(__file__).parent
PEAU1, PEAU2 = "#7A4A2C", "#5E3820"
def personne(x, pieds, h, haut, bas, peau, cheveux, chaussures, femme=False, bras_d="", extra=""):
    k = h / 260.0
    def Y(v): return pieds - v * k
    def X(v): return x + v * k
    tete_y = Y(236); torse_h = 104 * k
    s = []
    # jambes
    for dx in (-15, 15):
        s.append(f'<rect x="{X(dx-11)}" y="{Y(122)}" width="{22*k}" height="{112*k}" rx="{9*k}" fill="{bas}"/>')
        s.append(f'<ellipse cx="{X(dx+4)}" cy="{Y(6)}" rx="{17*k}" ry="{8*k}" fill="{chaussures}"/>')
    # bras gauche (le long du corps)
    s.append(f'<path d="M{X(-30)} {Y(200)} C{X(-44)} {Y(170)} {X(-46)} {Y(140)} {X(-42)} {Y(112)}" stroke="{haut}" stroke-width="{20*k}" stroke-linecap="round" fill="none"/>')
    s.append(f'<circle cx="{X(-42)}" cy="{Y(108)}" r="{9*k}" fill="{peau}"/>')
    # torse
    s.append(f'<rect x="{X(-34)}" y="{Y(212)}" width="{68*k}" height="{torse_h}" rx="{22*k}" fill="{haut}"/>')
    # cou + tête
    s.append(f'<rect x="{X(-7)}" y="{Y(222)}" width="{14*k}" height="{14*k}" fill="{peau}"/>')
    s.append(f'<circle cx="{x}" cy="{tete_y}" r="{24*k}" fill="{peau}"/>')
    if femme:
        s.append(f'<path d="M{X(-25)} {Y(236)} C{X(-27)} {Y(270)} {X(27)} {Y(270)} {X(25)} {Y(236)} C{X(18)} {Y(250)} {X(-18)} {Y(250)} {X(-25)} {Y(236)}Z" fill="{cheveux}"/>')
        s.append(f'<circle cx="{x}" cy="{Y(272)}" r="{15*k}" fill="{cheveux}"/>')
    else:
        s.append(f'<path d="M{X(-24)} {Y(240)} C{X(-24)} {Y(266)} {X(24)} {Y(266)} {X(24)} {Y(240)} C{X(16)} {Y(252)} {X(-16)} {Y(252)} {X(-24)} {Y(240)}Z" fill="{cheveux}"/>')
    # visage : yeux + sourire
    s.append(f'<circle cx="{X(-8)}" cy="{Y(238)}" r="{2.6*k}" fill="#1B120C"/><circle cx="{X(8)}" cy="{Y(238)}" r="{2.6*k}" fill="#1B120C"/>')
    s.append(f'<path d="M{X(-9)} {Y(226)} Q{x} {Y(218)} {X(9)} {Y(226)}" stroke="#1B120C" stroke-width="{2.4*k}" fill="none" stroke-linecap="round"/>')
    s.append(bras_d.format(**{"x": x, "k": k, "pieds": pieds}) if bras_d else "")
    s.append(extra)
    return "".join(s)
def svg():
    # moniteur : polo vert, bras droit tendu vers la voiture ; élève : haut jaune, clés levées, sac à dos
    mx, ex, pieds = 790, 650, 752
    km = 268 / 260; ke = 250 / 260
    bras_m = (f'<path d="M{mx+30*km} {pieds-200*km} C{mx+60*km} {pieds-196*km} {mx+92*km} {pieds-188*km} {mx+118*km} {pieds-176*km}" stroke="#1F9A5A" stroke-width="{20*km}" stroke-linecap="round" fill="none"/>'
              f'<circle cx="{mx+122*km}" cy="{pieds-174*km}" r="{9*km}" fill="{PEAU2}"/>')
    planchette = f'<rect x="{mx-58*km}" y="{pieds-142*km}" width="{30*km}" height="{40*km}" rx="{3*km}" fill="#FFFFFF" stroke="#C9CED6" stroke-width="2"/><rect x="{mx-52*km}" y="{pieds-134*km}" width="{18*km}" height="{3*km}" fill="#1F9A5A"/><rect x="{mx-52*km}" y="{pieds-126*km}" width="{14*km}" height="{3*km}" fill="#C9CED6"/>'
    logo_polo = f'<circle cx="{mx-14*km}" cy="{pieds-188*km}" r="{6*km}" fill="#FFFFFF" opacity=".9"/>'
    moniteur = personne(mx, pieds, 268, "#1F9A5A", "#2B2F36", PEAU2, "#1B120C", "#14171C", bras_d=bras_m, extra=planchette + logo_polo)
    bras_e = (f'<path d="M{ex+30*ke} {pieds-200*ke} C{ex+52*ke} {pieds-222*ke} {ex+60*ke} {pieds-250*ke} {ex+58*ke} {pieds-282*ke}" stroke="#F2B705" stroke-width="{19*ke}" stroke-linecap="round" fill="none"/>'
              f'<circle cx="{ex+58*ke}" cy="{pieds-290*ke}" r="{9*ke}" fill="{PEAU1}"/>'
              f'<circle cx="{ex+66*ke}" cy="{pieds-306*ke}" r="{7*ke}" fill="none" stroke="#9AA1AB" stroke-width="3"/><rect x="{ex+64*ke}" y="{pieds-332*ke}" width="{6*ke}" height="{22*ke}" rx="2" fill="#9AA1AB"/><rect x="{ex+70*ke}" y="{pieds-328*ke}" width="{6*ke}" height="{4*ke}" fill="#9AA1AB"/>')
    sac = f'<rect x="{ex-46*ke}" y="{pieds-206*ke}" width="{18*ke}" height="{70*ke}" rx="{7*ke}" fill="#1A4A85"/><path d="M{ex-28*ke} {pieds-208*ke} L{ex+4*ke} {pieds-150*ke}" stroke="#1A4A85" stroke-width="{6*ke}" stroke-linecap="round"/>'
    eleve = personne(ex, pieds, 250, "#F2B705", "#3A5A8C", PEAU1, "#1B120C", "#F6F7F8", femme=True, bras_d=bras_e, extra=sac)
    return f'''<svg width="1600" height="900" viewBox="0 0 1600 900" xmlns="http://www.w3.org/2000/svg">
<defs>
 <linearGradient id="ciel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9FD8F5"/><stop offset=".7" stop-color="#E8F6FC"/><stop offset="1" stop-color="#FFF6E2"/></linearGradient>
 <linearGradient id="carros" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#D5D9DF"/></linearGradient>
 <linearGradient id="vitre" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7FB6CF"/><stop offset="1" stop-color="#3D6E85"/></linearGradient>
 <linearGradient id="route" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4A4F57"/><stop offset="1" stop-color="#363A40"/></linearGradient>
 <filter id="flou" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
</defs>
<rect width="1600" height="900" fill="url(#ciel)"/>
<circle cx="1380" cy="140" r="70" fill="#FFE7A3" opacity=".9"/><circle cx="1380" cy="140" r="120" fill="#FFE7A3" opacity=".25"/>
<g fill="#FFFFFF" opacity=".85"><ellipse cx="300" cy="130" rx="90" ry="26"/><ellipse cx="360" cy="112" rx="60" ry="28"/><ellipse cx="1050" cy="90" rx="80" ry="22"/><ellipse cx="1100" cy="76" rx="50" ry="24"/></g>
<!-- bâtiments du fond -->
<g fill="#E9DCC6"><rect x="0" y="380" width="120" height="330"/><rect x="1180" y="360" width="200" height="350"/><rect x="1390" y="410" width="210" height="300"/></g>
<g fill="#D8C7AB"><rect x="20" y="420" width="30" height="40"/><rect x="70" y="420" width="30" height="40"/><rect x="1210" y="400" width="36" height="46"/><rect x="1270" y="400" width="36" height="46"/><rect x="1330" y="400" width="36" height="46"/><rect x="1420" y="450" width="36" height="46"/><rect x="1480" y="450" width="36" height="46"/><rect x="1540" y="450" width="36" height="46"/></g>
<!-- l'agence -->
<rect x="140" y="330" width="620" height="380" fill="#F6EEDF"/>
<rect x="140" y="330" width="620" height="16" fill="#E2D3B8"/>
<rect x="170" y="362" width="560" height="74" rx="10" fill="#1F9A5A"/>
<text x="450" y="412" text-anchor="middle" font-family="Outfit" font-weight="900" font-size="40" letter-spacing="2" fill="#FFFFFF">SODAF AUTO-ÉCOLE</text>
<rect x="196" y="470" width="190" height="150" rx="6" fill="#BFE1EE" stroke="#FFFFFF" stroke-width="8"/><path d="M291 470 V620 M196 545 H386" stroke="#FFFFFF" stroke-width="6"/>
<rect x="430" y="462" width="130" height="248" rx="6" fill="#2E5D4A"/><circle cx="540" cy="590" r="6" fill="#F2B705"/>
<rect x="598" y="470" width="130" height="150" rx="6" fill="#BFE1EE" stroke="#FFFFFF" stroke-width="8"/>
<path d="M150 446 L750 446 L730 462 L170 462 Z" fill="#35D07F" opacity=".9"/>
<!-- palmier -->
<path d="M1140 712 C1134 640 1146 560 1128 470" stroke="#7A5A3A" stroke-width="16" fill="none" stroke-linecap="round"/>
<g fill="#2F8F5B"><path d="M1128 470 C1090 450 1050 456 1018 486 C1060 470 1095 474 1128 478Z"/><path d="M1128 470 C1168 448 1210 454 1240 482 C1200 468 1162 470 1128 478Z"/><path d="M1128 470 C1108 432 1078 414 1040 414 C1078 430 1102 448 1126 474Z"/><path d="M1128 470 C1148 432 1178 416 1216 420 C1180 432 1154 450 1130 474Z"/><path d="M1128 470 C1126 434 1136 408 1156 392 C1144 418 1136 446 1130 472Z"/></g>
<!-- trottoir, route -->
<rect x="0" y="700" width="1600" height="64" fill="#D9D2C5"/><rect x="0" y="700" width="1600" height="6" fill="#C8BFAE"/>
<rect x="0" y="764" width="1600" height="136" fill="url(#route)"/>
<g fill="#F2B705"><rect x="40" y="836" width="100" height="10" rx="3"/><rect x="230" y="836" width="100" height="10" rx="3"/><rect x="420" y="836" width="100" height="10" rx="3"/><rect x="610" y="836" width="100" height="10" rx="3"/><rect x="800" y="836" width="100" height="10" rx="3"/><rect x="990" y="836" width="100" height="10" rx="3"/><rect x="1180" y="836" width="100" height="10" rx="3"/><rect x="1370" y="836" width="100" height="10" rx="3"/></g>
<!-- ombres des personnages -->
<ellipse cx="800" cy="754" rx="62" ry="9" fill="#000" opacity=".18" filter="url(#flou)"/><ellipse cx="660" cy="754" rx="56" ry="9" fill="#000" opacity=".18" filter="url(#flou)"/>
<!-- voiture (vers la gauche) -->
<g transform="translate(1560 586) scale(-1.2 1.2)">
 <ellipse cx="265" cy="190" rx="280" ry="14" fill="#000" opacity=".3" filter="url(#flou)"/>
 <rect x="196" y="-34" width="132" height="34" rx="8" fill="#1F9A5A"/><rect x="232" y="0" width="60" height="10" fill="#2A2C32"/>
 <path d="M10 150 L10 112 C10 96 20 88 38 85 L120 74 L182 22 C192 14 204 10 218 10 L338 10 C352 10 364 15 374 24 L432 74 L500 86 C518 90 530 100 532 118 L534 150 C534 160 526 166 516 166 L28 166 C18 166 10 160 10 150 Z" fill="url(#carros)"/>
 <path d="M12 120 L532 120 L533 134 L12 134 Z" fill="#1F9A5A"/>
 <path d="M138 76 L192 30 C198 25 205 22 214 22 L262 22 L262 76 Z" fill="url(#vitre)"/><path d="M274 22 L334 22 C344 22 352 26 359 33 L404 76 L274 76 Z" fill="url(#vitre)"/>
 <path d="M268 22 L268 160" stroke="#AEB4BE" stroke-width="2"/><path d="M140 80 L140 160" stroke="#AEB4BE" stroke-width="2"/>
 <rect x="226" y="92" width="26" height="6" rx="3" fill="#8D949F"/><rect x="352" y="92" width="26" height="6" rx="3" fill="#8D949F"/>
 <path d="M508 96 L528 100 C531 104 532 108 532 112 L506 110 Z" fill="#FFF6C8"/><rect x="12" y="98" width="16" height="12" rx="3" fill="#D7263D"/>
 <path d="M66 166 A52 52 0 0 1 170 166 Z" fill="#2A2C32"/><path d="M372 166 A52 52 0 0 1 476 166 Z" fill="#2A2C32"/>
 <g transform="translate(118 160)"><circle r="44" fill="#1B1C20"/><circle r="27" fill="#9AA1AB"/><circle r="11" fill="#4A4F57"/></g>
 <g transform="translate(424 160)"><circle r="44" fill="#1B1C20"/><circle r="27" fill="#9AA1AB"/><circle r="11" fill="#4A4F57"/></g>
</g>
<text x="1245.5" y="571" text-anchor="middle" font-family="Outfit" font-weight="800" font-size="16" letter-spacing="1" fill="#FFFFFF">AUTO-ÉCOLE</text>
{moniteur}{eleve}
</svg>'''
html = f'<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>SODAF · couverture avec personnages</title><style>@font-face{{font-family:"Outfit";src:url(../affiche-tirage-14nov/Outfit.ttf)}}*{{margin:0;padding:0}}svg{{display:block}}</style></head><body>{svg()}</body></html>'
if len(sys.argv) > 1 and sys.argv[1] == "render":
    from playwright.sync_api import sync_playwright
    ent = d.parent.parent / "entreprise"
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={"width": 1600, "height": 900})
        pg.goto((d / "personnages.html").as_uri()); pg.wait_for_timeout(600)
        pg.screenshot(path=str(d / "personnages.png")); b.close()
    from PIL import Image
    Image.open(d / "personnages.png").convert("RGB").save(ent / "couverture-google-personnages-sodaf.jpg", quality=90)
else:
    (d / "personnages.html").write_text(html); print("ok")
