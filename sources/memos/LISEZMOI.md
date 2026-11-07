# Mémos de l'équipe (source)

- `build.py` : tout le texte des 3 mémos (secrétariat, moniteur, ambassadeurs ; la gérante n'existe plus depuis le 30 oct.). `memos.css` : la mise en page. `logo.svg.html` : le logo.
- Refaire : `python3 build.py && python3 render.py /tmp/memos` (affiche la marge restante de chaque page : `debordement` doit rester à 0).
- Puis : `/tmp/memos/memos-equipe-sodaf.pdf` → `entreprise/memos-equipe-sodaf.pdf`, une page par rôle → `entreprise/memo-<role>-sodaf.pdf`
  (pypdf), `pdftoppm -jpeg -r 150 -singlefile` → `doc-img/memos-sodaf/memo-<role>-sodaf.jpg`, zip des 4 images →
  `entreprise/memos-equipe-sodaf-images.zip`, aperçu 240 px de la page 1 → `entreprise/apercu-memos.jpg`.
- Dernière mise à jour : 7 nov. 2026 (groupes dans l'ordre A à F : C mercredi, D et E le soir, F dimanche ; mercredi = Groupe C, plus de cours ouvert ; 6 nov. : dimanche : Groupe H et conduite, pas annoncé ; ambassadeurs : « maximum », après-midi ou soir, tirage le 1er samedi sans live ; 5 nov. : plus de devoir ni de rattrapage ; deux ambassadeurs, rôles chaque lundi ; petits frais 2 000 F, secrétariat ; 2 nov. : corps habillés au même prix que tous ; 28 oct. : formation privée seule en voiture, horaires 7 h 30 / 10 h, code A, B, F, G, séance en plus 3 000 F, Mixx en maintenance, mémo Ambassadeur ajouté).
