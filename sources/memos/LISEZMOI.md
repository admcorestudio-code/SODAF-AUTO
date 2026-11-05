# Mémos de l'équipe (source)

- `build.py` : tout le texte des 4 mémos (secrétariat, gérante, moniteur, Ambassadeur). `memos.css` : la mise en page. `logo.svg.html` : le logo.
- Refaire : `python3 build.py && python3 render.py /tmp/memos` (affiche la marge restante de chaque page : `debordement` doit rester à 0).
- Puis : `/tmp/memos/memos-equipe-sodaf.pdf` → `entreprise/memos-equipe-sodaf.pdf`, une page par rôle → `entreprise/memo-<role>-sodaf.pdf`
  (pypdf), `pdftoppm -jpeg -r 150 -singlefile` → `doc-img/memos-sodaf/memo-<role>-sodaf.jpg`, zip des 4 images →
  `entreprise/memos-equipe-sodaf-images.zip`, aperçu 240 px de la page 1 → `entreprise/apercu-memos.jpg`.
- Dernière mise à jour : 5 nov. 2026 (plus de devoir ni de rattrapage, mercredi = journée normale ; 2 nov. : corps habillés au même prix que tous ; 28 oct. : formation privée seule en voiture, horaires 7 h 30 / 10 h, code A, B, F, G, séance en plus 3 000 F, Mixx en maintenance, mémo Ambassadeur ajouté).
