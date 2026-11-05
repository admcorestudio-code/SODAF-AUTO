# Rend fiches.html : un PDF par formule + un PDF avec toutes les fiches + une image par fiche.
# Usage : python3 build.py && python3 render.py <dossier de sortie>
import asyncio, sys, pathlib
from playwright.async_api import async_playwright
ICI = pathlib.Path(__file__).parent
OUT = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "/tmp/fc"); OUT.mkdir(parents=True, exist_ok=True)
KS = ["complete", "etudiant", "rapide", "remise", "tirage", "privee"]
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={"width": 794, "height": 1123}, device_scale_factor=2)
        await pg.goto("file://" + str(ICI / "fiches.html")); await pg.wait_for_timeout(1200)
        print(await pg.evaluate("""() => [...document.querySelectorAll('.page')].map((s, i) => { const t = s.getBoundingClientRect(), f = s.querySelector('footer').getBoundingClientRect(), tb = s.querySelector('table').getBoundingClientRect(), rg = s.querySelector('.rg').getBoundingClientRect();
            return {page: i + 1, debordement: Math.round(f.bottom - t.top - 1123), place_sous_tableau: Math.round(rg.top - tb.bottom)}; })"""))
        await pg.pdf(path=str(OUT / "fiches-conduite-sodaf.pdf"), width="794px", height="1123px", print_background=True, margin={"top": "0", "right": "0", "bottom": "0", "left": "0"})
        for i, s in enumerate(await pg.query_selector_all(".page")):
            await s.screenshot(path=str(OUT / ("fiche-conduite-%s-sodaf.png" % KS[i])))
        await b.close()
asyncio.run(main())
