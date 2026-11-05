import pdfplumber, json, re, sys
SP=sys.argv[1]
A=[a for a in json.load(open(SP+'/cr/corrige.json')) if a['sur']=='oui' and a.get('image')]
pdf=pdfplumber.open(SP+'/cr/q.pdf')
# titres de questions : (page, top, n)
T=[]
RX=re.compile(r'^(?:c?Q-?uestions?)$')
for pi,p in enumerate(pdf.pages,1):
    lines=p.extract_text_lines()
    for l in lines:
        m=re.match(r'\s*c?Q-?uestions?\s*(?:[nN]\s*°\s*)?(\d+)\s*$', l['text'].replace('cQ-uestion','Question'))
        if m: T.append((pi,l['top'],int(m.group(1))))
pos={}
for k,(pi,top,n) in enumerate(T):
    nxt=T[k+1] if k+1<len(T) else None
    pos[n]=(pi,top,nxt)
# 368 n'a pas de titre : bloc = page 100 haut
out={}; miss=[]
for a in A:
    n=a['n']
    if n not in pos: miss.append(n); continue
    pi,top,nxt=pos[n]
    p=pdf.pages[pi-1]
    bottom = nxt[1] if nxt and nxt[0]==pi else p.height
    ims=[i for i in p.images if i['top']>=top-4 and i['bottom']<=bottom+4 and (i['x1']-i['x0'])*(i['bottom']-i['top'])>150]
    pg=p
    if not ims and nxt and nxt[0]!=pi:  # image en haut de la page suivante
        p2=pdf.pages[pi]; lim = nxt[1] if nxt[0]==pi+1 else p2.height
        ims=[i for i in p2.images if i['bottom']<=lim+4 and (i['x1']-i['x0'])*(i['bottom']-i['top'])>150]; pg=p2
    if not ims: miss.append(n); continue
    x0=max(0,min(i['x0'] for i in ims)-1); y0=max(0,min(i["top"] for i in ims)-1); x1=min(pg.width,max(i["x1"] for i in ims)+1); y1=min(pg.height,max(i["bottom"] for i in ims)+1)
    im=pg.crop((x0,y0,x1,y1)).to_image(resolution=170).original
    im=im.convert('RGB'); w=im.width
    if w>900: im=im.resize((900,int(im.height*900/w)))
    f='q%d.jpg'%n; im.save(SP+'/img/'+f,quality=82,optimize=True); out[n]=f
json.dump(out,open(SP+'/img/map.json','w'))
print('images',len(out),'sans image trouvee',miss)
