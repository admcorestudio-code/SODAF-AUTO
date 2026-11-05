# Fiches de conduite des élèves (source)

- `build.py` : le texte et les 6 formules (nom, nombre de séances, durée, couleur). `fiche.css` : la mise en page A4 (794 × 1123 px).
- Polices dans `fonts/` (Figtree et Outfit, licence OFL), pour que le rendu marche sans internet.
- Refaire : `python3 build.py && python3 render.py /tmp/fc` (affiche `debordement`, qui doit rester à 0).
- Puis : `/tmp/fc/fiches-conduite-sodaf.pdf` → `entreprise/fiches-conduite-sodaf.pdf` ; une page par formule (pypdf) →
  `entreprise/fiche-conduite-<k>-sodaf.pdf` (k = complete, etudiant, rapide, remise, tirage, privee) ;
  `pdftoppm -jpeg -r 150 -singlefile` → `doc-img/fiches-conduite-sodaf/fiche-conduite-<k>-sodaf.jpg` ; zip des 6 images →
  `entreprise/fiches-conduite-sodaf-images.zip` ; aperçu 240 × 339 de la complète → `entreprise/apercu-fiches-conduite.jpg`.
- Si un prix ou un nombre de séances change (sodaf-essentiel, section 2), changer `FORMULES` dans `build.py` et refaire.
- Créé le 5 nov. 2026.
