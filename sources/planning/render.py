from playwright.sync_api import sync_playwright
import pathlib
d=pathlib.Path(__file__).parent
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page()
    pg.goto((d/'planning.html').as_uri()); pg.wait_for_timeout(800)
    h=pg.evaluate("document.querySelector('.page').scrollHeight"); print('page h px', h, 'max', 210*96/25.4)
    pg.pdf(path=str(d/'planning-semaine-sodaf.pdf'), width='297mm', height='210mm', print_background=True)
    b.close()
