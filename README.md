# SODAF Auto-École · Site officiel

Site public de SODAF (Togo) : accueil, formations, cours du manuel, quiz, outils, documents, carnet de l'élève et pré-inscription reliée à Airtable.

- Tout le site tient dans `index.html` (aucune étape de construction).
- Hébergement : GitHub Pages sur https://autosodaf.com, mise en ligne automatique à chaque modification de la branche `main`.
- Les pré-inscriptions sont envoyées à l'automatisation Airtable « Site → Nouvelle inscription » (base SODAF Auto-École).

## Structure (octobre 2026)
- `index.html` : site public. `equipe/index.html` : Espace équipe installable (application web, manifeste et service worker dans `equipe/`).
- `app.js` : code commun aux deux pages. **Après chaque modification, augmenter le numéro `?v=` dans les deux fichiers HTML** pour que les téléphones chargent la nouvelle version.
- Données : Supabase (voir `supabase/`).
