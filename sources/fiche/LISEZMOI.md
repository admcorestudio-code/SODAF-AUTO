# Fiche de renseignement (source)

- `fiche.html` : la fiche des tarifs (A4, 794 × 1123 px).
- Rendu : `python3 render.py "$PWD/fiche.html" /tmp/fiche.pdf /tmp/fiche.jpg 794 1123`
  puis copier le PDF vers `/fiche-renseignement-sodaf.pdf`,
  `pdftoppm -jpeg -r 150 -singlefile fiche-renseignement-sodaf.pdf doc-img/fiche-sodaf/fiche-sodaf`
  et l'aperçu `apercu-fiche.jpg` (240 × 339) à partir de la capture PNG.
- Dernière mise à jour : 28 oct. 2026 (tarif corps habillés 50 000 F ; avant : formation privée 85 000 F, heures 7 h 30, SOTOPLA, pharmacie Yembla).
