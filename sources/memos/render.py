# Rend memos.html en PDF (4 pages A4) et en images. Usage : python3 render.py <dossier de sortie>
# Puis (voir LISEZMOI.md) : copier les PDF dans entreprise/, les images dans doc-img/memos-sodaf/.
import asyncio, sys, pathlib
from playwright.async_api import async_playwright
ICI = pathlib.Path(__file__).parent
OUT = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "/tmp/memos")
OUT.mkdir(parents=True, exist_ok=True)

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={"width": 794, "height": 1123}, device_scale_factor=2)
        await pg.goto("file://" + str(ICI / "memos.html")); await pg.wait_for_timeout(1500)
        trop = await pg.evaluate("""() => [...document.querySelectorAll('.page')].map((s, i) => {
            const f = s.querySelector('footer').getBoundingClientRect(), t = s.getBoundingClientRect();
            const last = [...s.querySelectorAll('.cols, .sec, .rg')].reduce((m, x) => Math.max(m, x.getBoundingClientRect().bottom), 0);
            return {page: i + 1, marge: Math.round(f.top - last), debordement: Math.round(f.bottom - t.top - 1123)}; })""")
        print(trop)
        await pg.pdf(path=str(OUT / "memos-equipe-sodaf.pdf"), width="794px", height="1123px", print_background=True,
                     margin={"top": "0", "right": "0", "bottom": "0", "left": "0"})
        for i, s in enumerate(await pg.query_selector_all(".page")):
            await s.screenshot(path=str(OUT / ("page%d.png" % (i + 1))))
        await b.close()

asyncio.run(main())
