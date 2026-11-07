import sys, pathlib
from playwright.sync_api import sync_playwright
d = pathlib.Path(__file__).parent
out = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "/tmp/aff14"); out.mkdir(parents=True, exist_ok=True)
with sync_playwright() as p:
    b = p.chromium.launch()
    for name, w, h in (("a4", 794, 1123), ("story", 1080, 1920)):
        pg = b.new_page(viewport={"width": w, "height": h}, device_scale_factor=2)
        pg.goto((d / (name + ".html")).as_uri()); pg.wait_for_timeout(600)
        over = pg.evaluate("(() => { const p = document.querySelector('.page'); return p.scrollHeight - p.clientHeight; })()")
        print(name, "debordement", over)
        pg.screenshot(path=str(out / (name + ".png")), clip={"x": 0, "y": 0, "width": w, "height": h})
        if name == "a4":
            pg.pdf(path=str(out / "a4.pdf"), width="210mm", height="297mm", print_background=True, page_ranges="1")
        pg.close()
    b.close()
