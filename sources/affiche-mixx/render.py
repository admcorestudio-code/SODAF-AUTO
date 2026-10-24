import asyncio,sys
from playwright.async_api import async_playwright
async def main(src,pdf,jpg,w,h):
  async with async_playwright() as p:
    b=await p.chromium.launch(); pg=await b.new_page(viewport={'width':w,'height':h},device_scale_factor=2)
    await pg.goto('file://'+src); await pg.wait_for_timeout(1500)
    sh=await pg.evaluate('document.body.scrollHeight'); print('height',sh)
    await pg.pdf(path=pdf,width=str(w)+'px',height=str(h)+'px',print_background=True,margin={'top':'0','right':'0','bottom':'0','left':'0'})
    await pg.screenshot(path=jpg.replace('.jpg','.png'),clip={'x':0,'y':0,'width':w,'height':h})
    await b.close()
asyncio.run(main(sys.argv[1],sys.argv[2],sys.argv[3],int(sys.argv[4]),int(sys.argv[5])))
