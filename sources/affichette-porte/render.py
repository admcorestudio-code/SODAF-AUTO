# python3 render.py : affichette de porte (A4) → entreprise/affichette-porte-terrain-sodaf.pdf, .jpg, apercu
import pathlib
from playwright.sync_api import sync_playwright
d = pathlib.Path(__file__).parent; ent = d.parent.parent / "entreprise"
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={"width": 794, "height": 1123}, device_scale_factor=2)
    pg.goto((d / "porte.html").as_uri()); pg.wait_for_timeout(800)
    print("debordement", pg.evaluate("(() => { const p = document.querySelector('.p'); return p.scrollHeight - p.clientHeight; })()"))
    pg.pdf(path=str(ent / "affichette-porte-terrain-sodaf.pdf"), width="210mm", height="297mm", print_background=True, page_ranges="1")
    pg.screenshot(path=str(d / "porte.png"), clip={"x": 0, "y": 0, "width": 794, "height": 1123}); b.close()
from PIL import Image
im = Image.open(d / "porte.png").convert("RGB"); im.save(ent / "affichette-porte-terrain-sodaf.jpg", quality=88)
im.resize((240, round(240 * im.height / im.width))).save(ent / "apercu-affichette-porte.jpg", quality=85)
