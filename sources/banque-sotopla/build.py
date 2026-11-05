# Banque SOTOPLA pour le site : data/sotopla.json (+ images data/sotopla-img/qN.jpg, faites par images.py).
# Garde seulement les réponses sûres (décision du propriétaire, 5 nov. 2026) et les questions à image dont l'image a été trouvée.
import json, pathlib
ICI = pathlib.Path(__file__).parent; RACINE = ICI.parent.parent
A = json.load(open(ICI / "corrige.json", encoding="utf-8"))
M = json.load(open(ICI / "images.json"))
L = "abcdefgh"; out = []
for a in A:
    if a["sur"] != "oui" or not a["reponses"]: continue
    im = M.get(str(a["n"]))
    if a.get("image") and not im: continue
    out.append({"n": a["n"], "q": a["question"], "c": a["choix"], "r": sorted(L.index(x) for x in a["reponses"]), "e": a["explication"], "k": a["cours"], "ch": a["chapitre"], "im": im})
(RACINE / "data" / "sotopla.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print(len(out), "questions", sum(1 for x in out if x["im"]), "avec image")
