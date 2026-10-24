# Affiche de paiement Mixx (source)

- `affiche-a4.html` : affiche A4 pour le mur (794 × 1123 px).
- `affiche-a5.html` : petit format A5 pour le comptoir (794 × 559 px).
- Couleurs de l'agence : noir #14171C, jaune #F2B100, beige #EADFC8.
- Rendu :
  - `python3 render.py "$PWD/affiche-a4.html" /tmp/a4.pdf /tmp/a4.jpg 794 1123`
  - `python3 render.py "$PWD/affiche-a5.html" /tmp/a5.pdf /tmp/a5.jpg 794 559`
  - copier vers `/entreprise/affiche-mixx-a4.pdf` et `/entreprise/affiche-mixx-a5.pdf`
  - `pdftoppm -jpeg -r 150 -singlefile entreprise/affiche-mixx-a4.pdf doc-img/affiche-mixx-sodaf/affiche-mixx-a4` (idem A5)
  - aperçu `entreprise/apercu-affiche-mixx.jpg` (240 × 339) à partir de la capture PNG de l'A4.
- Le code marchand Mixx ne marche qu'avec Mixx by Yas (testé : pas avec Flooz). Si un code marchand Flooz est ouvert, ajouter les deux codes côte à côte.
- Dernière mise à jour : 24 oct. 2026.
